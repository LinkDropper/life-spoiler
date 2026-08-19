import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { guestStarSeedCookieName } from "@/libs/universe/constants";
import { universeNotFound } from "@/libs/universe/errors";
import { toErrorResponse } from "@/libs/universe/http";
import { isValidPublicId } from "@/libs/universe/identity";
import { getUniverseDetail } from "@/libs/universe/service";

interface RouteContext {
  params: Promise<{ publicId: string }>;
}

/**
 * GET /api/universe/{publicId} — 우주 상세 + 친구 목록
 *
 * 응답에는 owner/guest의 생년월일시가 일절 포함되지 않는다(개인정보 B안).
 * 조회 계층에서 애초에 해당 컬럼을 select 하지 않는다 — `libs/universe/repository.ts` 참조.
 */
export const GET = async (_request: Request, context: RouteContext) => {
  try {
    const { publicId } = await context.params;

    // 형식이 어긋나면 DB를 때리지 않고 바로 차단한다 (열거 시도 비용 절감)
    if (!isValidPublicId(publicId)) {
      throw universeNotFound();
    }

    const cookieStore = await cookies();
    const selfStarSeed =
      cookieStore.get(guestStarSeedCookieName(publicId))?.value ?? null;
    const detail = await getUniverseDetail(publicId, selfStarSeed);

    return NextResponse.json(detail);
  } catch (error) {
    return toErrorResponse(error);
  }
};
