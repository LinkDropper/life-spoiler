import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

/**
 * 마케팅 단축 URL 리다이렉트
 *
 * /go/{slug} → /?utm_source=...&utm_medium=...&utm_campaign=...
 *
 * 사용 예:
 *   life-spoiler.com/go/tamlang
 *   life-spoiler.com/go/x (프로필 바이오 링크)
 */

interface RedirectConfig {
  destination: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
}

const REDIRECTS: Record<string, RedirectConfig> = {
  // X 포스트용
  tamlang: {
    destination: "/",
    utm_source: "x",
    utm_medium: "social",
    utm_campaign: "2026-04-star-tamlang",
  },
  mbti: {
    destination: "/",
    utm_source: "x",
    utm_medium: "social",
    utm_campaign: "2026-04-mbti-compare",
  },
  daeun: {
    destination: "/",
    utm_source: "x",
    utm_medium: "social",
    utm_campaign: "2026-04-daeun-timing",
  },
  cheongi: {
    destination: "/",
    utm_source: "x",
    utm_medium: "social",
    utm_campaign: "2026-04-star-cheongi",
  },
  timing: {
    destination: "/",
    utm_source: "x",
    utm_medium: "social",
    utm_campaign: "2026-04-daeun-timing",
  },
  gwanrok: {
    destination: "/",
    utm_source: "x",
    utm_medium: "social",
    utm_campaign: "2026-04-work-style",
  },
  myung: {
    destination: "/",
    utm_source: "x",
    utm_medium: "social",
    utm_campaign: "2026-04-ziwei-fate",
  },
  spring: {
    destination: "/",
    utm_source: "x",
    utm_medium: "social",
    utm_campaign: "2026-04-spring-energy",
  },
  jaemul: {
    destination: "/",
    utm_source: "x",
    utm_medium: "social",
    utm_campaign: "2026-04-wealth-pattern",
  },
  bucheo: {
    destination: "/",
    utm_source: "x",
    utm_medium: "social",
    utm_campaign: "2026-04-relationship-style",
  },
  romance: {
    destination: "/",
    utm_source: "x",
    utm_medium: "social",
    utm_campaign: "2026-04-romance-compatibility",
  },
  horoscope: {
    destination: "/",
    utm_source: "x",
    utm_medium: "social",
    utm_campaign: "2026-04-daily-horoscope",
  },
  create: {
    destination: "/",
    utm_source: "x",
    utm_medium: "social",
    utm_campaign: "2026-04-spring-creativity",
  },
  start: {
    destination: "/",
    utm_source: "x",
    utm_medium: "social",
    utm_campaign: "2026-04-spring-start",
  },
  wuqu: {
    destination: "/",
    utm_source: "x",
    utm_medium: "social",
    utm_campaign: "2026-05-star-wuqu",
  },
  jeonttaek: {
    destination: "/",
    utm_source: "x",
    utm_medium: "social",
    utm_campaign: "2026-04-space-energy",
  },
  // 실험 포스트 단축 링크
  "exp-comp": {
    destination: "/",
    utm_source: "x",
    utm_medium: "social",
    utm_campaign: "exp-202617-01-comparison",
  },
  "exp-know": {
    destination: "/",
    utm_source: "x",
    utm_medium: "social",
    utm_campaign: "exp-202617-01-knowledge",
  },
  // 채널별 프로필 링크
  x: {
    destination: "/",
    utm_source: "x",
    utm_medium: "profile",
    utm_campaign: "bio-link",
  },
  brunch: {
    destination: "/",
    utm_source: "brunch",
    utm_medium: "blog",
    utm_campaign: "post-cta",
  },
  instagram: {
    destination: "/",
    utm_source: "instagram",
    utm_medium: "profile",
    utm_campaign: "bio-link",
  },
};

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export const GET = async (request: NextRequest, { params }: RouteParams) => {
  const { slug } = await params;
  const config = REDIRECTS[slug];

  if (!config) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const url = new URL(config.destination, request.url);
  url.searchParams.set("utm_source", config.utm_source);
  url.searchParams.set("utm_medium", config.utm_medium);
  url.searchParams.set("utm_campaign", config.utm_campaign);

  return NextResponse.redirect(url, { status: 302 });
};
