import type { MetadataRoute } from "next";

import { defaultLocale } from "@/i18n/config";
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
}

const PUBLIC_PAGES: SitemapPage[] = [
  {
    path: "/",
    lastModified: "2026-10-13",
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
    lastModified: "2026-10-13",
    changeFrequency: "weekly",
    priority: 0.9,
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

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.map(
    ({ path, lastModified, changeFrequency, priority }) => ({
      url: buildLocalizedUrl(path, defaultLocale),
      lastModified,
      changeFrequency,
      priority,
      alternates: {
        languages: {
          ko: buildLocalizedUrl(path, "ko"),
          en: buildLocalizedUrl(path, "en"),
          ja: buildLocalizedUrl(path, "ja"),
        },
      },
    })
  );
}
