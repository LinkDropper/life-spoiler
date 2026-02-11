import { STAR_TRAITS, toBrightnessGroup } from "../constants/star-traits";
import type { MainStarName } from "../constants/stars";
import { MAIN_STAR_NAMES } from "../constants/stars";
import type { Brightness, Sihua, ZiweiChart } from "../types";

/**
 * 성격 프로필 (궁합 사전 분석용)
 *
 * @용도 명반에서 결정적으로 추출되는 종합 성격 프로필
 * @특징 동일 명반 → 항상 동일 프로필 (프로그래밍 기반)
 */
export interface PersonalityProfile {
  coreTraits: string[];
  communicationStyle: string[];
  emotionalPattern: string[];
  conflictStyle: string[];
  valueOrientation: string[];
  strengths: string[];
  weaknesses: string[];
  dominantElement: string;
  summary: string;
}

// ============================================================
// 궁별 카테고리 가중치 (성격 프로필용)
// ============================================================

interface ProfileWeights {
  core: number;
  communication: number;
  emotion: number;
  conflict: number;
  value: number;
}

const PALACE_PROFILE_WEIGHTS: Record<string, ProfileWeights> = {
  명궁: {
    core: 2.0,
    communication: 1.0,
    emotion: 1.0,
    conflict: 1.0,
    value: 1.0,
  },
  부처궁: {
    core: 0.8,
    communication: 1.2,
    emotion: 1.5,
    conflict: 1.0,
    value: 0.8,
  },
  교우궁: {
    core: 0.6,
    communication: 1.8,
    emotion: 0.6,
    conflict: 0.8,
    value: 0.6,
  },
  형제궁: {
    core: 0.6,
    communication: 1.2,
    emotion: 0.8,
    conflict: 1.0,
    value: 0.6,
  },
  복덕궁: {
    core: 0.8,
    communication: 0.6,
    emotion: 1.5,
    conflict: 0.8,
    value: 1.2,
  },
  부모궁: {
    core: 0.6,
    communication: 1.0,
    emotion: 1.2,
    conflict: 0.8,
    value: 0.8,
  },
  질액궁: {
    core: 0.4,
    communication: 0.4,
    emotion: 0.8,
    conflict: 1.5,
    value: 0.4,
  },
  천이궁: {
    core: 0.6,
    communication: 0.8,
    emotion: 0.6,
    conflict: 1.2,
    value: 0.8,
  },
  재백궁: {
    core: 0.4,
    communication: 0.4,
    emotion: 0.4,
    conflict: 0.6,
    value: 1.5,
  },
  관록궁: {
    core: 0.6,
    communication: 0.6,
    emotion: 0.4,
    conflict: 0.6,
    value: 1.5,
  },
  자녀궁: {
    core: 0.4,
    communication: 0.8,
    emotion: 1.0,
    conflict: 0.6,
    value: 0.6,
  },
  전택궁: {
    core: 0.4,
    communication: 0.4,
    emotion: 0.6,
    conflict: 0.4,
    value: 1.0,
  },
};

// ============================================================
// 밝기 점수
// ============================================================

const BRIGHTNESS_SCORE: Record<Brightness, number> = {
  묘: 100,
  왕: 80,
  득: 60,
  리: 40,
  평: 20,
  함: 0,
};

const SIHUA_SCORE: Record<Sihua, number> = {
  화록: 20,
  화권: 15,
  화과: 10,
  화기: -20,
};

// ============================================================
// 오행 매핑
// ============================================================

const WUXING_JU_ELEMENT: Record<number, string> = {
  2: "수(水)",
  3: "목(木)",
  4: "금(金)",
  5: "토(土)",
  6: "화(火)",
};

// ============================================================
// 핵심 로직
// ============================================================

interface WeightedTrait {
  trait: string;
  weight: number;
}

const isMainStar = (name: string): name is MainStarName => {
  return (MAIN_STAR_NAMES as readonly string[]).includes(name);
};

/**
 * 카테고리별 가중 특성 수집
 */
const collectWeightedTraits = (
  chart: ZiweiChart
): {
  core: WeightedTrait[];
  communication: WeightedTrait[];
  emotion: WeightedTrait[];
  conflict: WeightedTrait[];
  value: WeightedTrait[];
  strengths: WeightedTrait[];
  weaknesses: WeightedTrait[];
} => {
  const result = {
    core: [] as WeightedTrait[],
    communication: [] as WeightedTrait[],
    emotion: [] as WeightedTrait[],
    conflict: [] as WeightedTrait[],
    value: [] as WeightedTrait[],
    strengths: [] as WeightedTrait[],
    weaknesses: [] as WeightedTrait[],
  };

  for (const palace of chart.palaces) {
    const weights = PALACE_PROFILE_WEIGHTS[palace.name];
    if (!weights) continue;

    for (const star of palace.mainStars) {
      if (!isMainStar(star.name)) continue;

      const brightnessGroup = toBrightnessGroup(star.brightness);
      const traitSet =
        STAR_TRAITS[star.name as MainStarName]?.[brightnessGroup];
      if (!traitSet) continue;

      // 밝기+사화 기반 영향력 점수
      const baseScore = BRIGHTNESS_SCORE[star.brightness];
      const sihuaBonus = star.sihua ? SIHUA_SCORE[star.sihua] : 0;
      const influence = (baseScore + sihuaBonus) / 100;

      // 카테고리별 가중치 적용
      for (const t of traitSet.personality) {
        result.core.push({ trait: t, weight: influence * weights.core });
      }
      for (const t of traitSet.communication) {
        result.communication.push({
          trait: t,
          weight: influence * weights.communication,
        });
      }
      for (const t of traitSet.emotion) {
        result.emotion.push({ trait: t, weight: influence * weights.emotion });
      }
      for (const t of traitSet.conflict) {
        result.conflict.push({
          trait: t,
          weight: influence * weights.conflict,
        });
      }
      // value = 재백궁/관록궁 가중
      for (const t of traitSet.personality) {
        result.value.push({ trait: t, weight: influence * weights.value });
      }
      for (const t of traitSet.strength) {
        result.strengths.push({ trait: t, weight: influence * weights.core });
      }
      for (const t of traitSet.weakness) {
        result.weaknesses.push({ trait: t, weight: influence * weights.core });
      }
    }
  }

  return result;
};

/**
 * 가중 특성 → 상위 N개 추출 (중복 제거)
 */
const topTraits = (weighted: WeightedTrait[], count: number): string[] => {
  // 같은 특성의 가중치 합산
  const merged = new Map<string, number>();
  for (const { trait, weight } of weighted) {
    merged.set(trait, (merged.get(trait) || 0) + weight);
  }

  return [...merged.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([trait]) => trait);
};

/**
 * 사화 보정 문자열 생성
 */
const describeSihua = (chart: ZiweiChart): string => {
  const parts: string[] = [];

  // 화록: 풍요
  const hualuPalace = chart.palaces.find((p) =>
    p.mainStars.some((s) => s.name === chart.sihua.hualu && s.sihua === "화록")
  );
  if (hualuPalace) {
    parts.push(`풍요 에너지가 ${hualuPalace.name} 영역에 집중`);
  }

  // 화기: 긴장
  const huajiPalace = chart.palaces.find((p) =>
    p.mainStars.some((s) => s.name === chart.sihua.huaji && s.sihua === "화기")
  );
  if (huajiPalace) {
    parts.push(`긴장 에너지가 ${huajiPalace.name} 영역에 존재`);
  }

  return parts.join(", ");
};

/**
 * 명궁 주성 기반 핵심 성격 문장 생성
 */
const buildCoreSentence = (chart: ZiweiChart): string => {
  const mingGong = chart.palaces.find((p) => p.name === "명궁");
  if (!mingGong || mingGong.mainStars.length === 0) {
    return "명궁 주성 없음 (차입궁으로 대궁 참조)";
  }

  const starDescriptions = mingGong.mainStars
    .filter((s) => isMainStar(s.name))
    .map((star) => {
      const group = toBrightnessGroup(star.brightness);
      const traits = STAR_TRAITS[star.name as MainStarName]?.[group];
      if (!traits) return star.name;

      const personality = traits.personality.slice(0, 2).join("/");
      const sihuaNote = star.sihua ? ` [${star.sihua}]` : "";
      return `${personality}(${star.brightness}${sihuaNote})`;
    });

  return starDescriptions.join(" + ");
};

/**
 * 종합 요약 문장 생성 (200자 내외)
 */
const buildSummary = (
  chart: ZiweiChart,
  coreTraits: string[],
  communicationStyle: string[],
  emotionalPattern: string[],
  conflictStyle: string[],
  strengths: string[],
  weaknesses: string[]
): string => {
  const coreSentence = buildCoreSentence(chart);
  const sihuaNote = describeSihua(chart);

  const parts = [
    `핵심 기운: ${coreSentence}.`,
    `성격: ${coreTraits.slice(0, 3).join(", ")}.`,
    `소통: ${communicationStyle.slice(0, 2).join(", ")}.`,
    `감정: ${emotionalPattern.slice(0, 2).join(", ")}.`,
    `갈등 시: ${conflictStyle.slice(0, 2).join(", ")}.`,
    `강점: ${strengths.slice(0, 2).join(", ")}.`,
    `약점: ${weaknesses.slice(0, 2).join(", ")}.`,
  ];

  if (sihuaNote) {
    parts.push(`${sihuaNote}.`);
  }

  return parts.join(" ");
};

/**
 * 명반에서 종합 성격 프로필 추출
 *
 * @description
 * 12궁의 주성 + 밝기를 star-traits에서 조회하고
 * 궁별 가중치를 적용하여 결정적 성격 프로필을 구성.
 * 동일 명반 → 항상 동일 결과.
 */
export const buildPersonalityProfile = (
  chart: ZiweiChart
): PersonalityProfile => {
  const weighted = collectWeightedTraits(chart);

  const coreTraits = topTraits(weighted.core, 5);
  const communicationStyle = topTraits(weighted.communication, 3);
  const emotionalPattern = topTraits(weighted.emotion, 3);
  const conflictStyle = topTraits(weighted.conflict, 3);
  const valueOrientation = topTraits(weighted.value, 3);
  const strengths = topTraits(weighted.strengths, 3);
  const weaknesses = topTraits(weighted.weaknesses, 3);

  const dominantElement = WUXING_JU_ELEMENT[chart.wuxingJu] || "알 수 없음";

  const summary = buildSummary(
    chart,
    coreTraits,
    communicationStyle,
    emotionalPattern,
    conflictStyle,
    strengths,
    weaknesses
  );

  return {
    coreTraits,
    communicationStyle,
    emotionalPattern,
    conflictStyle,
    valueOrientation,
    strengths,
    weaknesses,
    dominantElement,
    summary,
  };
};
