import type { Palace, StarInfo } from "../types";

import { calculateSamBangSaJeong } from "./sam-bang";

// ============================================================
// 空宮(주성 없는 궁) 借對宮 처리
// ============================================================

const BRIGHTNESS_SCORE: Record<string, number> = {
  묘: 100,
  왕: 80,
  득: 60,
  리: 40,
  평: 20,
  함: 0,
};

const sumBrightness = (stars: StarInfo[]): number =>
  stars.reduce(
    (sum, star) => sum + (BRIGHTNESS_SCORE[star.brightness] ?? 0),
    0
  );

/**
 * 삼합궁(triangle1/triangle2) 중 차용할 궁 선택
 * 우선순위: 주성 개수 → 밝기 합산 → triangle1(본궁+4)
 */
const pickBestTrianglePalace = (
  triangle1: Palace,
  triangle2: Palace
): Palace | null => {
  const candidates = [triangle1, triangle2].filter(
    (p) => p.mainStars.length > 0
  );
  if (candidates.length === 0) return null;

  return candidates.reduce((best, current) => {
    if (current.mainStars.length !== best.mainStars.length) {
      return current.mainStars.length > best.mainStars.length ? current : best;
    }
    return sumBrightness(current.mainStars) > sumBrightness(best.mainStars)
      ? current
      : best;
  });
};

/**
 * 空宮에 借對宮(대궁 차용) 원칙을 적용해 borrowedMainStars/borrowedFromPalace를 채운다.
 *
 * 원칙 (삼합파 三方四正 기준):
 * 1. 본궁에 주성이 없으면 대궁(對宮, 본궁+6)의 주성을 차용한다 — 정통 借對宮 기법.
 * 2. 대궁도 空宮인 극히 드문 경우("命遷線 雙空" 유형), 같은 삼방사정(三方四正) 안의
 *    삼합궁(본궁+4, 본궁+8) 중 주성이 있는 쪽을 차선책으로 차용한다.
 *    근거: 삼합파는 본궁·대궁·삼합2궁 4개를 하나의 격국 판단 단위로 취급하므로,
 *    대궁 차용이 불가능할 때 나머지 삼방(三方) 궁을 참고하는 것이 이론적으로 일관된다.
 *    두 삼합궁 모두 주성이 있으면 주성 개수 → 밝기 합산이 더 큰 궁을 우선한다.
 * 3. 삼방사정 전체가 空宮인 경우(이론상 14주성 분포로는 사실상 발생하지 않음)는
 *    차용 없이 isEmptyPalace만 true로 남긴다.
 *
 * 원본 mainStars는 절대 덮어쓰지 않는다 — 空宮 여부를 하위 로직이 구분할 수 있어야 한다.
 */
export const resolveEmptyPalaces = (palaces: Palace[]): Palace[] => {
  return palaces.map((palace) => {
    if (palace.mainStars.length > 0) {
      return { ...palace, isEmptyPalace: false };
    }

    const samBang = calculateSamBangSaJeong(palaces, palace.branch);
    if (!samBang) {
      return { ...palace, isEmptyPalace: true };
    }

    const { opposite, triangle1, triangle2 } = samBang;

    if (opposite.mainStars.length > 0) {
      return {
        ...palace,
        isEmptyPalace: true,
        borrowedMainStars: opposite.mainStars,
        borrowedFromPalace: opposite.name,
      };
    }

    const borrowedFrom = pickBestTrianglePalace(triangle1, triangle2);
    if (!borrowedFrom) {
      return { ...palace, isEmptyPalace: true };
    }

    return {
      ...palace,
      isEmptyPalace: true,
      borrowedMainStars: borrowedFrom.mainStars,
      borrowedFromPalace: borrowedFrom.name,
    };
  });
};

/**
 * 궁의 "실효 주성" 조회 — 空宮이면 차용 주성을, 아니면 원래 주성을 반환한다.
 * 키워드/성격/한줄표현 등 하위 소비 로직에서 공통으로 사용.
 */
export const getEffectiveMainStars = (palace: Palace): StarInfo[] =>
  palace.mainStars.length > 0
    ? palace.mainStars
    : (palace.borrowedMainStars ?? []);
