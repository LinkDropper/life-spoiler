import type { Locale } from "@/i18n/config";
import { defaultLocale } from "@/i18n/config";

import { enPrompts } from "./en";
import { jaPrompts } from "./ja";
import { koPrompts } from "./ko";
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
