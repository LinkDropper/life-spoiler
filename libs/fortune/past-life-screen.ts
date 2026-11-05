import { isFortuneOwned } from "@/libs/home/home-profile";
import type { HomeFortuneKey } from "@/libs/home/home-profile";
import type { PastLifeProfileCardResponse } from "@/libs/services/ai/types";
import type { ProfileWithFortunes } from "@/libs/stores/profile/types";

/** 전생 본편 다음에 권할 운세: 인생 운세가 없으면 인생, 있으면 홈 순서로 아직 안 본 것 */
const NEXT_ORDER: HomeFortuneKey[] = [
  "lifetime",
  "yearly",
  "yearly2027",
  "compatibility",
  "faceReading",
];

export const pickNextAfterPastLife = (
  profile: ProfileWithFortunes | null
): HomeFortuneKey | null =>
  NEXT_ORDER.find((key) => !isFortuneOwned(profile, key)) ?? null;

export interface PastLifeTrait {
  key: string;
  code: string;
  word: string;
  percent: number;
}

/** 전생 성향 4개: score는 rightLabel 쪽(100) 비율. 기운 쪽 단어와 비율 */
export const toPastLifeTraits = (
  spectrums: PastLifeProfileCardResponse["spectrums"]
): PastLifeTrait[] =>
  spectrums.map((spectrum, index) => {
    const leansRight = spectrum.score >= 50;
    return {
      key: `${spectrum.label}-${index}`,
      code: spectrum.label,
      word: leansRight ? spectrum.rightLabel : spectrum.leftLabel,
      percent: Math.round(leansRight ? spectrum.score : 100 - spectrum.score),
    };
  });
