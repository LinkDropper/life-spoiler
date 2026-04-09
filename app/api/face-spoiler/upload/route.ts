import { NextResponse } from "next/server";

import { computeImageHash } from "@/libs/face-spoiler/image-hash";
import { createAuthClient, createServerClient } from "@/libs/supabase";

const STORAGE_BUCKET = "face-images";

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
    const imageHash = computeImageHash(arrayBuffer);

    const adminClient = createServerClient();

    // 캐시 체크: 동일 프로필의 동일 이미지 리포트가 이미 있으면 재사용
    const { data: cachedReportRaw } = await adminClient
      .from("face_reports")
      .select("share_id")
      .eq("user_id", user.id)
      .eq("face_profile_id", profileId)
      .eq("image_hash", imageHash)
      .maybeSingle();
    const cachedReport = cachedReportRaw as unknown as {
      share_id: string;
    } | null;

    if (cachedReport) {
      return NextResponse.json({
        cached: true,
        shareId: cachedReport.share_id,
      });
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
