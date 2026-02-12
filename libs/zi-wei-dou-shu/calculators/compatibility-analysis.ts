import { getStarCompatibility } from "../constants/star-compatibility-table";
import type { MainStarName } from "../constants/stars";
import { MAIN_STAR_NAMES } from "../constants/stars";
import { toBrightnessGroup } from "../constants/star-traits";
import type { Brightness, Sihua, ZiweiChart } from "../types";

import type { PersonalityProfile } from "./personality-profile";

/**
 * 카테고리별 사전 분석 결과
 */
export interface CategoryAnalysis {
  relevantTraitsA: string[];
  relevantTraitsB: string[];
  starInteractions: string[];
  suggestedScore: number;
  analysisPoints: string[];
}

/**
 * 점수 제약
 */
export interface ScoreConstraint {
  min: number;
  max: number;
  suggested: number;
}

/**
 * 두 명반의 교차 분석 결과
 */
export interface CompatibilityAnalysis {
  communication: CategoryAnalysis;
  growth: CategoryAnalysis;
  emotion: CategoryAnalysis;
  crisis: CategoryAnalysis;
  scoreConstraints: Record<string, ScoreConstraint>;
  keyDynamics: string[];
  synergyPoints: string[];
  tensionPoints: string[];
}

// ============================================================
// 밝기/사화 점수
// ============================================================

const BRIGHTNESS_SCORE: Record<Brightness, number> = {
  묘: 100,
  왕: 80,
  득: 60,
  리: 40,
  평: 20,
  함: 0,
};

// ============================================================
// 궁별 카테고리 매핑
// ============================================================

const CATEGORY_PALACES: Record<string, string[]> = {
  communication: ["명궁", "교우궁", "형제궁", "부모궁", "부처궁"],
  growth: ["재백궁", "관록궁", "전택궁", "복덕궁", "명궁"],
  emotion: ["복덕궁", "부모궁", "자녀궁", "부처궁", "명궁"],
  crisis: ["질액궁", "천이궁", "복덕궁", "관록궁", "명궁"],
};

// ============================================================
// 유틸리티
// ============================================================

const isMainStar = (name: string): name is MainStarName => {
  return (MAIN_STAR_NAMES as readonly string[]).includes(name);
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

/**
 * 궁에서 주성 정보 가져오기
 */
const getMainStarsFromPalace = (
  chart: ZiweiChart,
  palaceName: string
): Array<{ name: MainStarName; brightness: Brightness; sihua?: Sihua }> => {
  const palace = chart.palaces.find((p) => p.name === palaceName);
  if (!palace) return [];

  return palace.mainStars
    .filter((s) => isMainStar(s.name))
    .map((s) => ({
      name: s.name as MainStarName,
      brightness: s.brightness,
      sihua: s.sihua,
    }));
};

/**
 * 명궁 주성 간 궁합 분석
 */
const analyzeMingGongInteraction = (
  chartA: ZiweiChart,
  chartB: ZiweiChart
): {
  interactions: string[];
  scoreOffset: number;
} => {
  const starsA = getMainStarsFromPalace(chartA, "명궁");
  const starsB = getMainStarsFromPalace(chartB, "명궁");

  const interactions: string[] = [];
  let totalOffset = 0;
  let count = 0;

  for (const sA of starsA) {
    for (const sB of starsB) {
      const compat = getStarCompatibility(sA.name, sB.name);
      const groupA = toBrightnessGroup(sA.brightness);
      const groupB = toBrightnessGroup(sB.brightness);

      interactions.push(
        `A 명궁 ${sA.name}(${sA.brightness}) + B 명궁 ${sB.name}(${sB.brightness}) = ${compat.dynamics}`
      );

      // 밝기 조합에 따른 보정
      let brightnessModifier = 0;
      if (groupA === "bright" && groupB === "bright") {
        brightnessModifier = 5;
      } else if (groupA === "dark" && groupB === "dark") {
        brightnessModifier = -5;
      } else if (
        (groupA === "bright" && groupB === "dark") ||
        (groupA === "dark" && groupB === "bright")
      ) {
        brightnessModifier = -2;
      }

      totalOffset += compat.scoreOffset + brightnessModifier;
      count++;
    }
  }

  return {
    interactions,
    scoreOffset: count > 0 ? Math.round(totalOffset / count) : 0,
  };
};

/**
 * 카테고리별 궁 분석
 */
const analyzeCategoryPalaces = (
  chartA: ZiweiChart,
  chartB: ZiweiChart,
  palaceNames: string[]
): {
  interactions: string[];
  avgBrightnessA: number;
  avgBrightnessB: number;
  sihuaConflicts: string[];
} => {
  const interactions: string[] = [];
  const sihuaConflicts: string[] = [];
  let totalBrightnessA = 0;
  let totalBrightnessB = 0;
  let countA = 0;
  let countB = 0;

  for (const palaceName of palaceNames) {
    const starsA = getMainStarsFromPalace(chartA, palaceName);
    const starsB = getMainStarsFromPalace(chartB, palaceName);

    for (const s of starsA) {
      totalBrightnessA += BRIGHTNESS_SCORE[s.brightness];
      countA++;
      if (s.sihua === "화기") {
        sihuaConflicts.push(`A의 긴장 에너지가 ${palaceName} 영역에 존재`);
      }
    }

    for (const s of starsB) {
      totalBrightnessB += BRIGHTNESS_SCORE[s.brightness];
      countB++;
      if (s.sihua === "화기") {
        sihuaConflicts.push(`B의 긴장 에너지가 ${palaceName} 영역에 존재`);
      }
    }

    // 교차 비교
    for (const sA of starsA) {
      for (const sB of starsB) {
        const compat = getStarCompatibility(sA.name, sB.name);
        if (compat.level !== "neutral") {
          interactions.push(
            `${palaceName}: A ${sA.name}(${sA.brightness}) + B ${sB.name}(${sB.brightness}) → ${compat.level}`
          );
        }
      }
    }
  }

  return {
    interactions,
    avgBrightnessA: countA > 0 ? totalBrightnessA / countA : 50,
    avgBrightnessB: countB > 0 ? totalBrightnessB / countB : 50,
    sihuaConflicts,
  };
};

/**
 * 카테고리 점수 계산
 */
const calculateCategoryScore = (
  mingGongOffset: number,
  categoryAnalysis: ReturnType<typeof analyzeCategoryPalaces>
): number => {
  const baseScore = 65;

  // 명궁 교차 영향
  const mingEffect = mingGongOffset * 0.8;

  // 밝기 평균 보정
  const avgBrightness =
    (categoryAnalysis.avgBrightnessA + categoryAnalysis.avgBrightnessB) / 2;
  const brightnessEffect = (avgBrightness - 50) / 5;

  // 사화 충돌 감점
  const sihuaPenalty = categoryAnalysis.sihuaConflicts.length * -5;

  // 좋은 상호작용 보너스
  const goodInteractions = categoryAnalysis.interactions.filter(
    (i) => i.includes("excellent") || i.includes("good")
  ).length;
  const badInteractions = categoryAnalysis.interactions.filter(
    (i) => i.includes("clash") || i.includes("tension")
  ).length;
  const interactionEffect = (goodInteractions - badInteractions) * 5;

  const score =
    baseScore +
    mingEffect +
    brightnessEffect +
    sihuaPenalty +
    interactionEffect;

  return clamp(Math.round(score), 20, 95);
};

/**
 * 핵심 역학 추출
 */
const extractKeyDynamics = (
  profileA: PersonalityProfile,
  profileB: PersonalityProfile
): string[] => {
  const dynamics: string[] = [];

  // 핵심 성격 대비
  if (profileA.coreTraits.length > 0 && profileB.coreTraits.length > 0) {
    dynamics.push(
      `A의 ${profileA.coreTraits[0]} vs B의 ${profileB.coreTraits[0]}`
    );
  }

  // 소통 스타일 대비
  if (
    profileA.communicationStyle.length > 0 &&
    profileB.communicationStyle.length > 0
  ) {
    dynamics.push(
      `소통: A ${profileA.communicationStyle[0]} vs B ${profileB.communicationStyle[0]}`
    );
  }

  // 갈등 스타일 대비
  if (profileA.conflictStyle.length > 0 && profileB.conflictStyle.length > 0) {
    dynamics.push(
      `갈등: A ${profileA.conflictStyle[0]} vs B ${profileB.conflictStyle[0]}`
    );
  }

  return dynamics;
};

/**
 * 시너지/긴장 포인트 추출
 */
const extractSynergyAndTension = (
  profileA: PersonalityProfile,
  profileB: PersonalityProfile
): { synergy: string[]; tension: string[] } => {
  const synergy: string[] = [];
  const tension: string[] = [];

  // A의 강점이 B의 약점을 보완하는지
  for (const strength of profileA.strengths) {
    for (const weakness of profileB.weaknesses) {
      if (areComplementary(strength, weakness)) {
        synergy.push(`A의 '${strength}'이 B의 '${weakness}'을 보완`);
      }
    }
  }

  // B의 강점이 A의 약점을 보완하는지
  for (const strength of profileB.strengths) {
    for (const weakness of profileA.weaknesses) {
      if (areComplementary(strength, weakness)) {
        synergy.push(`B의 '${strength}'이 A의 '${weakness}'을 보완`);
      }
    }
  }

  // 같은 약점 공유
  for (const wA of profileA.weaknesses) {
    for (const wB of profileB.weaknesses) {
      if (wA === wB) {
        tension.push(`양쪽 모두 '${wA}' 약점 공유 → 공동 과제`);
      }
    }
  }

  // 감정 패턴 충돌 체크
  const emotionConflicts = findConflicts(
    profileA.emotionalPattern,
    profileB.emotionalPattern
  );
  tension.push(...emotionConflicts);

  return { synergy, tension };
};

/**
 * 보완 관계 판단
 */
const areComplementary = (strength: string, weakness: string): boolean => {
  const pairs: Array<[string[], string[]]> = [
    [
      ["안정감", "든든함", "포용적", "침착한"],
      ["불안정", "감정 기복", "극단적"],
    ],
    [
      ["결정력", "결단력", "빠른 결정"],
      ["우유부단", "결정 장애", "결정 지연"],
    ],
    [
      ["감정 교감", "공감", "정서적 지지"],
      ["감정 표현 서툰", "감정 메마름", "공감 부족"],
    ],
    [
      ["관계의 중심", "책임감"],
      ["책임 회피", "추진력 제로"],
    ],
    [
      ["문제 해결", "현명한 판단"],
      ["행동 마비", "회피형"],
    ],
    [
      ["실질적 도움", "경제적 안정"],
      ["물질적 불안", "인색함"],
    ],
  ];

  for (const [strengthWords, weaknessWords] of pairs) {
    const hasStrength = strengthWords.some((w) => strength.includes(w));
    const hasWeakness = weaknessWords.some((w) => weakness.includes(w));
    if (hasStrength && hasWeakness) return true;
  }

  return false;
};

/**
 * 감정 패턴 충돌 감지
 */
const findConflicts = (patternsA: string[], patternsB: string[]): string[] => {
  const conflictPairs: Array<[string[], string[]]> = [
    [
      ["감정 억압", "감정 차단"],
      ["풍부한 감정", "열정적 감정"],
    ],
    [
      ["차가운", "냉담"],
      ["따뜻한", "헌신적"],
    ],
    [["감정 폭발"], ["감정 안정", "차분한"]],
  ];

  const results: string[] = [];

  for (const [groupA, groupB] of conflictPairs) {
    const aMatches = patternsA.some((p) => groupA.some((w) => p.includes(w)));
    const bMatches = patternsB.some((p) => groupB.some((w) => p.includes(w)));

    if (aMatches && bMatches) {
      results.push(`감정 온도차: A의 냉정한 면과 B의 따뜻한 면이 충돌 가능`);
    }

    // 반대 방향도 체크
    const aMatchesReverse = patternsA.some((p) =>
      groupB.some((w) => p.includes(w))
    );
    const bMatchesReverse = patternsB.some((p) =>
      groupA.some((w) => p.includes(w))
    );

    if (aMatchesReverse && bMatchesReverse) {
      results.push(`감정 온도차: B의 냉정한 면과 A의 따뜻한 면이 충돌 가능`);
    }
  }

  return results.slice(0, 2);
};

/**
 * 카테고리별 분석 포인트 생성
 */
const buildAnalysisPoints = (
  category: string,
  profileA: PersonalityProfile,
  profileB: PersonalityProfile,
  palaceAnalysis: ReturnType<typeof analyzeCategoryPalaces>
): string[] => {
  const points: string[] = [];

  switch (category) {
    case "communication":
      points.push(
        `A 소통: ${profileA.communicationStyle.join(", ")}`,
        `B 소통: ${profileB.communicationStyle.join(", ")}`
      );
      break;
    case "growth":
      points.push(
        `A 가치관: ${profileA.valueOrientation.join(", ")}`,
        `B 가치관: ${profileB.valueOrientation.join(", ")}`
      );
      break;
    case "emotion":
      points.push(
        `A 감정: ${profileA.emotionalPattern.join(", ")}`,
        `B 감정: ${profileB.emotionalPattern.join(", ")}`
      );
      break;
    case "crisis":
      points.push(
        `A 갈등: ${profileA.conflictStyle.join(", ")}`,
        `B 갈등: ${profileB.conflictStyle.join(", ")}`
      );
      break;
  }

  if (palaceAnalysis.sihuaConflicts.length > 0) {
    points.push(...palaceAnalysis.sihuaConflicts.slice(0, 2));
  }

  if (palaceAnalysis.interactions.length > 0) {
    points.push(...palaceAnalysis.interactions.slice(0, 2));
  }

  return points.slice(0, 5);
};

/**
 * 점수 제약 범위 생성
 */
const buildScoreConstraint = (suggested: number): ScoreConstraint => ({
  min: clamp(suggested - 15, 20, 80),
  max: clamp(suggested + 15, 30, 95),
  suggested,
});

/**
 * 두 명반의 교차 분석 수행
 *
 * @description
 * 두 사람의 명반과 성격 프로필을 비교하여
 * 카테고리별 사전 분석 결과와 점수 제약을 생성.
 * 결정적 — 동일 입력 → 항상 동일 결과.
 */
export const analyzeCompatibility = (
  chartA: ZiweiChart,
  chartB: ZiweiChart,
  profileA: PersonalityProfile,
  profileB: PersonalityProfile
): CompatibilityAnalysis => {
  // 명궁 교차 분석 (모든 카테고리에 영향)
  const mingGongResult = analyzeMingGongInteraction(chartA, chartB);

  // 카테고리별 분석
  const categories = Object.entries(CATEGORY_PALACES).map(
    ([category, palaces]) => {
      const palaceAnalysis = analyzeCategoryPalaces(chartA, chartB, palaces);
      const score = calculateCategoryScore(
        mingGongResult.scoreOffset,
        palaceAnalysis
      );

      const analysis: CategoryAnalysis = {
        relevantTraitsA:
          category === "communication"
            ? profileA.communicationStyle
            : category === "growth"
              ? profileA.valueOrientation
              : category === "emotion"
                ? profileA.emotionalPattern
                : profileA.conflictStyle,
        relevantTraitsB:
          category === "communication"
            ? profileB.communicationStyle
            : category === "growth"
              ? profileB.valueOrientation
              : category === "emotion"
                ? profileB.emotionalPattern
                : profileB.conflictStyle,
        starInteractions: [
          ...mingGongResult.interactions.slice(0, 2),
          ...palaceAnalysis.interactions.slice(0, 3),
        ],
        suggestedScore: score,
        analysisPoints: buildAnalysisPoints(
          category,
          profileA,
          profileB,
          palaceAnalysis
        ),
      };

      return [category, analysis] as const;
    }
  );

  const categoryMap = Object.fromEntries(categories) as Record<
    string,
    CategoryAnalysis
  >;

  // 점수 제약
  const commScore = categoryMap.communication.suggestedScore;
  const growthScore = categoryMap.growth.suggestedScore;
  const emotionScore = categoryMap.emotion.suggestedScore;
  const crisisScore = categoryMap.crisis.suggestedScore;
  const avgScore = Math.round(
    (commScore + growthScore + emotionScore + crisisScore) / 4
  );

  const scoreConstraints: Record<string, ScoreConstraint> = {
    communication: buildScoreConstraint(commScore),
    growthSynergy: buildScoreConstraint(growthScore),
    trustIndex: buildScoreConstraint(emotionScore),
    crisisResilience: buildScoreConstraint(crisisScore),
    chemistry: buildScoreConstraint(
      clamp(avgScore + mingGongResult.scoreOffset, 15, 95)
    ),
    zodiac: buildScoreConstraint(55), // 띠 점수는 별도 계산이므로 neutral
    fiveElement: buildScoreConstraint(55), // 오행 점수도 별도
  };

  // 핵심 역학, 시너지, 긴장
  const keyDynamics = extractKeyDynamics(profileA, profileB);
  const { synergy, tension } = extractSynergyAndTension(profileA, profileB);

  return {
    communication: categoryMap.communication,
    growth: categoryMap.growth,
    emotion: categoryMap.emotion,
    crisis: categoryMap.crisis,
    scoreConstraints,
    keyDynamics,
    synergyPoints: synergy.slice(0, 5),
    tensionPoints: tension.slice(0, 5),
  };
};
