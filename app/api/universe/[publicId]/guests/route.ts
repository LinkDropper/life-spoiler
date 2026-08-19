import { NextResponse } from "next/server";

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

    return NextResponse.json(result, {
      status: result.isDuplicate ? 200 : 201,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
};
