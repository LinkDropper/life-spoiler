import { readFile } from "fs/promises";
import path from "path";

import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

import { DailyOgImage, getColorSwatch } from "@/components/daily";
import { formatDailyDate } from "@/components/daily/format-date";
import { isDailyError } from "@/libs/daily/errors";
import { resolveKstDate } from "@/libs/daily/kst-date";
import { getSharedDailyCard } from "@/libs/daily/service";
import { logger } from "@/libs/logger";

export const runtime = "nodejs";

const SIZE = { width: 1200, height: 630 };
/** 토큰이 불변이라 CDN 캐시가 가능하다 */
const CACHE_CONTROL = "public, max-age=86400, s-maxage=86400, immutable";

/**
 * GET /daily/share/og?t=
 *
 * 공유 링크 미리보기 이미지. 토큰을 화이트리스트로 검증하고 사전 조회 결과만 그린다.
 * 이름·생년월일시·프로필 ID는 토큰에도 이미지에도 없다.
 */
export const GET = async (request: Request): Promise<Response> => {
  const token = new URL(request.url).searchParams.get("t");

  try {
    const card = getSharedDailyCard(token, resolveKstDate());
    const t = await getTranslations("daily");
    const font = await readFile(
      path.join(process.cwd(), "public/fonts/SB-M.otf")
    );

    const keywords = [
      {
        label: t("result.keywordColor"),
        value: card.color,
        swatch: getColorSwatch(card.colorSlug),
      },
      { label: t("result.keywordItem"), value: card.item },
      { label: t("result.keywordNumber"), value: String(card.number) },
      { label: t("result.keywordTime"), value: card.timeSlot },
    ];

    return new ImageResponse(
      <DailyOgImage
        date={t("share.dateLabel", {
          date: formatDailyDate(card.date, "ko"),
        })}
        eyebrow={t("share.eyebrow")}
        headline={card.headline}
        keywords={keywords}
        brand={t("share.brand")}
      />,
      {
        ...SIZE,
        fonts: [{ name: "SB", data: font, weight: 400, style: "normal" }],
        headers: { "Cache-Control": CACHE_CONTROL },
      }
    );
  } catch (error) {
    if (isDailyError(error) && error.code === "INVALID_SHARE_TOKEN") {
      return new Response(null, { status: 404 });
    }

    if (!isDailyError(error)) {
      logger.error(
        "[daily] 공유 OG 이미지 생성 실패",
        error instanceof Error ? error : new Error(String(error))
      );
    }

    return new Response(null, { status: 500 });
  }
};
