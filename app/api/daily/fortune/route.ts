import { NextResponse } from "next/server";

import { logger } from "@/libs/logger";
import { isDailyError } from "@/libs/daily/errors";
import { resolveKstDate } from "@/libs/daily/kst-date";
import { loadOwnedDailyProfile } from "@/libs/daily/profile-access";
import { getDailyFortuneView } from "@/libs/daily/service";

/** 개인 결과라 어떤 응답이든 공유 캐시/CDN에 남기지 않는다 */
const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" } as const;

const respond = (body: unknown, status: number): NextResponse =>
  NextResponse.json(body, { status, headers: NO_STORE_HEADERS });

/**
 * GET /api/daily/fortune?profileId=
 *
 * 자정(KST) 이후 복귀 시 클라이언트가 재조회하는 용도. 로그인 필수, 본인 프로필만.
 * 개발용 `date` 오버라이드는 production이 아닐 때만 적용된다.
 */
export const GET = async (request: Request): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    if (!profileId) {
      return respond(
        {
          error: {
            code: "PROFILE_NOT_FOUND",
            message: "프로필을 찾을 수 없어요.",
          },
        },
        400
      );
    }

    const profile = await loadOwnedDailyProfile(profileId);
    const kstDate = resolveKstDate({ override: searchParams.get("date") });
    const view = getDailyFortuneView({
      input: profile.input,
      kstDate,
      hasLifetime: profile.hasLifetime,
    });

    return respond({ data: view }, 200);
  } catch (error) {
    if (isDailyError(error)) {
      return respond(
        { error: { code: error.code, message: error.message } },
        error.status
      );
    }

    logger.error(
      "[daily] 오늘의 운세 조회 중 오류",
      error instanceof Error ? error : new Error(String(error))
    );

    return respond(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
        },
      },
      500
    );
  }
};
