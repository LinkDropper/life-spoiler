export type PromoErrorCode =
  | "INVALID_CODE"
  | "CODE_EXPIRED"
  | "CODE_NOT_YET_VALID"
  | "CODE_EXHAUSTED"
  | "CODE_INACTIVE"
  | "USER_LIMIT_EXCEEDED"
  | "ALREADY_APPLIED"
  | "FORTUNE_TYPE_MISMATCH"
  | "PROFILE_NOT_FOUND"
  | "DATABASE_ERROR";

export interface PromoErrorDetails {
  code: PromoErrorCode;
  promoCode?: string;
  profileId?: string;
  fortuneType?: string;
  originalError?: unknown;
}

const ERROR_MESSAGES: Record<PromoErrorCode, string> = {
  INVALID_CODE: "유효하지 않은 프로모션 코드입니다.",
  CODE_EXPIRED: "만료된 프로모션 코드입니다.",
  CODE_NOT_YET_VALID: "아직 사용할 수 없는 프로모션 코드입니다.",
  CODE_EXHAUSTED: "프로모션 코드 사용 한도가 초과되었습니다.",
  CODE_INACTIVE: "비활성화된 프로모션 코드입니다.",
  USER_LIMIT_EXCEEDED: "이미 최대 사용 횟수에 도달했습니다.",
  ALREADY_APPLIED: "이미 이 프로필에 적용된 코드입니다.",
  FORTUNE_TYPE_MISMATCH: "이 운세 유형에는 적용할 수 없는 코드입니다.",
  PROFILE_NOT_FOUND: "프로필을 찾을 수 없습니다.",
  DATABASE_ERROR: "데이터베이스 오류가 발생했습니다.",
};

export class PromoError extends Error {
  public readonly code: PromoErrorCode;
  public readonly promoCode?: string;
  public readonly profileId?: string;
  public readonly fortuneType?: string;
  public readonly originalError?: unknown;

  constructor(errorCode: PromoErrorCode, details?: Partial<PromoErrorDetails>) {
    super(ERROR_MESSAGES[errorCode]);
    this.name = "PromoError";
    this.code = errorCode;
    this.promoCode = details?.promoCode;
    this.profileId = details?.profileId;
    this.fortuneType = details?.fortuneType;
    this.originalError = details?.originalError;
  }

  toJSON(): Omit<PromoErrorDetails, "originalError"> & { message: string } {
    return {
      message: this.message,
      code: this.code,
      promoCode: this.promoCode,
      profileId: this.profileId,
      fortuneType: this.fortuneType,
    };
  }
}
