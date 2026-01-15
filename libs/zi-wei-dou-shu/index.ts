/**
 * 자미두수(紫微斗數) 알고리즘 모듈
 *
 * 삼합파(三合派) 기반의 자미두수 명반 생성 및 해석 라이브러리
 *
 * @example
 * ```typescript
 * import { analyzeZiwei } from "@/libs/zi-wei-dou-shu";
 *
 * const result = analyzeZiwei({
 *   name: "홍길동",
 *   birthDate: "1990-05-15",
 *   birthTime: "12:00",
 *   gender: "male",
 *   calendarType: "solar",
 * });
 *
 * console.log(result.result.summary);
 * ```
 */

// ============================================================
// 핵심 함수
// ============================================================

export {
  generateZiweiChart,
  interpretChart,
  getChartPreview,
  analyzeZiwei,
  getZiweiPreview,
} from "./core";

// ============================================================
// 타입
// ============================================================

export type {
  ZiweiInput,
  ZiweiChart,
  FortuneResult,
  FortuneSection,
  ZiweiAnalysisResult,
  Palace,
  StarInfo,
  LunarDate,
  SihuaResult,
  Brightness,
  Sihua,
  Gender,
  CalendarType,
  BranchIndex,
  StemIndex,
  WuxingJu,
} from "./types";

// 스키마 (입력 검증용)
export { ZiweiInputSchema } from "./types";

// ============================================================
// 에러
// ============================================================

export { ZiWeiError } from "./errors";
export type { ZiWeiErrorCode } from "./errors";

// ============================================================
// 상수 (필요시 사용)
// ============================================================

export {
  EARTHLY_BRANCHES,
  HEAVENLY_STEMS,
  PALACE_ORDER,
  MAIN_STAR_NAMES,
} from "./constants";

// ============================================================
// 계산 함수 (고급 사용자용)
// ============================================================

export {
  // 시간 계산
  getTimeBranch,
  parseTimeToTimeBranch,
  // 궁 계산
  calculateMingGong,
  calculateShenGong,
  // 오행국 계산
  calculateWuxingJu,
  getWuxingJuName,
  // 별 밝기
  getStarBrightness,
  getBrightnessScore,
} from "./calculators";

// ============================================================
// 음력 변환
// ============================================================

export { toLunarDate, getYearStem, getYearBranch } from "./lunar";
