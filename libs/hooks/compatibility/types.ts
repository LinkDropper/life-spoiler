import type { ZiweiChart } from "@/libs/zi-wei-dou-shu/types";

// ============================================================
// 궁합 차트 데이터 (자미두수 명반)
// ============================================================

export interface CompatibilityChartSummary {
  wuxingJu: string;
  mingGong: string;
  shenGong: string;
  sihua: {
    hualu: string;
    huaquan: string;
    huake: string;
    huaji: string;
  };
}

export interface CompatibilityProfileChart {
  profileId: string;
  name: string;
  chart: CompatibilityChartSummary;
  rawChart: ZiweiChart;
}

// ============================================================
// 서브 점수 (4대 지표)
// ============================================================

export interface CompatibilitySubScores {
  /** 소통 점수 (0-100) */
  communication: number;
  /** 성장 시너지 (0-100) */
  growthSynergy: number;
  /** 신뢰 지수 (0-100) */
  trustIndex: number;
  /** 위기 극복력 (0-100) */
  crisisResilience: number;
}

// ============================================================
// 궁합 인사이트 (AI 생성)
// ============================================================

export interface CompatibilityInsightItem {
  score: number;
  label: string;
  headline: string;
  content: string;
}

export interface CompatibilityInsights {
  /** 궁합 점수 총평 */
  overall: CompatibilityInsightItem;
  /** 띠 궁합 */
  zodiac: CompatibilityInsightItem;
  /** 오행 궁합 */
  fiveElement: CompatibilityInsightItem;
  /** 성격 케미 */
  chemistry: CompatibilityInsightItem;
  /** 소통 점수 */
  communication: CompatibilityInsightItem;
  /** 성장 시너지 */
  growthSynergy: CompatibilityInsightItem;
  /** 신뢰 지수 */
  trustIndex: CompatibilityInsightItem;
  /** 위기 극복력 */
  crisisResilience: CompatibilityInsightItem;
}

// ============================================================
// 핵심 시나리오
// ============================================================

/** sub-section block (관상스포 패턴) */
export interface CompatibilitySubSection {
  heading: string;
  body: string;
}

export interface CompatibilityScenario {
  title: string;
  /** 레거시 */
  content?: string;
  /** 신규 구조화 */
  subSections?: CompatibilitySubSection[];
  oneLiner?: string;
}

// ============================================================
// 상세 카테고리 (소통&갈등, 재물&성장, 감정&신뢰, 위기&극복)
// ============================================================

export interface CompatibilityCategorySection {
  headline: string;
  /** 레거시 */
  content?: string;
  /** 신규 구조화 */
  subSections?: CompatibilitySubSection[];
  oneLiner?: string;
  tags: string[];
}

// ============================================================
// AI 해석 결과 (인공지능 생성 전체)
// ============================================================

export interface CompatibilityInterpretation {
  /** 2. 헤드라인 */
  headline: string;
  /** 3. 종합 태그 */
  tags: string[];
  /** 6. 궁합 인사이트 (8개 항목) */
  insights: CompatibilityInsights;
  /** 7. 궁합 스포일러 — 레거시 텍스트 (en/ja, 기존 캐시) */
  spoiler?: string;
  /** 7. 궁합 스포일러 — 신규 구조화 (ko) */
  overviewSubSections?: CompatibilitySubSection[];
  overviewOneLiner?: string;
  /** 8. 핵심 시나리오 */
  coreScenarios: CompatibilityScenario[];
  /** 9-12. 상세 카테고리 */
  categories: {
    /** 9. 소통 & 갈등 */
    communication: CompatibilityCategorySection;
    /** 10. 재물 & 성장 */
    growth: CompatibilityCategorySection;
    /** 11. 감정 & 신뢰 */
    emotion: CompatibilityCategorySection;
    /** 12. 위기 & 극복 */
    crisis: CompatibilityCategorySection;
  };
  /** 13. 종합 조언 — 레거시 */
  advice?: string;
  /** 13. 종합 조언 — 신규 구조화 */
  adviceSubSections?: CompatibilitySubSection[];
  adviceOneLiner?: string;
  meta: {
    generatedAt: string;
    model: string;
    isFallback: boolean;
  };
}

// ============================================================
// 궁합 최종 결과 (CompatibilityPairRow.result에 저장)
// ============================================================

export interface CompatibilityResult {
  /** 1. 궁합 점수 (0-100) */
  score: number;
  /** 4. 서브 점수 (4대 지표) */
  subScores: CompatibilitySubScores;
  /** 5. A/B 자미두수 명반 */
  charts: {
    profileA: CompatibilityProfileChart;
    profileB: CompatibilityProfileChart;
  };
  /** AI 해석 (2,3,6~13) */
  interpretation: CompatibilityInterpretation;
}
