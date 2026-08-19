import { NextResponse } from "next/server";

import { sendUniverseCreatedNotification } from "@/libs/discord";
import {
  OWNER_TOKEN_COOKIE,
  OWNER_TOKEN_MAX_AGE_SECONDS,
} from "@/libs/universe/constants";
import { validationFailed } from "@/libs/universe/errors";
import { parseJsonBody, toErrorResponse } from "@/libs/universe/http";
import { resolveIpHash } from "@/libs/universe/identity";
import { createUniverse } from "@/libs/universe/service";
import {
  firstIssueMessage,
  UniverseCreateSchema,
} from "@/libs/universe/validation";

import type { UniverseCreateResultDto } from "@/libs/universe/types";

/**
 * POST /api/universe — owner 우주 생성 (로그인 불필요, 완전 익명)
 *
 * owner 소유권 토큰은 응답 바디가 아니라 HttpOnly 쿠키로만 전달한다.
 * (localStorage는 XSS로 탈취 가능하므로 채택하지 않음 — PRD 확정)
 */
export const POST = async (request: Request) => {
  try {
    const body = await parseJsonBody(request);
    const parsed = UniverseCreateSchema.safeParse(body);

    if (!parsed.success) {
      throw validationFailed(firstIssueMessage(parsed.error));
    }

    const creatorIpHash = resolveIpHash(request);
    const { publicId, ownerToken } = await createUniverse(
      parsed.data,
      creatorIpHash
    );

    // 알림 실패가 우주 생성 실패로 이어지면 안 되므로 fire-and-forget으로 호출한다.
    sendUniverseCreatedNotification({
      ownerName: parsed.data.ownerName ?? null,
      publicId,
      createdAt: new Date().toISOString(),
    }).catch((error) => {
      console.error("[universe] 생성 알림 전송 실패:", error);
    });

    const payload: UniverseCreateResultDto = { publicId };
    const response = NextResponse.json(payload, { status: 201 });

    response.cookies.set({
      name: OWNER_TOKEN_COOKIE,
      value: ownerToken,
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
