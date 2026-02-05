import { GEOK_GUK_PATTERNS } from "../constants/geok-guk-patterns";
import type { ZiweiChart } from "../types";

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
 * 명반에서 격국 패턴을 식별
 *
 * 12궁을 순회하며 동궁/삼방 패턴을 매칭.
 * - 동궁: 같은 궁에 필요한 주성이 모두 존재
 * - 삼방: 삼방사정(본궁+대궁+삼합1+삼합2)에 필요한 주성이 모두 분포
 *
 * @param chart 명반 데이터
 * @returns 식별된 격국 목록
 */
export const identifyGeokGuk = (chart: ZiweiChart): IdentifiedGeokGuk[] => {
  const results: IdentifiedGeokGuk[] = [];
  const seen = new Set<string>();

  for (const palace of chart.palaces) {
    const mainStarNames = palace.mainStars.map((s) => s.name);

    // 동궁 패턴 검사
    for (const pattern of GEOK_GUK_PATTERNS) {
      if (pattern.type !== "동궁") continue;

      const allPresent = pattern.requiredMainStars.every((star) =>
        mainStarNames.includes(star)
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
