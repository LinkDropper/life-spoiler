import type { LocalizedText } from "../explanations/types";

import type {
  FactDirection,
  FactRule,
  FactStrength,
  NarrativeMaterial,
} from "./types";

/** 세 언어 문장을 LocalizedText로 묶는다. */
export const lt = (ko: string, en: string, ja: string): LocalizedText => ({
  ko,
  en,
  ja,
});

/**
 * FactRule 생성 단축 함수 (표 가독성용).
 * 재설계 3단계: docs/lifetime-prompt-redesign-2026-11.md §3.2
 */
export const fact = (
  topic: string,
  direction: FactDirection,
  strength: FactStrength,
  material: NarrativeMaterial,
  evidence: LocalizedText
): FactRule => ({
  topic,
  direction,
  strength,
  evidence,
  material,
});
