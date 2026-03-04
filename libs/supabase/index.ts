export { createAuthClient, createServerClient } from "./client";

export { createBrowserClient } from "./browser";
export type {
  AnalysisResultInsert,
  AnalysisResultRow,
  Database,
  FortuneInsert,
  FortuneRow,
  InterpretationCacheInsert,
  InterpretationCacheRow,
  Json,
  OAuthProvider,
  UserInsert,
  UserRow,
} from "./types";
export {
  generateChartHash,
  getCachedResult,
  getOrCreateCachedResult,
  setCachedResult,
} from "./analysis-cache";
export {
  getFortune,
  getFortunesByProfile,
  saveFortune,
  updateCompatibilityPaidAt,
  updateFortunePaidAt,
  type FortuneResultType,
  type FortuneType,
  type LifetimeFortuneData,
  type SaveFortuneParams,
  type YearlyFortuneData,
} from "./fortune";
