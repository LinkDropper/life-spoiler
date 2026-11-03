import { NextResponse } from "next/server";
import { getLocale } from "next-intl/server";

import { buildChartSnapshot } from "@/libs/landing/chart-snapshot";
import { logger } from "@/libs/logger";
import { isLocale } from "@/libs/seo/site";
import { ZiweiInputSchema } from "@/libs/zi-wei-dou-shu";
import { defaultLocale } from "@/i18n/config";

/** 생년월일이 담긴 개인 결과라 어떤 응답이든 캐시에 남기지 않는다 */
const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" } as const;

const respond = (body: unknown, status: number): NextResponse =>
  NextResponse.json(body, { status, headers: NO_STORE_HEADERS });

const RequestSchema = ZiweiInputSchema.pick({
  birthDate: true,
  birthTime: true,
  gender: true,
  calendarType: true,
});

/**
 * POST /api/landing/chart
 *
 * 랜딩의 "내 명반 그려보기". 로그인 없이 생년월일시로 명반 요약을 돌려준다.
 * 순수 계산만 하고 입력값은 저장하지도, 로그에 남기지도 않는다.
 * 프로필에 윤달 정보가 없어서 윤달 입력은 받지 않는다(랜딩 결과와 본편 결과가 어긋나지 않게).
 */
export const POST = async (request: Request): Promise<NextResponse> => {
  const body: unknown = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);

  if (!parsed.success) {
    return respond(
      {
        error: {
          code: "INVALID_INPUT",
          message: "생년월일과 시간을 다시 확인해주세요.",
        },
      },
      400
    );
  }

  try {
    const rawLocale = await getLocale();
    const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
    const snapshot = buildChartSnapshot(
      { name: "landing", ...parsed.data },
      locale
    );
    return respond({ snapshot }, 200);
  } catch (error) {
    // 입력값(생년월일)은 개인정보라 로그에 넣지 않는다
    logger.error(
      "[landing] 명반 계산 중 오류",
      error instanceof Error ? error : new Error(String(error))
    );
    return respond(
      {
        error: {
          code: "CHART_FAILED",
          message: "명반을 그리지 못했어요. 잠시 후 다시 시도해주세요.",
        },
      },
      500
    );
  }
};
