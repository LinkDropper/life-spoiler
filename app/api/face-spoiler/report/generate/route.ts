import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

import { classifyAnimalType } from "@/libs/face-spoiler/animal-classifier";
import { generateFaceReport } from "@/libs/face-spoiler/gemini";
import { createAuthClient, createServerClient } from "@/libs/supabase";

import type { FaceMetrics } from "@/libs/face-spoiler/face-shape-analyzer";
import type { FaceReportData } from "@/libs/face-spoiler/types";
import type { FaceReportInsert, Json } from "@/libs/supabase";

const STORAGE_BUCKET = "face-images";

interface GenerateRequestBody {
  imagePath?: string;
  imageHash?: string;
  profileId?: string;
  faceShapeHint?: string;
  /**
   * 클라이언트(MediaPipe)에서 측정한 얼굴 수치 객체.
   * 코드 결정적 동물상 분류기 입력. 없으면 분류 실패.
   */
  faceMetrics?: FaceMetrics;
}

export const POST = async (request: Request) => {
  try {
    // 인증 가드
    const authClient = await createAuthClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as GenerateRequestBody;
    const { imagePath, imageHash, profileId, faceShapeHint, faceMetrics } =
      body;

    if (!imagePath || !imageHash || !profileId) {
      return NextResponse.json(
        { error: "imagePath, imageHash, profileId가 필요합니다." },
        { status: 400 }
      );
    }

    // imagePath가 해당 유저/프로필 소유인지 검증 (path traversal 방지)
    if (!imagePath.startsWith(`uploads/${user.id}/${profileId}/`)) {
      return NextResponse.json(
        { error: "잘못된 이미지 경로입니다." },
        { status: 403 }
      );
    }

    // 프로필 소유권 검증
    const { data: profile } = await authClient
      .from("face_profiles")
      .select("id")
      .eq("id", profileId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        { error: "프로필을 찾을 수 없습니다." },
        { status: 403 }
      );
    }

    const adminClient = createServerClient();

    // Tier 1: 프로필 단위 캐시 재확인 (race condition 대비)
    const { data: profileCachedReportRaw } = await adminClient
      .from("face_reports")
      .select("share_id")
      .eq("user_id", user.id)
      .eq("face_profile_id", profileId)
      .eq("image_hash", imageHash)
      .maybeSingle();
    const profileCachedReport = profileCachedReportRaw as unknown as {
      share_id: string;
    } | null;

    if (profileCachedReport) {
      // 캐시 hit: 이번 업로드는 중복이므로 정리
      await adminClient.storage.from(STORAGE_BUCKET).remove([imagePath]);
      return NextResponse.json({
        cached: true,
        shareId: profileCachedReport.share_id,
      });
    }

    // Tier 2: 글로벌 image_hash 캐시 — 다른 유저/프로필이 이미 분석했다면 결과 재사용
    const { data: globalCachedReportRaw } = await adminClient
      .from("face_reports")
      .select("result")
      .eq("image_hash", imageHash)
      .not("result", "is", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    const globalCachedReport = globalCachedReportRaw as unknown as {
      result: Json;
    } | null;

    if (globalCachedReport && globalCachedReport.result) {
      const shareId = nanoid(10);
      const insertPayload: FaceReportInsert = {
        share_id: shareId,
        user_id: user.id,
        face_profile_id: profileId,
        image_hash: imageHash,
        result: globalCachedReport.result,
        paid_at: null,
        original_image_path: imagePath,
      };

      const { error: insertError } =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (adminClient.from("face_reports") as any).insert(insertPayload);

      if (insertError) {
        console.error("face_reports insert error (global cache):", insertError);
        await adminClient.storage.from(STORAGE_BUCKET).remove([imagePath]);
        return NextResponse.json(
          { error: "리포트 저장에 실패했습니다." },
          { status: 500 }
        );
      }

      return NextResponse.json({ cached: false, shareId });
    }

    // Tier 3: 캐시 없음 — Storage에서 이미지 다운로드 후 Gemini 분석
    const { data: imageBlob, error: downloadError } = await adminClient.storage
      .from(STORAGE_BUCKET)
      .download(imagePath);

    if (downloadError || !imageBlob) {
      console.error("Storage download error:", downloadError);
      await adminClient.storage.from(STORAGE_BUCKET).remove([imagePath]);
      return NextResponse.json(
        { error: "이미지를 불러올 수 없습니다." },
        { status: 500 }
      );
    }

    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const mimeType = imageBlob.type || "image/jpeg";

    try {
      // 1단계: 동물상 분류 (코드 결정적) + LLM rationale 합성
      const animalMatch = await classifyAnimalType(
        base64,
        mimeType,
        faceShapeHint,
        faceMetrics
      );

      // 2단계: 텍스트 리포트 (동물상을 고정 입력으로, 창의성 유지)
      const textReport = await generateFaceReport(
        base64,
        mimeType,
        animalMatch,
        faceShapeHint
      );

      // route 레벨에서 v2 리포트 합성
      const reportData: FaceReportData = {
        version: 2,
        animalMatch,
        ...textReport,
      };

      // DB insert (미결제 상태 + 원본 경로 보관 → 결제 후 캐릭터 이미지 생성용)
      const shareId = nanoid(10);
      const insertPayload: FaceReportInsert = {
        share_id: shareId,
        user_id: user.id,
        face_profile_id: profileId,
        image_hash: imageHash,
        result: reportData as unknown as Json,
        paid_at: null,
        original_image_path: imagePath,
      };

      const { error: insertError } =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (adminClient.from("face_reports") as any).insert(insertPayload);

      if (insertError) {
        console.error("face_reports insert error:", insertError);
        // insert 실패 시 원본 정리 (보관 사유 소멸)
        await adminClient.storage.from(STORAGE_BUCKET).remove([imagePath]);
        return NextResponse.json(
          { error: "리포트 저장에 실패했습니다." },
          { status: 500 }
        );
      }

      return NextResponse.json({ cached: false, shareId });
    } catch (analysisError) {
      // 분석 실패 시 원본 이미지 정리
      await adminClient.storage.from(STORAGE_BUCKET).remove([imagePath]);
      throw analysisError;
    }
  } catch (error) {
    console.error("Face report generate error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
};
