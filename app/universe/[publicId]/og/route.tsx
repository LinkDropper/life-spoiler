import { readFile } from "fs/promises";
import path from "path";

import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

import { ScreeningOgImage } from "@/components/universe";
import { defaultLocale, locales } from "@/i18n/config";
import { logger } from "@/libs/logger";
import { UniverseError } from "@/libs/universe/errors";
import { isValidPublicId } from "@/libs/universe/identity";
import { buildSeatMap } from "@/libs/universe/seat-map";
import { getUniverseOgSummary } from "@/libs/universe/service";

import type { ScreeningOgSeat } from "@/components/universe";
import type { Locale } from "@/i18n/config";
import type { SeatCell } from "@/libs/universe/seat-map";

export const runtime = "nodejs";

const SIZE = { width: 1200, height: 630 };
/** 관객이 늘면 좌석이 바뀌므로 짧게 캐시한다 */
const CACHE_CONTROL = "public, max-age=600, s-maxage=600";

const SEAT_KIND: Record<SeatCell["kind"], ScreeningOgSeat> = {
  empty: "empty",
  guest: "guest",
  overflow: "overflow",
};

const resolveLocale = (value: string | null): Locale =>
  locales.find((locale) => locale === value) ?? defaultLocale;

/**
 * SB 폰트에는 일본어 한자가 없어 JA 이미지는 Noto Sans JP를 실제 쓰는 글자만 받아 보탠다.
 * 받지 못해도 이미지 생성은 계속한다 (한자만 빠지고 카드는 그려진다).
 */
const loadJapaneseFont = async (text: string): Promise<ArrayBuffer | null> => {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(cssUrl)).text();
    const fontUrl = css.match(/src: url\((.+?)\) format/)?.[1];
    if (!fontUrl) {
      return null;
    }
    return await (await fetch(fontUrl)).arrayBuffer();
  } catch (error) {
    logger.warn("[universe] 일본어 OG 폰트 로드 실패", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};

/**
 * GET /universe/{publicId}/og?locale=
 *
 * 친구 시사회 공유 미리보기 — 상영관 초대장.
 * 주최자 이름과 좌석 점유 여부만 그린다. 관객 이름·점수·생년월일시는 이미지에 없다.
 */
export const GET = async (
  request: Request,
  { params }: { params: Promise<{ publicId: string }> }
): Promise<Response> => {
  const { publicId } = await params;
  if (!isValidPublicId(publicId)) {
    return new Response(null, { status: 404 });
  }

  const locale = resolveLocale(new URL(request.url).searchParams.get("locale"));

  try {
    const { ownerName, guestCount, guests } =
      await getUniverseOgSummary(publicId);
    const t = await getTranslations({ locale, namespace: "universe.detail" });
    const tBrand = await getTranslations({ locale, namespace: "daily.share" });

    const seatMap = buildSeatMap(guests, null);
    const seatRows = seatMap.rows.map((row) => ({
      label: row.label,
      seats: row.cells.map((cell) => SEAT_KIND[cell.kind]),
    }));

    const texts = {
      kicker: t("inviteKind"),
      title: ownerName
        ? t("ogTitleWithName", { name: ownerName })
        : t("ogTitle"),
      audience:
        guestCount > 0
          ? t("audienceCount", { count: guestCount })
          : t("emptyTitle"),
      cta: t("ogCta"),
      brand: tBrand("brandLogo"),
      admit: t("inviteAdmit"),
      screen: t("screen"),
    };

    const font = await readFile(
      path.join(process.cwd(), "public/fonts/SB-M.otf")
    );
    const fonts: NonNullable<
      ConstructorParameters<typeof ImageResponse>[1]
    >["fonts"] = [{ name: "SB", data: font, weight: 400, style: "normal" }];

    if (locale === "ja") {
      const jaFont = await loadJapaneseFont(Object.values(texts).join(""));
      if (jaFont) {
        fonts.push({
          name: "NotoSansJP",
          data: jaFont,
          weight: 400,
          style: "normal",
        });
      }
    }

    return new ImageResponse(
      <ScreeningOgImage {...texts} seatRows={seatRows} />,
      {
        ...SIZE,
        fonts,
        headers: { "Cache-Control": CACHE_CONTROL },
      }
    );
  } catch (error) {
    if (error instanceof UniverseError && error.code === "UNIVERSE_NOT_FOUND") {
      return new Response(null, { status: 404 });
    }

    logger.error(
      "[universe] 공유 OG 이미지 생성 실패",
      error instanceof Error ? error : new Error(String(error))
    );
    return new Response(null, { status: 500 });
  }
};
