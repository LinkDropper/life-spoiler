import { NextResponse } from "next/server";

import { logger } from "@/libs/logger";

import { UniverseError } from "./errors";

/**
 * 라우트 핸들러 공통 에러 응답.
 *
 * 사용자에게 보여줄 메시지를 가진 `UniverseError`만 그대로 노출하고,
 * 그 외 예외는 내부 메시지를 감춘 채 로깅한다(DB 에러 문구가 그대로 나가면
 * 스키마 정보가 새어나간다).
 */
export const toErrorResponse = (error: unknown): NextResponse => {
  if (error instanceof UniverseError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status }
    );
  }

  logger.error(
    "[universe] 처리 중 오류",
    error instanceof Error ? error : new Error(String(error))
  );

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
      },
    },
    { status: 500 }
  );
};

/** 요청 본문 JSON 파싱 (형식 오류를 검증 에러로 환원) */
export const parseJsonBody = async (request: Request): Promise<unknown> => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};
