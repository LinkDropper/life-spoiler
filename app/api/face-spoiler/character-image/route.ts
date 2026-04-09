import { NextResponse } from "next/server";

import { generateCharacterImage } from "@/libs/face-spoiler/character-image";
import { createAuthClient, createServerClient } from "@/libs/supabase";

const ORIGINAL_BUCKET = "face-images";
const CHARACTER_BUCKET = "face-characters";

interface CharacterRequestBody {
  shareId?: string;
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

    const body = (await request.json()) as CharacterRequestBody;
    const { shareId } = body;

    if (!shareId) {
      return NextResponse.json(
        { error: "shareId가 필요합니다." },
        { status: 400 }
      );
    }

    const adminClient = createServerClient();

    // 리포트 조회
    const { data: report, error: reportError } = await adminClient
      .from("face_reports")
      .select(
        "id, user_id, paid_at, original_image_path, character_image_path"
      )
      .eq("share_id", shareId)
      .maybeSingle();

    if (reportError || !report) {
      return NextResponse.json(
        { error: "리포트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 소유권 검증
    if (report.user_id !== user.id) {
      return NextResponse.json(
        { error: "접근 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 결제 검증
    if (!report.paid_at) {
      return NextResponse.json(
        { error: "결제되지 않은 리포트입니다." },
        { status: 402 }
      );
    }

    // 이미 생성된 경우 기존 경로 반환
    if (report.character_image_path) {
      return NextResponse.json({
        cached: true,
        characterImagePath: report.character_image_path,
      });
    }

    // 원본 이미지 확인 (TTL 만료 시 null일 수 있음)
    if (!report.original_image_path) {
      return NextResponse.json(
        {
          error:
            "원본 이미지가 만료되어 캐릭터 이미지를 생성할 수 없습니다. 재업로드가 필요합니다.",
        },
        { status: 410 }
      );
    }

    // 원본 이미지 다운로드
    const { data: sourceBlob, error: downloadError } = await adminClient.storage
      .from(ORIGINAL_BUCKET)
      .download(report.original_image_path);

    if (downloadError || !sourceBlob) {
      console.error("Original image download error:", downloadError);
      return NextResponse.json(
        { error: "원본 이미지를 불러올 수 없습니다." },
        { status: 500 }
      );
    }

    const sourceArrayBuffer = await sourceBlob.arrayBuffer();
    const sourceBase64 = Buffer.from(sourceArrayBuffer).toString("base64");
    const sourceMimeType = sourceBlob.type || "image/jpeg";

    // Gemini로 캐릭터 이미지 생성
    const generated = await generateCharacterImage(
      sourceBase64,
      sourceMimeType
    );

    // 영구 저장 (face-characters 버킷, public)
    const extension = generated.mimeType.includes("png")
      ? "png"
      : generated.mimeType.includes("webp")
        ? "webp"
        : "jpg";
    const characterPath = `characters/${user.id}/${shareId}.${extension}`;
    const characterBuffer = Buffer.from(generated.base64, "base64");

    const { error: uploadError } = await adminClient.storage
      .from(CHARACTER_BUCKET)
      .upload(characterPath, characterBuffer, {
        contentType: generated.mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Character upload error:", uploadError);
      return NextResponse.json(
        { error: "캐릭터 이미지 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    // DB 업데이트 + 원본 정리
    const { error: updateError } = await adminClient
      .from("face_reports")
      .update({
        character_image_path: characterPath,
        character_image_generated_at: new Date().toISOString(),
        original_image_path: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", report.id);

    if (updateError) {
      console.error("face_reports update error:", updateError);
      return NextResponse.json(
        { error: "리포트 업데이트에 실패했습니다." },
        { status: 500 }
      );
    }

    // 원본 삭제 (캐릭터 생성 완료 → 더 이상 필요 없음)
    await adminClient.storage
      .from(ORIGINAL_BUCKET)
      .remove([report.original_image_path]);

    return NextResponse.json({
      cached: false,
      characterImagePath: characterPath,
    });
  } catch (error) {
    console.error("Character image generate error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
};
