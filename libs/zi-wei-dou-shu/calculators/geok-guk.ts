import {
  GEOK_GUK_PATTERNS,
  type GeokGukPattern,
} from "../constants/geok-guk-patterns";
import { BRIGHTNESS_SCORE } from "../constants/brightness-table";
import type { Brightness, Palace, ZiweiChart } from "../types";

import { calculateSamBangSaJeong } from "./sam-bang";

// ============================================================
// 격국(格局) 분석
// ============================================================

export interface IdentifiedGeokGuk {
  /** 격국 이름 */
  name: string;
  /** 격국 의미 */
  meaning: string;
  /** 격국 등급 */
  grade: "대격" | "중격" | "소격";
  /** 격국이 발견된 궁 이름 */
  palaceName: string;
  /** 격국을 구성하는 별 이름 목록 */
  stars: string[];
}

/**
 * 궁에서 보조성 조건이 충족되는지 확인
 */
const checkMinorStars = (palace: Palace, required: string[]): boolean => {
  const minorStarNames = palace.minorStars.map((s) => s.name);
  return required.every((star) => minorStarNames.includes(star));
};

/**
 * 궁에서 밝기 조건이 충족되는지 확인
 */
const checkBrightness = (
  palace: Palace,
  condition: NonNullable<GeokGukPattern["brightnessCondition"]>
): boolean => {
  const allStars = [...palace.mainStars, ...palace.minorStars];
  const targetStar = allStars.find((s) => s.name === condition.star);
  if (!targetStar) return false;

  const starScore = BRIGHTNESS_SCORE[targetStar.brightness];
  const minScore = BRIGHTNESS_SCORE[condition.minBrightness as Brightness];
  return starScore >= minScore;
};

/**
 * 쌍록격 특수 조건: 궁에 화록 사화가 적용된 별이 있는지 확인
 */
const hasHualuInPalace = (palace: Palace): boolean => {
  const allStars = [...palace.mainStars, ...palace.minorStars];
  return allStars.some((s) => s.sihua === "화록");
};

/**
 * 동궁 패턴 매칭
 */
const matchDonggungPattern = (
  palace: Palace,
  pattern: GeokGukPattern
): boolean => {
  const mainStarNames = palace.mainStars.map((s) => s.name);

  // 주성 조건 확인
  if (
    !pattern.requiredMainStars.every((star) => mainStarNames.includes(star))
  ) {
    return false;
  }

  // 보조성 조건 확인
  if (
    pattern.requiredMinorStars &&
    !checkMinorStars(palace, pattern.requiredMinorStars)
  ) {
    return false;
  }

  // 밝기 조건 확인
  if (
    pattern.brightnessCondition &&
    !checkBrightness(palace, pattern.brightnessCondition)
  ) {
    return false;
  }

  // 쌍록격 특수 조건: 록존 + 화록이 동궁해야 함
  if (pattern.name === "쌍록격" && !hasHualuInPalace(palace)) {
    return false;
  }

  return true;
};

/**
 * 명반에서 격국 패턴을 식별
 *
 * 12궁을 순회하며 동궁/삼방 패턴을 매칭.
 * - 동궁: 같은 궁에 필요한 주성(+보조성) 조건 충족
 * - 삼방: 삼방사정(본궁+대궁+삼합1+삼합2)에 필요한 주성이 모두 분포
 *
 * @param chart 명반 데이터
 * @returns 식별된 격국 목록
 */
export const identifyGeokGuk = (chart: ZiweiChart): IdentifiedGeokGuk[] => {
  const results: IdentifiedGeokGuk[] = [];
  const seen = new Set<string>();

  for (const palace of chart.palaces) {
    // 동궁 패턴 검사
    for (const pattern of GEOK_GUK_PATTERNS) {
      if (pattern.type !== "동궁") continue;

      if (matchDonggungPattern(palace, pattern)) {
        const key = `${pattern.name}-${palace.name}`;
        if (!seen.has(key)) {
          seen.add(key);
          const stars = [
            ...pattern.requiredMainStars,
            ...(pattern.requiredMinorStars || []),
          ];
          results.push({
            name: pattern.name,
            meaning: pattern.meaning,
            grade: pattern.grade,
            palaceName: palace.name,
            stars,
          });
        }
      }
    }

    // 삼방 패턴 검사
    const samBang = calculateSamBangSaJeong(chart.palaces, palace.branch);
    if (!samBang) continue;

    const samBangStarNames = [
      ...samBang.self.mainStars.map((s) => s.name),
      ...samBang.opposite.mainStars.map((s) => s.name),
      ...samBang.triangle1.mainStars.map((s) => s.name),
      ...samBang.triangle2.mainStars.map((s) => s.name),
    ];

    for (const pattern of GEOK_GUK_PATTERNS) {
      if (pattern.type !== "삼방") continue;

      const allPresent = pattern.requiredMainStars.every((star) =>
        samBangStarNames.includes(star)
      );

      if (allPresent) {
        const key = `${pattern.name}-${palace.name}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            name: pattern.name,
            meaning: pattern.meaning,
            grade: pattern.grade,
            palaceName: palace.name,
            stars: pattern.requiredMainStars,
          });
        }
      }
    }
  }

  return results;
};
