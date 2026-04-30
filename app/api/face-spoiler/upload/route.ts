import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

import { computeImageHash } from "@/libs/face-spoiler/image-hash";
import { isFaceReport } from "@/libs/face-spoiler/types";
import { createAuthClient, createServerClient } from "@/libs/supabase";

const STORAGE_BUCKET = "face-images";

const isProduction = process.env.NODE_ENV === "production";

/**
 * dev 환경에서는 캐시 스킵 — 동일 사진으로 재업로드 시에도 generate API가 호출되어
 * 최신 프롬프트로 리포트가 재생성되도록 한다.
 */
const shouldUseCache =
  isProduction || process.env.FACE_SPOILER_FORCE_CACHE === "true";

/**
 * dev 환경에서는 동일 이미지여도 매 업로드마다 다른 `image_hash` 를 사용.
 * - `(user_id, image_hash)` DB 유니크 제약은 건드리지 않고
 * - 반복 테스트 시 프로필별로 독립된 리포트 행이 생성되도록 함
 * - 프로덕션은 결정적 해시 그대로 사용해 캐시·재사용 동작 유지
 */
const makeEffectiveImageHash = (deterministicHash: string): string =>
  isProduction ? deterministicHash : `${deterministicHash}-${nanoid(8)}`;

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

    const formData = await request.formData();
    const imageFile = formData.get("image");
    const profileIdEntry = formData.get("profileId");

    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json(
        { error: "이미지 파일이 없습니다." },
        { status: 400 }
      );
    }

    if (typeof profileIdEntry !== "string" || !profileIdEntry) {
      return NextResponse.json(
        { error: "프로필 정보가 필요합니다." },
        { status: 400 }
      );
    }

    const profileId = profileIdEntry;

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

    const arrayBuffer = await imageFile.arrayBuffer();
    const baseHash = computeImageHash(arrayBuffer);
    // dev 환경에서는 suffix 추가로 매번 새 해시 → 매번 새 행 생성.
    const imageHash = makeEffectiveImageHash(baseHash);

    const adminClient = createServerClient();

    // 캐시 체크 (prod 기본). dev에서는 캐시 스킵 — 업로드·generate 모두 통과시켜
    // 매번 새 Gemini 응답으로 리포트를 만든다.
    // DB 유니크 제약이 `(user_id, image_hash)` 이므로 동일 유저·해시 조합은 하나만 존재.
    if (shouldUseCache) {
      const { data: cachedReportRaw } = await adminClient
        .from("face_reports")
        .select("share_id, result")
        .eq("user_id", user.id)
        .eq("image_hash", imageHash)
        .maybeSingle();
      const cachedReport = cachedReportRaw as unknown as {
        share_id: string;
        result: unknown;
      } | null;

      if (cachedReport && isFaceReport(cachedReport.result)) {
        return NextResponse.json({
          cached: true,
          shareId: cachedReport.share_id,
        });
      }
    }

    // 임시 storage 업로드 (분석 후 삭제됨)
    const imagePath = `uploads/${user.id}/${profileId}/${imageHash}`;
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await adminClient.storage
      .from(STORAGE_BUCKET)
      .upload(imagePath, buffer, {
        contentType: imageFile.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "이미지 업로드에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      cached: false,
      imagePath,
      imageHash,
      profileId,
    });
  } catch (error) {
    console.error("Face upload error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
};
