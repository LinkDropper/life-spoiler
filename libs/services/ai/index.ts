// AI 서비스 모듈 - Upstage solar-pro를 사용한 자미두수 해석

// 에러
export { AIError } from "./errors";
export type { AIErrorCode, AIErrorContext } from "./errors";

// 타입
export type {
  FortuneInterpretation,
  InterpretationType,
  PalaceData,
  PreviewResponse,
  SectionResponse,
  SihuaData,
  StarData,
  SummaryResponse,
  UpstageMessage,
  ZiweiInterpretationRequest,
} from "./types";

// Upstage 클라이언트
export { chatCompletion, parseJsonResponse } from "./upstage";
export type { ChatCompletionOptions } from "./upstage";

// 자미두수 해석 서비스
export {
  createFallbackInterpretation,
  generateFullInterpretation,
  interpretCareer,
  interpretHealth,
  interpretPreview,
  interpretRelationship,
  interpretSummary,
  interpretWealth,
} from "./ziwei-interpreter";
export type { FullInterpretationOptions } from "./ziwei-interpreter";
