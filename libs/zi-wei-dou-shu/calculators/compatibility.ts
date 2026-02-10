import type { BranchIndex, WuxingJu } from "../types";

// ============================================================
// 상수 재사용 (yearly-insights.ts에서 export)
// ============================================================

import {
  SAMHAP_GROUPS,
  YUKHAP_PAIRS,
  BRANCH_TO_ANIMAL,
  ELEMENT_GENERATES,
} from "./yearly-insights";

// ============================================================
// 충(沖) 관계 — 지지 기준 6쌍
// ============================================================

const CLASH_PAIRS: Record<BranchIndex, BranchIndex> = {
  0: 6,
  1: 7,
  2: 8,
  3: 9,
  4: 10,
  5: 11,
  6: 0,
  7: 1,
  8: 2,
  9: 3,
  10: 4,
  11: 5,
};

// ============================================================
// 형(刑) 관계 — Punishment groups
// ============================================================

/** 형(刑) 그룹 — 무례지형(자-묘), 지세지형(축-술-미), 무은지형(인-사-신) */
const PUNISHMENT_GROUPS: BranchIndex[][] = [
  [0, 3], // 자-묘: 무례지형
  [1, 10, 7], // 축-술-미: 지세지형
  [2, 5, 8], // 인-사-신: 무은지형
];

/** 자형(自刑) — 같은 지지끼리 형 (진, 오, 유, 해) */
const SELF_PUNISHMENT: BranchIndex[] = [4, 6, 9, 11];

// ============================================================
// 해(害/원진) 관계 — 6쌍
// ============================================================

const HARM_PAIRS: Record<BranchIndex, BranchIndex> = {
  0: 7,
  7: 0, // 자-미
  1: 6,
  6: 1, // 축-오
  2: 5,
  5: 2, // 인-사
  3: 4,
  4: 3, // 묘-진
  8: 11,
  11: 8, // 신-해
  9: 10,
  10: 9, // 유-술
};

// ============================================================
// 파(破) 관계 — 6쌍
// ============================================================

const BREAK_PAIRS: Record<BranchIndex, BranchIndex> = {
  0: 9,
  9: 0, // 자-유
  1: 4,
  4: 1, // 축-진
  2: 11,
  11: 2, // 인-해
  3: 6,
  6: 3, // 묘-오
  5: 8,
  8: 5, // 사-신
  7: 10,
  10: 7, // 미-술
};

// ============================================================
// 오행국 → 오행 매핑
// ============================================================

const WUXING_JU_TO_ELEMENT: Record<WuxingJu, string> = {
  2: "수",
  3: "목",
  4: "금",
  5: "토",
  6: "화",
};

// ============================================================
// 오행 상극 관계
// ============================================================

const ELEMENT_OVERCOMES: Record<string, string> = {
  목: "토",
  토: "수",
  수: "화",
  화: "금",
  금: "목",
};

// ============================================================
// 타입 정의
// ============================================================

export interface ZodiacCompatibility {
  animalA: string;
  animalB: string;
  branchA: BranchIndex;
  branchB: BranchIndex;
  relationship:
    | "samhap"
    | "yukhap"
    | "clash"
    | "punishment"
    | "harm"
    | "break"
    | "none";
  description: string;
}

export interface FiveElementCompatibility {
  elementA: string;
  elementB: string;
  wuxingJuA: WuxingJu;
  wuxingJuB: WuxingJu;
  relationship:
    | "generating"
    | "being_generated"
    | "overcoming"
    | "being_overcome"
    | "same";
  description: string;
}

// ============================================================
// 띠 궁합 분석
// ============================================================

/** 형(刑) 관계인지 체크 (branchA !== branchB 전제) */
const isPunishment = (a: BranchIndex, b: BranchIndex): boolean =>
  PUNISHMENT_GROUPS.some((group) => group.includes(a) && group.includes(b));

/** 부가 관계 목록을 만들어 description 뒤에 붙이는 헬퍼 */
const buildSecondaryNote = (
  a: BranchIndex,
  b: BranchIndex,
  skipRelationship: string
): string => {
  const extras: string[] = [];
  if (skipRelationship !== "punishment" && isPunishment(a, b)) {
    extras.push("형");
  }
  if (skipRelationship !== "harm" && HARM_PAIRS[a] === b) {
    extras.push("해");
  }
  if (skipRelationship !== "break" && BREAK_PAIRS[a] === b) {
    extras.push("파");
  }
  if (extras.length === 0) return "";
  return `. ${extras.join("/")} 관계도 겹쳐 부정적 영향 동반`;
};

export const analyzeZodiacCompatibility = (
  branchA: BranchIndex,
  branchB: BranchIndex
): ZodiacCompatibility => {
  const animalA = BRANCH_TO_ANIMAL[branchA].ko;
  const animalB = BRANCH_TO_ANIMAL[branchB].ko;

  const base = { animalA, animalB, branchA, branchB };

  // 같은 띠 처리
  if (branchA === branchB) {
    if (SELF_PUNISHMENT.includes(branchA)) {
      return {
        ...base,
        relationship: "punishment",
        description: `자형 (${animalA}-${animalB}): 같은 에너지끼리 부딪히는 패턴`,
      };
    }
    return {
      ...base,
      relationship: "none",
      description: `${animalA}-${animalB}: 같은 띠로 공감대가 높지만 같은 약점 공유`,
    };
  }

  // 우선순위: 삼합 > 육합 > 충 > 형 > 해 > 파 > none

  // 삼합 체크
  const samhapGroup = SAMHAP_GROUPS.find(
    (group) => group.includes(branchA) && group.includes(branchB)
  );
  if (samhapGroup) {
    return {
      ...base,
      relationship: "samhap",
      description: `삼합 (${animalA}-${animalB}): 같은 삼합 그룹으로 에너지 방향이 일치하는 조화로운 조합`,
    };
  }

  // 육합 체크
  if (YUKHAP_PAIRS[branchA] === branchB) {
    return {
      ...base,
      relationship: "yukhap",
      description: `육합 (${animalA}-${animalB}): 자연스럽게 결합하는 친밀한 조합`,
    };
  }

  // 충 체크
  if (CLASH_PAIRS[branchA] === branchB) {
    return {
      ...base,
      relationship: "clash",
      description: `충 (${animalA}-${animalB}): 정반대 에너지가 부딪히는 긴장 관계`,
    };
  }

  // 형 체크
  if (isPunishment(branchA, branchB)) {
    const secondary = buildSecondaryNote(branchA, branchB, "punishment");
    return {
      ...base,
      relationship: "punishment",
      description: `형 (${animalA}-${animalB}): 반복적으로 갈등이 생기기 쉬운 조합${secondary}`,
    };
  }

  // 해 체크
  if (HARM_PAIRS[branchA] === branchB) {
    const secondary = buildSecondaryNote(branchA, branchB, "harm");
    return {
      ...base,
      relationship: "harm",
      description: `해 (${animalA}-${animalB}): 은근한 마찰과 불편함이 쌓이기 쉬운 조합${secondary}`,
    };
  }

  // 파 체크
  if (BREAK_PAIRS[branchA] === branchB) {
    return {
      ...base,
      relationship: "break",
      description: `파 (${animalA}-${animalB}): 기존 안정을 흔드는 변동이 큰 조합`,
    };
  }

  return {
    ...base,
    relationship: "none",
    description: `${animalA}-${animalB}: 특별한 상성 없이 중립적 관계`,
  };
};

// ============================================================
// 오행 궁합 분석
// ============================================================

// ============================================================
// 점수 범위 계산
// ============================================================

export interface ScoreRange {
  min: number;
  max: number;
  center: number;
}

const ZODIAC_SCORE_OFFSET: Record<ZodiacCompatibility["relationship"], number> =
  {
    samhap: 12,
    yukhap: 8,
    none: 0, // 기본값; 같은 띠/비자형은 +3으로 별도 처리
    break: -5,
    harm: -8,
    punishment: -12,
    clash: -12,
  };

const FIVE_ELEMENT_SCORE_OFFSET: Record<
  FiveElementCompatibility["relationship"],
  number
> = {
  generating: 5,
  being_generated: 5,
  same: 0,
  overcoming: -5,
  being_overcome: -5,
};

/**
 * 띠·오행 궁합에 기반한 점수 범위를 계산한다.
 * AI가 최종 점수를 이 범위 안에서만 결정하도록 가이드.
 */
export const calculateBaseScoreRange = (
  zodiac: ZodiacCompatibility,
  fiveElement: FiveElementCompatibility
): ScoreRange => {
  let center = 50;

  // 띠 보정
  if (zodiac.relationship === "none") {
    // 같은 띠(비자형)이면 +3, 중립이면 0
    center += zodiac.branchA === zodiac.branchB ? 3 : 0;
  } else {
    center += ZODIAC_SCORE_OFFSET[zodiac.relationship];
  }

  // 오행 보정
  center += FIVE_ELEMENT_SCORE_OFFSET[fiveElement.relationship];

  const HALF_RANGE = 15;
  const min = Math.max(15, center - HALF_RANGE);
  const max = Math.min(95, center + HALF_RANGE);

  return { min, max, center };
};

// ============================================================
// 오행 궁합 분석
// ============================================================

export const analyzeFiveElementCompatibility = (
  wuxingJuA: WuxingJu,
  wuxingJuB: WuxingJu
): FiveElementCompatibility => {
  const elementA = WUXING_JU_TO_ELEMENT[wuxingJuA];
  const elementB = WUXING_JU_TO_ELEMENT[wuxingJuB];

  // 같은 오행
  if (elementA === elementB) {
    return {
      elementA,
      elementB,
      wuxingJuA,
      wuxingJuB,
      relationship: "same",
      description: `${elementA} = ${elementB} (비화): 공감대가 높지만 같은 약점 공유`,
    };
  }

  // A가 B를 생하는 관계
  if (ELEMENT_GENERATES[elementA] === elementB) {
    return {
      elementA,
      elementB,
      wuxingJuA,
      wuxingJuB,
      relationship: "generating",
      description: `${elementA} → ${elementB} (상생): A가 B를 성장시키는 에너지`,
    };
  }

  // B가 A를 생하는 관계
  if (ELEMENT_GENERATES[elementB] === elementA) {
    return {
      elementA,
      elementB,
      wuxingJuA,
      wuxingJuB,
      relationship: "being_generated",
      description: `${elementB} → ${elementA} (상생): B가 A를 성장시키는 에너지`,
    };
  }

  // A가 B를 극하는 관계
  if (ELEMENT_OVERCOMES[elementA] === elementB) {
    return {
      elementA,
      elementB,
      wuxingJuA,
      wuxingJuB,
      relationship: "overcoming",
      description: `${elementA} → ${elementB} (상극): A가 B를 제어하는 긴장 관계`,
    };
  }

  // B가 A를 극하는 관계
  if (ELEMENT_OVERCOMES[elementB] === elementA) {
    return {
      elementA,
      elementB,
      wuxingJuA,
      wuxingJuB,
      relationship: "being_overcome",
      description: `${elementB} → ${elementA} (상극): B가 A를 제어하는 긴장 관계`,
    };
  }

  // Fallback (shouldn't happen with 5 elements)
  return {
    elementA,
    elementB,
    wuxingJuA,
    wuxingJuB,
    relationship: "same",
    description: `${elementA} - ${elementB}: 중립적 관계`,
  };
};
