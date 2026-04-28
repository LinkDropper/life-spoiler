import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

import { generateFaceReport } from "@/libs/face-spoiler/face-report";
import { isFaceReport } from "@/libs/face-spoiler/types";
import { createAuthClient, createServerClient } from "@/libs/supabase";

import type { FaceReportData } from "@/libs/face-spoiler/types";
import type { FaceReportInsert, Json } from "@/libs/supabase";

const STORAGE_BUCKET = "face-images";

/**
 * 리포트 캐시 사용 여부.
 * - 프로덕션: 항상 캐시 사용 (LLM 호출 절약)
 * - 개발(NODE_ENV=development): 캐시 스킵 기본 — 프롬프트/로직 변경 시 같은 사진으로
 *   즉시 재생성 검증 가능. `FACE_SPOILER_FORCE_CACHE=true` 로 강제 활성화 가능.
 *
 * 주의: 캐시 스킵이어도 `existingRow` 조회는 수행한다 (UPDATE로 유니크 제약 충돌 회피).
 */
const shouldUseCache =
  process.env.NODE_ENV === "production" ||
  process.env.FACE_SPOILER_FORCE_CACHE === "true";

interface GenerateRequestBody {
  imagePath?: string;
  imageHash?: string;
  profileId?: string;
}

/**
 * 기존 `face_reports` 행 탐색 결과.
 * DB 유니크 제약이 `(user_id, image_hash)` 라서 face_profile_id와 무관하게 1건만 존재.
 */
interface ExistingReportRow {
  share_id: string;
  result: unknown;
  face_profile_id: string;
  paid_at: string | null;
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
    const { imagePath, imageHash, profileId } = body;

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

    // ────────────────────────────────────────────────────────
    // 단계 1. 기존 행 탐색 — DB 유니크 제약이 `(user_id, image_hash)` 이므로
    //         face_profile_id와 무관하게 1건만 존재할 수 있다.
    //         legacy(v2/v3) 행이 있으면 DELETE/INSERT 대신 UPDATE로 업그레이드 →
    //         유니크 제약 충돌 방지 + paid_at 보존.
    // ────────────────────────────────────────────────────────
    const { data: existingRowRaw } = await adminClient
      .from("face_reports")
      .select("share_id, result, face_profile_id, paid_at")
      .eq("user_id", user.id)
      .eq("image_hash", imageHash)
      .maybeSingle();
    const existingRow = existingRowRaw as unknown as ExistingReportRow | null;

    // 이미 v4(새 스키마) 리포트가 있으면 즉시 재사용 (prod 기본 / dev에서는 캐시 스킵 가능)
    if (shouldUseCache && existingRow && isFaceReport(existingRow.result)) {
      // 프로필이 다르면 현재 프로필로 귀속 이동
      if (existingRow.face_profile_id !== profileId) {
        const reportsTable = adminClient.from(
          "face_reports"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ) as any;
        const { error: updateError } = await reportsTable
          .update({ face_profile_id: profileId })
          .eq("share_id", existingRow.share_id);

        if (updateError) {
          console.error("face_reports profile_id update error:", updateError);
        }
      }
      // 이번 업로드 본은 중복이므로 정리
      await adminClient.storage.from(STORAGE_BUCKET).remove([imagePath]);
      return NextResponse.json({
        cached: true,
        shareId: existingRow.share_id,
      });
    }

    if (!shouldUseCache) {
      console.log(
        "[face-spoiler] NODE_ENV=development — 리포트 캐시 스킵, 새 OpenAI 호출 실행"
      );
    }

    // ────────────────────────────────────────────────────────
    // 단계 2. 글로벌 v4 캐시 — 다른 유저의 v4 결과가 있으면 재사용
    //         existingRow(legacy)가 있으면 UPDATE, 없으면 INSERT.
    //         dev 환경에서는 이 단계도 스킵해 항상 새 응답을 받는다.
    // ────────────────────────────────────────────────────────
    if (shouldUseCache) {
      const { data: globalCachedReportRaw } = await adminClient
        .from("face_reports")
        .select("result")
        .eq("image_hash", imageHash)
        .not("result", "is", null)
        .order("created_at", { ascending: true })
        .limit(10);
      const globalCachedReports = (globalCachedReportRaw ??
        []) as unknown as Array<{ result: Json }>;
      const globalHit = globalCachedReports.find((row) =>
        isFaceReport(row.result)
      );

      if (globalHit && globalHit.result) {
        const saveResult = await upsertReport({
          adminClient,
          existingRow,
          userId: user.id,
          profileId,
          imageHash,
          imagePath,
          reportResult: globalHit.result,
        });
        if (!saveResult.ok) {
          await adminClient.storage.from(STORAGE_BUCKET).remove([imagePath]);
          return NextResponse.json(
            { error: "리포트 저장에 실패했습니다." },
            { status: 500 }
          );
        }
        return NextResponse.json({
          cached: false,
          shareId: saveResult.shareId,
        });
      }
    }

    // ────────────────────────────────────────────────────────
    // 단계 3. 캐시 없음 → Storage에서 다운로드 후 단일 OpenAI 호출
    // ────────────────────────────────────────────────────────
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
      // 단일 OpenAI 호출 — NEW_PROMPT + 사진 입력, json_schema strict로 sections 강제.
      const sections = await generateFaceReport({
        imageBase64: base64,
        mimeType,
      });

      const reportData: FaceReportData = {
        version: 5,
        sections,
        generatedAt: new Date().toISOString(),
      };

      const saveResult = await upsertReport({
        adminClient,
        existingRow,
        userId: user.id,
        profileId,
        imageHash,
        imagePath,
        reportResult: reportData as unknown as Json,
      });

      if (!saveResult.ok) {
        await adminClient.storage.from(STORAGE_BUCKET).remove([imagePath]);
        return NextResponse.json(
          { error: "리포트 저장에 실패했습니다." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        cached: false,
        shareId: saveResult.shareId,
      });
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

// ════════════════════════════════════════════════════════════
// 보조: 기존 행이 있으면 UPDATE, 없으면 INSERT.
// 유니크 제약 `(user_id, image_hash)` 충돌 방지의 단일 진입점.
// ════════════════════════════════════════════════════════════

interface UpsertArgs {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminClient: any;
  existingRow: ExistingReportRow | null;
  userId: string;
  profileId: string;
  imageHash: string;
  imagePath: string;
  reportResult: Json;
}

type UpsertResult =
  | { ok: true; shareId: string }
  | { ok: false; error: unknown };

const upsertReport = async ({
  adminClient,
  existingRow,
  userId,
  profileId,
  imageHash,
  imagePath,
  reportResult,
}: UpsertArgs): Promise<UpsertResult> => {
  if (existingRow) {
    // legacy → v4 업그레이드. share_id / paid_at 보존.
    const { error: updateError } = await adminClient
      .from("face_reports")
      .update({
        result: reportResult,
        face_profile_id: profileId,
        original_image_path: imagePath,
      })
      .eq("share_id", existingRow.share_id);

    if (updateError) {
      console.error("face_reports update error:", updateError);
      return { ok: false, error: updateError };
    }
    return { ok: true, shareId: existingRow.share_id };
  }

  // 신규 행 insert
  const shareId = nanoid(10);
  const insertPayload: FaceReportInsert = {
    share_id: shareId,
    user_id: userId,
    face_profile_id: profileId,
    image_hash: imageHash,
    result: reportResult,
    paid_at: null,
    original_image_path: imagePath,
  };

  const { error: insertError } = await adminClient
    .from("face_reports")
    .insert(insertPayload);

  if (insertError) {
    console.error("face_reports insert error:", insertError);
    return { ok: false, error: insertError };
  }
  return { ok: true, shareId };
};
