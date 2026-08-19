import { NextResponse } from "next/server";

import {
  guestStarSeedCookieName,
  OWNER_TOKEN_MAX_AGE_SECONDS,
} from "@/libs/universe/constants";
import { universeNotFound, validationFailed } from "@/libs/universe/errors";
import { parseJsonBody, toErrorResponse } from "@/libs/universe/http";
import { isValidPublicId, resolveIpHash } from "@/libs/universe/identity";
import { submitGuest } from "@/libs/universe/service";
import {
  firstIssueMessage,
  GuestSubmitSchema,
} from "@/libs/universe/validation";

interface RouteContext {
  params: Promise<{ publicId: string }>;
}

/**
 * POST /api/universe/{publicId}/guests — 친구 별 등록 + 궁합 계산
 *
 * 계산은 순수 동기 함수(LLM/네트워크 없음)이며 결과를 스냅샷으로 저장한다.
 * 동일 조합 재제출은 에러가 아니라 업서트로 처리하고 `isDuplicate: true`로 알린다(E1).
 */
export const POST = async (request: Request, context: RouteContext) => {
  try {
    const { publicId } = await context.params;

    if (!isValidPublicId(publicId)) {
      throw universeNotFound();
    }

    const body = await parseJsonBody(request);
    const parsed = GuestSubmitSchema.safeParse(body);

    if (!parsed.success) {
      throw validationFailed(firstIssueMessage(parsed.error));
    }

    const creatorIpHash = resolveIpHash(request);
    const result = await submitGuest(publicId, parsed.data, creatorIpHash);

    const response = NextResponse.json(result, {
      status: result.isDuplicate ? 200 : 201,
    });

    // 재제출(업서트)이어도 "참여함" 상태는 동일하므로 duplicate 여부와 무관하게 심는다.
    response.cookies.set({
      name: guestStarSeedCookieName(publicId),
      value: result.starSeed,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: OWNER_TOKEN_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    return toErrorResponse(error);
  }
};
