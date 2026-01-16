// AI 서비스 모듈 - Upstage solar-pro를 사용한 자미두수 해석

// 에러
export { AIError } from "./errors";
export type { AIErrorCode, AIErrorContext } from "./errors";

// 타입
export type {
  DayunData,
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
  // 유년 운세 타입
  YearlyCategoryResponse,
  YearlyFortuneInterpretation,
  YearlyInterpretationRequest,
  YearlyInterpretationType,
  YearlyMonthlyFortune,
  YearlyOverviewResponse,
  YearlyPalaceData,
  YearlyPeachBlossomData,
  YearlySihuaData,
} from "./types";

// Upstage 클라이언트
export { chatCompletion, parseJsonResponse } from "./upstage";
export type { ChatCompletionOptions } from "./upstage";

// 자미두수 해석 서비스 (인생 운세)
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

// 유년 해석 서비스 (올해 운세)
export {
  createYearlyFallbackInterpretation,
  generateYearlyInterpretation,
  interpretYearlyCareer,
  interpretYearlyHealth,
  interpretYearlyMonthly,
  interpretYearlyOverview,
  interpretYearlyRelationship,
  interpretYearlyWealth,
} from "./yearly-interpreter";
