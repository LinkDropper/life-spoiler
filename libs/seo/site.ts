import { defaultLocale, locales } from "@/i18n/config";
import type { Locale } from "@/i18n/config";

/**
 * 검색엔진·AI 크롤러에 노출하는 정규(canonical) 오리진.
 *
 * Vercel에서 `life-spoiler.com` → `www.life-spoiler.com`으로 리다이렉트되므로
 * 실제 200 응답을 주는 www 호스트를 정규 주소로 쓴다. canonical/sitemap/robots가
 * 리다이렉트되는 주소를 가리키면 크롤러가 정규 URL을 확정하지 못한다.
 */
export const SITE_URL = "https://www.life-spoiler.com";

export const SITE_NAME: Record<Locale, string> = {
  ko: "인생스포",
  en: "Life Spoiler",
  ja: "ライフスポイラー",
};

export const ORGANIZATION = {
  legalName: "웬 컴퍼니 (When Company)",
  email: "ttja.when@gmail.com",
  telephone: "+82-70-8098-6285",
  address: {
    streetAddress: "봉천로13나길 19",
    addressLocality: "관악구",
    addressRegion: "서울특별시",
    addressCountry: "KR",
  },
  sameAs: [
    "https://www.instagram.com/life.spoiler_",
    "https://x.com/LDropper97603",
  ],
} as const;

export const OPEN_GRAPH_LOCALE: Record<Locale, string> = {
  ko: "ko_KR",
  en: "en_US",
  ja: "ja_JP",
};

/** BCP 47 언어 태그 (JSON-LD `inLanguage`, hreflang 공용) */
export const LANGUAGE_TAG: Record<Locale, string> = {
  ko: "ko-KR",
  en: "en",
  ja: "ja-JP",
};

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && locales.includes(value as Locale);

/**
 * 로케일별 공개 URL. 로케일은 쿠키로 유지되지만 크롤러는 쿠키가 없으므로
 * `?locale=` 쿼리로 각 언어 버전에 직접 접근할 수 있게 한다(middleware.ts에서 처리).
 * 기본 로케일(ko)은 쿼리 없는 주소를 정규 URL로 쓴다.
 */
export const buildLocalizedUrl = (path: string, locale: Locale): string => {
  const url = new URL(path, SITE_URL);
  if (locale !== defaultLocale) {
    url.searchParams.set("locale", locale);
  }
  return url.toString();
};

/**
 * Next.js Metadata `alternates` 생성. 렌더링된 로케일의 URL을 canonical로,
 * 세 언어 버전을 hreflang으로 연결한다.
 */
export const buildAlternates = (path: string, locale: Locale) => ({
  canonical: buildLocalizedUrl(path, locale),
  languages: {
    ko: buildLocalizedUrl(path, "ko"),
    en: buildLocalizedUrl(path, "en"),
    ja: buildLocalizedUrl(path, "ja"),
    "x-default": buildLocalizedUrl(path, defaultLocale),
  },
});
