import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { defaultLocale } from "@/i18n/config";
import type { Locale } from "@/i18n/config";

import { buildAlternates, isLocale } from "./site";

/** 현재 요청의 로케일 (서버 전용). next-intl 값이 예상 밖이면 기본 로케일로 둔다. */
export const getSeoLocale = async (): Promise<Locale> => {
  const locale = await getLocale();
  return isLocale(locale) ? locale : defaultLocale;
};

/** 공개 페이지용: 렌더링된 로케일 기준 자기참조 canonical + 3개 언어 hreflang */
export const getLocalizedAlternates = async (
  path: string
): Promise<Metadata["alternates"]> =>
  buildAlternates(path, await getSeoLocale());

/**
 * 개인 결과·공유·계정 페이지용. 링크 미리보기와 링크 따라가기는 허용하되 색인에서는 제외한다.
 * 이름 등 개인 정보가 들어간 페이지가 검색·AI 답변에 노출되지 않도록 한다.
 */
export const NOINDEX_METADATA = {
  robots: { index: false, follow: true },
  alternates: { canonical: null },
} satisfies Metadata;
