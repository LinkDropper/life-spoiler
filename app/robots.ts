import type { MetadataRoute } from "next";

import { SITE_URL } from "@/libs/seo/site";

/**
 * 결제·인증·계정 등 공유되지 않는 경로만 크롤링을 막는다.
 * 공유 링크(운세 share, 관상 리포트, 우주 페이지)는 막지 않는다 — robots.txt로 막으면
 * 카카오톡·X 링크 미리보기 봇이 OG 태그를 못 읽고, 페이지의 noindex도 확인할 수 없다.
 * 이런 개인 페이지는 각 layout/page의 `robots: noindex` 메타데이터로 색인만 제외한다.
 */
const DISALLOWED_PATHS = [
  "/api/",
  "/auth/",
  "/payment/",
  "/profile/",
  "/profiles",
  "/coupon",
  "/face-spoiler/payment/",
  "/face-spoiler/profiles",
  "/face-spoiler/upload",
];

/**
 * 공식 문서로 확인된 AI 검색·응답용 크롤러 토큰 (2026-10 기준).
 * `*` 그룹과 규칙이 같아 동작상 차이는 없지만, AI 크롤러를 의도적으로 허용한다는
 * 정책을 명시하고 특정 봇 차단 정책이 생길 때 수정 지점을 한 곳으로 모은다.
 * - 검색 색인: OAI-SearchBot, Claude-SearchBot, PerplexityBot, Amzn-SearchBot,
 *   MistralAI-Index, DuckAssistBot, meta-webindexer
 * - 사용자 요청 시 조회: ChatGPT-User, Claude-User, Perplexity-User, MistralAI-User
 * - 학습: GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, meta-externalagent,
 *   Amazonbot, MistralAI-Training — 브랜드·자미두수 지식이 모델에 반영되도록 허용
 */
const AI_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "Claude-SearchBot",
  "Claude-User",
  "ClaudeBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "meta-webindexer",
  "meta-externalagent",
  "Amzn-SearchBot",
  "Amazonbot",
  "MistralAI-Index",
  "MistralAI-User",
  "MistralAI-Training",
  "DuckAssistBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOWED_PATHS },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: DISALLOWED_PATHS },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
