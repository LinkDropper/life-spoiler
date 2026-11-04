import type { MetadataRoute } from "next";

import { defaultLocale, locales } from "@/i18n/config";
import type { Locale } from "@/i18n/config";
import { buildLocalizedUrl } from "@/libs/seo/site";

interface SitemapPage {
  path: string;
  /**
   * 콘텐츠가 실제로 바뀐 날짜. 빌드 시각(`new Date()`)을 넣으면 매 배포마다
   * 모든 URL이 "수정됨"이 되어 검색엔진이 lastmod 신호 자체를 무시하게 된다.
   * 페이지 본문을 수정하면 이 날짜도 함께 갱신한다.
   */
  lastModified: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
  /**
   * 색인을 제공하는 언어. 생략하면 전체 언어(ko/en/ja)로 hreflang을 낸다.
   * 콘텐츠가 특정 언어로만 있는 페이지(예: KO 전용 /daily)는 해당 언어만 지정한다.
   */
  locales?: readonly Locale[];
}

const PUBLIC_PAGES: SitemapPage[] = [
  {
    path: "/",
    lastModified: "2026-11-04",
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    path: "/ziwei-doushu",
    lastModified: "2026-10-13",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    path: "/face-spoiler",
    lastModified: "2026-11-04",
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    path: "/daily",
    lastModified: "2026-10-14",
    changeFrequency: "monthly",
    priority: 0.8,
    locales: ["ko"],
  },
  {
    path: "/universe/create",
    lastModified: "2026-10-13",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/policy/terms",
    lastModified: "2026-01-18",
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    path: "/policy/privacy",
    lastModified: "2026-01-18",
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    path: "/face-spoiler/policy/terms",
    lastModified: "2026-04-10",
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    path: "/face-spoiler/policy/privacy",
    lastModified: "2026-04-10",
    changeFrequency: "yearly",
    priority: 0.3,
  },
];

/**
 * 페이지 head의 hreflang(`buildAlternates`)과 같은 구성을 낸다. 여러 언어로 제공되는
 * 페이지는 x-default(기본 로케일 URL)를 함께 싣고, 단일 언어 페이지는 그 언어만 싣는다.
 */
const buildSitemapLanguages = (
  path: string,
  pageLocales: readonly Locale[]
): Record<string, string> => {
  const languages: Record<string, string> = Object.fromEntries(
    pageLocales.map((locale) => [locale, buildLocalizedUrl(path, locale)])
  );
  if (pageLocales.length > 1) {
    languages["x-default"] = buildLocalizedUrl(path, defaultLocale);
  }
  return languages;
};

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.map(
    ({
      path,
      lastModified,
      changeFrequency,
      priority,
      locales: pageLocales = locales,
    }) => ({
      url: buildLocalizedUrl(path, defaultLocale),
      lastModified,
      changeFrequency,
      priority,
      alternates: {
        languages: buildSitemapLanguages(path, pageLocales),
      },
    })
  );
}
