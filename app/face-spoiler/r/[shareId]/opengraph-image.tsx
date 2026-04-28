import { readFile } from "fs/promises";
import { ImageResponse } from "next/og";
import path from "path";

import { env } from "@/env";
import { createServerClient } from "@/libs/supabase";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

const CHARACTER_BUCKET = "face-characters";

const BG_COLOR = "#e4b570";
const TEXT_DARK = "#1A1A1A";
const TEXT_MID = "#2D2D2D";

interface Props {
  params: Promise<{ shareId: string }>;
}

export default async function OpengraphImage({ params }: Props) {
  const { shareId } = await params;

  const [fontLotteria, fontSBMedium] = await Promise.all([
    readFile(path.join(process.cwd(), "public/fonts/LotteriaDdag.ttf")),
    readFile(path.join(process.cwd(), "public/fonts/SB-M.otf")),
  ]);

  const adminClient = createServerClient();
  const { data } = await adminClient
    .from("face_reports")
    .select("character_image_path")
    .eq("share_id", shareId)
    .maybeSingle();

  let characterImageUrl: string | null = null;
  if (data) {
    const record = data as { character_image_path: string | null };
    if (record.character_image_path && env.NEXT_PUBLIC_SUPABASE_URL) {
      characterImageUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${CHARACTER_BUCKET}/${record.character_image_path}`;
    }
  }

  const jsx = (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        backgroundColor: BG_COLOR,
        fontFamily: "LotteriaDdag",
        alignItems: "flex-end",
      }}
    >
      {/* 좌측: 캐릭터 이미지 영역 */}
      <div
        style={{
          display: "flex",
          width: "58%",
          height: "100%",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {characterImageUrl ? (
          <img
            src={characterImageUrl}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "bottom center",
            }}
          />
        ) : (
          <div style={{ display: "flex", flex: 1 }} />
        )}
      </div>

      {/* 우측: 텍스트 영역 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          flex: 1,
          paddingLeft: 48,
          paddingRight: 48,
          paddingBottom: 48,
          gap: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontFamily: "SB",
            fontSize: 28,
            fontWeight: 400,
            color: TEXT_MID,
            lineHeight: 1.55,
          }}
        >
          사진 한 장으로 보는 관상 리포트
        </div>

        <div
          style={{
            fontSize: 104,
            fontWeight: 400,
            color: TEXT_DARK,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          관상스포
        </div>
      </div>
    </div>
  );

  return new ImageResponse(jsx, {
    ...size,
    fonts: [
      { name: "LotteriaDdag", data: fontLotteria, weight: 400 },
      { name: "SB", data: fontSBMedium, weight: 400 },
    ],
  });
}
