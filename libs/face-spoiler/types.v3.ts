import type { AnimalType } from "./constants/animals";

export type { AnimalType };

// ============================================================
// 부위별 점수 — 고정 8개
// ============================================================

/**
 * v3 부위 점수 키. reference `score.md`의 7개 항목 + "전체 균형감".
 * 순서는 UI 노출 순서이자 프롬프트 생성 순서로도 그대로 사용.
 */
export const REGION_SCORE_KEYS = [
  "forehead",
  "eye",
  "brow",
  "nose",
  "mouth",
  "chin",
  "cheekbone",
  "balance",
] as const;

export type RegionScoreKey = (typeof REGION_SCORE_KEYS)[number];

/** UI 한국어 라벨. reference 표기 그대로. */
export const REGION_SCORE_LABEL: Record<RegionScoreKey, string> = {
  forehead: "이마",
  eye: "눈",
  brow: "눈썹",
  nose: "코",
  mouth: "입",
  chin: "턱 / 하관",
  cheekbone: "광대",
  balance: "전체 균형감",
};

// ============================================================
// 관심사 디테일 — 고정 3개 (love → money → career)
// ============================================================

export const INTEREST_DOMAIN_KEYS = ["love", "money", "career"] as const;

export type InterestDomain = (typeof INTEREST_DOMAIN_KEYS)[number];

/** UI 한국어 라벨 (이모지 포함). */
export const INTEREST_DOMAIN_LABEL: Record<InterestDomain, string> = {
  love: "💕 연애운",
  money: "💰 재물운",
  career: "💼 직장운",
};

// ============================================================
// 섹션 타입
// ============================================================

/** 보조 라벨 — 동물상 분류 결과의 최소 셋. 히어로 메인이 아님. */
export interface AnimalChip {
  type: AnimalType;
  label: string;
}

/**
 * Phase 21 (2026-04-23) — 첫인상 나이 추정.
 * 실제 나이 단정·노안/동안 평가 금지. 5년 대역으로만 표현.
 */
export interface FaceAge {
  /** "25-29" 같이 5년 대역. 하이픈 구분. */
  range: string;
  /** "20대 후반" 같은 사용자 친화 라벨. */
  label: string;
  /** "첫인상 기준이에요" 같은 부연 한 줄. 중립적 톤. */
  note: string;
}

/** 1. signature — 시그니처 히어로 영역 */
export interface SignatureSection {
  /** 25~40자. 한 줄 인상 정의. 마침표 없음.
   *  예: "차분하고 단정한 정석형 인상" */
  oneLineDefinition: string;

  /** 60~90자. 정의를 풀어주는 부연 한 줄.
   *  예: "첫인상에서 튀기보다는 볼수록 신뢰감이 생기는 타입으로 보여요." */
  subDefinition: string;

  /** 정확히 5개. 각 4자 이내 한 단어 키워드.
   *  예: ["신뢰감", "안정감", "신중함", "꾸준함", "후반상승"] */
  coreKeywords: string[];

  /** 30~50자. "이 인상이 자주 듣는 말 1개" — 자기인식 트리거.
   *  예: "'조용한데 은근 강하다'는 말, 한 번쯤 들어보셨죠?" */
  commonlyHeardPhrase: string;

  /** 30~50자. "이 인상이 자주 받는 오해 1개" — 반전 호기심 트리거.
   *  예: "'차가워 보인다'는 오해, 실제와 가장 거리가 먼 부분이에요." */
  commonMisread: string;

  /** 동물상 칩 — 보조 라벨. */
  animalChip: AnimalChip;

  /**
   * Phase 21 — 첫인상 나이 (5년 대역).
   * 기존 리포트(Phase 21 이전 생성)에는 없을 수 있어 optional.
   * UI는 undefined 시 렌더 skip.
   */
  faceAge?: FaceAge;
}

/** 2. overallScore — 종합 점수 + 종합 인상 */
export interface OverallHighlight {
  /** 5~10자. 핵심 단어. 예: "신중함" */
  title: string;
  /** 15~30자. 부연. "~편이에요" 또는 "~분위기예요" 어미. */
  body: string;
}

export interface OverallScoreSection {
  /** 7.5~9.5 (소수점 1자리). 코드 결정적 산출. */
  totalScore: number;

  /** 20~30자. 종합 점수에 붙는 한 줄 평.
   *  예: "강렬한 한 방보다, 전체 밸런스로 이기는 상." */
  scoreOneLiner: string;

  /** 200~280자, 2단락. reference overall.md "전체 인상" 수준. */
  summary: string;

  /** 6~10개. 종합 인상 핵심 특성 글머리표. */
  highlights: OverallHighlight[];
}

/** 3. regionScores — 부위별 점수 8개 */
export interface RegionScore {
  /** 8개 부위 enum 중 하나. */
  region: RegionScoreKey;

  /** 한국어 라벨. `REGION_SCORE_LABEL[region]`과 일치. */
  label: string;

  /** 7.0~9.5 (소수점 1자리). 코드 결정적 산출. */
  score: number;

  /** 80~140자, 2~3 문장. "관상에서는 ~" 인용 화법 포함. */
  interpretation: string;

  /** 정확히 3개. 각 12~25자. "~편이에요" 어미 통일. */
  bullets: string[];

  /** 18~30자. 마침표로 끝나는 따옴표 한 줄 평.
   *  명사구 결말 허용 (예: "말은 적어도, 보고 있는 건 많은 눈."). */
  oneLiner: string;
}

export interface RegionScoresSection {
  /** 정확히 8개. `REGION_SCORE_KEYS` 순서 고정. */
  regions: RegionScore[];
}

/** 4. interestAreas — 관심사 디테일 3개 */
export interface InterestArea {
  /** 3개 분야 enum. */
  domain: InterestDomain;

  /** 한국어 라벨 + 이모지. `INTEREST_DOMAIN_LABEL[domain]`과 일치. */
  label: string;

  /** 25~40자. 분야 인상의 한 줄 정의. 마침표 없음.
   *  예: "불꽃형 연애보다, 오래 가는 신뢰형 연애운" */
  oneLineDefinition: string;

  /** 280~360자, 3~4단락. reference detail.md 분량·톤. */
  body: string;

  /** 정확히 3개. 각 12~25자. 강점. */
  strengths: string[];

  /** 정확히 3개. 각 12~25자. 주의점. "~수 있어요" 회피 단정. */
  cautions: string[];

  /** 25~40자. 한 줄 총평. 마침표로 끝맺음.
   *  예: "벼락부자형보다, 알짜배기 실속형 재물운." */
  oneLineVerdict: string;

  /** 10~20자. 캐릭터 별명.
   *  예: "무심한 듯 다정한 타입" */
  characterNickname: string;

  /** 30~50자. 캐릭터 별명 부연.
   *  예: "겉은 담백, 속은 은근 깊은 쪽이에요." */
  nicknameSubtext: string;
}

export interface InterestAreasSection {
  /** 정확히 3개. love → money → career 순서 고정. */
  areas: InterestArea[];
}

/** 5. closing — 마무리 + 공유 */
export interface ClosingSection {
  /** 25~40자. 종합 캐릭터 별명 (분야별과 다름, 전체 인상).
   *  예: "조용한 강자형" */
  finalNickname: string;

  /** 60~100자. 별명을 풀어주는 한 단락. */
  finalNote: string;

  /** 35~55자. SNS 공유용 한 줄. 동물상 라벨 자연스럽게 포함. */
  shareLine: string;
}

// ============================================================
// 루트 타입 + 가드
// ============================================================

export interface FaceReportDataV3 {
  /** 스키마 버전 — 마이그레이션 분기용 */
  version: 3;

  signature: SignatureSection;
  overallScore: OverallScoreSection;
  regionScores: RegionScoresSection;
  interestAreas: InterestAreasSection;
  closing: ClosingSection;
}

/**
 * LLM 응답 형태. 코드 결정 필드는 제외된다:
 *  - signature.animalChip       (animal-classifier 결과 주입)
 *  - overallScore.totalScore    (region 점수 평균에서 산출)
 *  - regionScores.regions[].region / label / score (region-scorer 결과 주입)
 *
 * `regions` 배열 길이·순서는 항상 `REGION_SCORE_KEYS`와 1:1 매칭.
 */
export interface FaceTextReportV3 {
  signature: Omit<SignatureSection, "animalChip">;
  overallScore: Omit<OverallScoreSection, "totalScore">;
  regionScores: {
    regions: Array<Omit<RegionScore, "region" | "label" | "score">>;
  };
  interestAreas: InterestAreasSection;
  closing: ClosingSection;
}

/**
 * v3 리포트 runtime 가드.
 * DB `face_reports.result`는 jsonb라 v1·v2·v3가 공존 가능 → version 기반 분기 전담.
 */
export const isV3Report = (value: unknown): value is FaceReportDataV3 => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (record.version !== 3) {
    return false;
  }
  const requiredKeys: Array<keyof FaceReportDataV3> = [
    "signature",
    "overallScore",
    "regionScores",
    "interestAreas",
    "closing",
  ];
  return requiredKeys.every((key) => record[key] !== undefined);
};
