import type { Locale } from "@/i18n/config";
import { defaultLocale } from "@/i18n/config";

import type { PastLifeInterpretationType } from "../types";

import { enPrompts } from "./en";
import { jaPrompts } from "./ja";
import { koPrompts } from "./ko";
import { pastLifeSystemPromptEn, pastLifeUserPromptsEn } from "./past-life-en";
import { pastLifeSystemPromptJa, pastLifeUserPromptsJa } from "./past-life-ja";
import { pastLifeSystemPromptKo, pastLifeUserPromptsKo } from "./past-life-ko";
import type { LocalizedPrompts } from "./types";

export type { LocalizedPrompts } from "./types";

/**
 * 언어별 프롬프트 매핑
 */
const promptsByLocale: Record<Locale, LocalizedPrompts> = {
  ko: koPrompts,
  en: enPrompts,
  ja: jaPrompts,
};

/**
 * 언어에 따른 프롬프트 가져오기
 */
export const getPrompts = (language?: Locale): LocalizedPrompts => {
  const locale = language ?? defaultLocale;
  return promptsByLocale[locale] ?? promptsByLocale[defaultLocale];
};

/**
 * 기본 언어로 프롬프트 내보내기 (하위 호환성)
 */
export const {
  ziweiSystemPrompt: ZIWEI_SYSTEM_PROMPT,
  userPrompts: USER_PROMPTS,
  palaceNameMap: PALACE_NAME_MAP,
  yearlySystemPrompt: YEARLY_SYSTEM_PROMPT,
  yearlyUserPrompts: YEARLY_USER_PROMPTS,
} = koPrompts;

// ============================================================
// 전생 운세 프롬프트
// ============================================================

/** 전생 운세 프롬프트 세트 */
export interface PastLifePrompts {
  systemPrompt: string;
  userPrompts: Record<PastLifeInterpretationType, string>;
}

/** 언어별 전생 운세 프롬프트 매핑 */
const pastLifePromptsByLocale: Record<Locale, PastLifePrompts> = {
  ko: {
    systemPrompt: pastLifeSystemPromptKo,
    userPrompts: pastLifeUserPromptsKo,
  },
  en: {
    systemPrompt: pastLifeSystemPromptEn,
    userPrompts: pastLifeUserPromptsEn,
  },
  ja: {
    systemPrompt: pastLifeSystemPromptJa,
    userPrompts: pastLifeUserPromptsJa,
  },
};

/**
 * 언어에 따른 전생 운세 프롬프트 가져오기
 */
export const getPastLifePrompts = (language?: Locale): PastLifePrompts => {
  const locale = language ?? defaultLocale;
  return (
    pastLifePromptsByLocale[locale] ?? pastLifePromptsByLocale[defaultLocale]
  );
};
