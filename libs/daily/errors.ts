/** 오늘의 운세 에러 코드 (PRD "에러 처리 / 엣지 케이스" 절) */
export type DailyErrorCode =
  | "INVALID_SHARE_TOKEN"
  | "INVALID_DATE"
  | "PROFILE_NOT_FOUND"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "CALCULATION_FAILED"
  | "DICTIONARY_MISS";

const STATUS_BY_CODE: Record<DailyErrorCode, number> = {
  INVALID_SHARE_TOKEN: 400,
  INVALID_DATE: 400,
  PROFILE_NOT_FOUND: 404,
  FORBIDDEN: 403,
  UNAUTHORIZED: 401,
  CALCULATION_FAILED: 500,
  DICTIONARY_MISS: 500,
};

/**
 * 오늘의 운세 도메인 에러.
 *
 * `context`에는 슬러그·날짜 같은 비개인 정보만 담는다.
 * 명반·생년월일시·이름·프로필 ID는 로그와 에러 리포트에 남기지 않는다.
 */
export class DailyError extends Error {
  readonly code: DailyErrorCode;
  readonly status: number;
  readonly context: Record<string, string | number>;

  constructor(
    code: DailyErrorCode,
    message: string,
    context: Record<string, string | number> = {}
  ) {
    super(message);
    this.name = "DailyError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.context = context;
    Object.setPrototypeOf(this, DailyError.prototype);
  }
}

export const isDailyError = (error: unknown): error is DailyError =>
  error instanceof DailyError;
