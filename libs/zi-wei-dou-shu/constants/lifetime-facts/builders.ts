import type { LocalizedText } from "../explanations/types";

import type { FactDirection, FactRule, FactStrength } from "./types";

/** 세 언어 문장을 LocalizedText로 묶는다. */
export const lt = (ko: string, en: string, ja: string): LocalizedText => ({
  ko,
  en,
  ja,
});

/** FactRule 생성 단축 함수 (표 가독성용). */
export const rule = (
  topic: string,
  direction: FactDirection,
  strength: FactStrength,
  sceneSeeds: string[],
  evidence: LocalizedText
): FactRule => ({ topic, direction, strength, sceneSeeds, evidence });
