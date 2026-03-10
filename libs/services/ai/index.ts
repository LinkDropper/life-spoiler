// AI 서비스 모듈 - Gemini 1.5 Flash를 사용한 자미두수 해석

// 에러
export { AIError } from "./errors";
export type { AIErrorCode, AIErrorContext } from "./errors";

// 타입
export type {
  // 인생 운세 타입
  AgeScenarioResponse,
  DayunData,
  FortuneInterpretation,
  GeminiMessage,
  InterpretationType,
  LifeSpoilerResponse,
  LifetimeCategoryResponse,
  LifetimeCoreScenarioResponse,
  PalaceData,
  SihuaData,
  StarData,
  ZiweiInterpretationRequest,
  // 유년 운세 타입
  YearlyCategoryResponse,
  YearlyFortuneInterpretation,
  YearlyInterpretationRequest,
  YearlyInterpretationType,
  YearlyMonthlyFortune,
  YearlyMonthlyFortuneData,
  YearlyOverviewResponse,
  YearlyPalaceData,
  YearlyPeachBlossomData,
  YearlySihuaData,
} from "./types";

// Gemini 클라이언트
export { chatCompletion, parseJsonResponse } from "./gemini";
export type { ChatCompletionOptions } from "./gemini";

// 자미두수 해석 서비스 (인생 운세)
export {
  createFallbackInterpretation,
  generateFullInterpretation,
  interpretAgeScenarios,
  interpretLifeSpoiler,
  interpretLifetimeCareer,
  interpretLifetimeCore,
  interpretLifetimeHealth,
  interpretLifetimeRelationship,
  interpretLifetimeWealth,
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

// 궁합 해석 서비스
export {
  generateCompatibilityInterpretation,
  createCompatibilityFallbackResult,
} from "./compatibility-interpreter";
export type {
  CompatibilityInterpretationRequest,
  CompatibilityInterpretationType,
  HuajiCrossAnalysis,
  PreAnalyzedPersonality,
  PreAnalyzedCompatibility,
  PreAnalyzedCategory,
} from "./types";

// 전생 운세 해석 서비스
export {
  generatePastLifeInterpretation,
  createPastLifeFallbackInterpretation,
} from "./past-life-interpreter";
export type {
  PastLifeBirthResponse,
  PastLifeConnectionsResponse,
  PastLifeContrastResponse,
  PastLifeEndResponse,
  PastLifeFortuneInterpretation,
  PastLifeInterpretationType,
  PastLifeJourneyResponse,
  PastLifeLessonsResponse,
  PastLifeProfileCardResponse,
  PastLifeSpoilerResponse,
  PastLifeStatsResponse,
  PastLifeTracesResponse,
  PastLifeWorldResponse,
} from "./types";
