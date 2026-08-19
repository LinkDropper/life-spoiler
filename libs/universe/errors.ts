/** 친구 우주 궁합 API 에러 코드 (PRD "에러 처리" 절) */
export type UniverseErrorCode =
  | "UNIVERSE_NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CALCULATION_ERROR"
  | "RATE_LIMITED"
  | "UNIVERSE_FULL"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<UniverseErrorCode, number> = {
  UNIVERSE_NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  CALCULATION_ERROR: 400,
  RATE_LIMITED: 429,
  UNIVERSE_FULL: 409,
  INTERNAL_ERROR: 500,
};

/**
 * 사용자에게 그대로 노출되는 한국어 메시지를 담는 에러.
 * (에러 메시지 한국어 작성 규칙 — `.claude/rules/error-handling.md`)
 */
export class UniverseError extends Error {
  readonly code: UniverseErrorCode;
  readonly status: number;

  constructor(code: UniverseErrorCode, message: string) {
    super(message);
    this.name = "UniverseError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
  }
}

export const universeNotFound = () =>
  new UniverseError("UNIVERSE_NOT_FOUND", "존재하지 않는 우주예요.");

export const universeFull = () =>
  new UniverseError("UNIVERSE_FULL", "이 우주는 참여 인원이 가득 찼어요.");

export const rateLimited = () =>
  new UniverseError("RATE_LIMITED", "잠시 후 다시 시도해주세요.");

export const validationFailed = (message: string) =>
  new UniverseError("VALIDATION_ERROR", message);

export const calculationFailed = () =>
  new UniverseError("CALCULATION_ERROR", "입력값을 다시 확인해주세요.");
