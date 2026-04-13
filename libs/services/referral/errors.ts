export type ReferralErrorCode =
  | "SELF_REFERRAL"
  | "INVALID_REFERRER"
  | "ALREADY_REWARDED"
  | "DATABASE_ERROR";

const ERROR_MESSAGES: Record<ReferralErrorCode, string> = {
  SELF_REFERRAL: "자기 자신을 레퍼럴할 수 없습니다.",
  INVALID_REFERRER: "존재하지 않는 공유자입니다.",
  ALREADY_REWARDED: "이미 보상이 지급되었습니다.",
  DATABASE_ERROR: "데이터베이스 오류가 발생했습니다.",
};

export interface ReferralErrorDetails {
  code: ReferralErrorCode;
  referrerUserId?: string;
  referredUserId?: string;
  originalError?: unknown;
}

export class ReferralError extends Error {
  public readonly code: ReferralErrorCode;
  public readonly referrerUserId?: string;
  public readonly referredUserId?: string;
  public readonly originalError?: unknown;

  constructor(
    errorCode: ReferralErrorCode,
    details?: Partial<ReferralErrorDetails>
  ) {
    super(ERROR_MESSAGES[errorCode]);
    this.name = "ReferralError";
    this.code = errorCode;
    this.referrerUserId = details?.referrerUserId;
    this.referredUserId = details?.referredUserId;
    this.originalError = details?.originalError;
  }

  toJSON(): Omit<ReferralErrorDetails, "originalError"> & { message: string } {
    return {
      message: this.message,
      code: this.code,
      referrerUserId: this.referrerUserId,
      referredUserId: this.referredUserId,
    };
  }
}
