export type ZiWeiErrorCode =
  | "INVALID_INPUT"
  | "LUNAR_CONVERSION_FAILED"
  | "INVALID_DATE"
  | "INVALID_TIME"
  | "CALCULATION_ERROR"
  | "INTERPRETATION_ERROR";

export interface ZiWeiErrorDetails {
  code: ZiWeiErrorCode;
  field?: string;
  originalError?: unknown;
}

export class ZiWeiError extends Error {
  public readonly code: ZiWeiErrorCode;
  public readonly field?: string;
  public readonly originalError?: unknown;

  constructor(message: string, details: ZiWeiErrorDetails) {
    super(message);
    this.name = "ZiWeiError";
    this.code = details.code;
    this.field = details.field;
    this.originalError = details.originalError;

    // Error 클래스 상속 시 프로토타입 체인 유지
    Object.setPrototypeOf(this, ZiWeiError.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      field: this.field,
    };
  }
}
