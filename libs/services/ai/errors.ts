export type AIErrorCode =
  | "API_KEY_MISSING"
  | "API_REQUEST_FAILED"
  | "RESPONSE_PARSE_FAILED"
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "INVALID_RESPONSE"
  | "UNKNOWN_ERROR";

export interface AIErrorContext {
  code: AIErrorCode;
  statusCode?: number;
  originalError?: Error;
  requestType?: string;
}

export class AIError extends Error {
  public readonly code: AIErrorCode;
  public readonly statusCode?: number;
  public readonly originalError?: Error;
  public readonly requestType?: string;

  constructor(message: string, context: AIErrorContext) {
    super(message);
    this.name = "AIError";
    this.code = context.code;
    this.statusCode = context.statusCode;
    this.originalError = context.originalError;
    this.requestType = context.requestType;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      requestType: this.requestType,
    };
  }
}
