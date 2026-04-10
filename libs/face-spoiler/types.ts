import type { AnimalType } from "./constants/animals";

export type { AnimalType };

/**
 * 관상 부위 코드.
 *
 * ⚠️ 자미두수 12궁(`Palace`)과 절대 혼동 금지. face-spoiler는 "얼굴 부위 맵"이며,
 * zi-wei-dou-shu는 "생년월일시 기반 명반 배치"다. 두 모듈은 `libs/` 내에서
 * 완전히 분리되어 있고, 네이밍도 분리된다 (gwansang-expert Phase 1 §1-2-D 권고).
 */
export type PhysiognomyRegion =
  | "faceShape"
  | "forehead"
  | "brow"
  | "browSpacing"
  | "eye"
  | "eyeSpacing"
  | "eyeCorner"
  | "underEye"
  | "noseRoot"
  | "noseBridge"
  | "noseTip"
  | "nostril"
  | "philtrum"
  | "mouth"
  | "lipThickness"
  | "mouthCorner"
  | "cheekbone"
  | "chin"
  | "jaw"
  | "ear";

/** 섹션·특징의 기운이 얼마나 뚜렷한가. score 0~100 시스템을 대체 */
export type Intensity = "strong" | "balanced" | "subtle";

/** 동물상 매칭 확신도 */
export type MatchConfidence = "high" | "medium" | "low";

export interface ObservationFeature {
  region: PhysiognomyRegion;
  /** 관찰 축 (예: "shape", "width", "density") */
  axis: string;
  /** 일상 표현 값 (예: "둥근 편", "넓은 편"). 한자 금지 */
  value: string;
  intensity: Intensity;
}

export interface AnimalMatch {
  primary: AnimalType;
  confidence: MatchConfidence;
  /** 매칭 근거가 된 부위 2~4개. 일상 표현 */
  matchedRegions: string[];
  /** 120~180자. 왜 이 동물상인지 부위 조합 설명 */
  rationale: string;
}

export interface FirstImpressionSection {
  headline: string;
  description: string;
  summary: string;
  /** 2~4개 */
  vibeTags: string[];
  intensity: Intensity;
}

export interface ObservationSection {
  headline: string;
  /** 사실 묘사만. 해석·기질 추론 금지 */
  content: string;
  /** 8~12개. 18개 관찰 항목 중 사진에서 확인 가능한 것만 구조화 */
  features: ObservationFeature[];
}

export interface TraitsSection {
  headline: string;
  strengths: string;
  /** 숨겨진 면/반전. 약점을 부드럽게 녹여서 기술 */
  hiddenSide: string;
  /** 2~4개 */
  tags: string[];
  intensity: Intensity;
}

export interface FortuneSection {
  headline: string;
  workFlow: string;
  /** 수치·금액 금지. 흐름·리듬·경향만 */
  wealthFlow: string;
  /** 2~4개 */
  tags: string[];
  intensity: Intensity;
}

export interface RelationshipSection {
  headline: string;
  content: string;
  /** 어울리는 사람 유형. 성별·외모 금지, 기질·태도만 */
  idealType: string;
  /** 40~60자, OG 카드 중앙 텍스트로 쓰일 완결 문장 */
  shareableQuote: string;
  /** 2~4개 */
  tags: string[];
  intensity: Intensity;
}

export interface FaceReportAction {
  title: string;
  detail: string;
}

export interface FaceReportData {
  /** 스키마 버전 — 마이그레이션 분기용 */
  version: 2;
  /** 동물상 매칭 (루트 필드). UI 히어로 영역 전담 */
  animalMatch: AnimalMatch;
  firstImpression: FirstImpressionSection;
  observation: ObservationSection;
  traits: TraitsSection;
  fortune: FortuneSection;
  relationship: RelationshipSection;
  /** 이번 주 작은 행동 — 정확히 3개 */
  actions: FaceReportAction[];
  /** SNS 공유용 한 줄. primary 동물상 이름 자연스럽게 포함 */
  shareLine: string;
}

/** 텍스트 리포트 호출 결과 (animalMatch 제외). 분리 호출 후 route에서 합성. */
export type FaceTextReport = Omit<FaceReportData, "version" | "animalMatch">;

/**
 * v2 스키마 리포트인지 runtime 검증.
 *
 * DB `face_reports.result` 는 jsonb 컬럼이라 저장된 v1 레거시 데이터가
 * 남아 있을 수 있다. 하드 컷오버 정책상 v1이면 UI는 fallback 안내를
 * 노출하고, v2 필수 필드가 하나라도 빠지면 false를 반환한다.
 */
export const isV2Report = (value: unknown): value is FaceReportData => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (record.version !== 2) {
    return false;
  }
  const requiredKeys: Array<keyof FaceReportData> = [
    "animalMatch",
    "firstImpression",
    "observation",
    "traits",
    "fortune",
    "relationship",
    "actions",
    "shareLine",
  ];
  return requiredKeys.every((key) => record[key] !== undefined);
};
