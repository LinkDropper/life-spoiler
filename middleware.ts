import { NextResponse, userAgent } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

import {
  ATTRIBUTION_COOKIE,
  ATTRIBUTION_COOKIE_MAX_AGE,
  VISITOR_ID_COOKIE,
  VISITOR_ID_COOKIE_MAX_AGE,
  logUtmEvent,
  parseAttributionFromUrl,
  parseVisitorId,
  serializeAttribution,
} from "@/libs/attribution";

import { defaultLocale, locales } from "./i18n/config";
import type { Locale } from "./i18n/config";

const LOCALE_COOKIE_NAME = "NEXT_LOCALE";
const LOCALE_QUERY_PARAM = "locale";
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const isLocale = (value: string | null | undefined): value is Locale =>
  !!value && locales.includes(value as Locale);

const parseAcceptLanguage = (header: string | null): Locale | null => {
  if (!header) return null;

  const languages = header
    .split(",")
    .map((lang) => {
      const [code, q = "q=1"] = lang.trim().split(";");
      const quality = parseFloat(q.split("=")[1] || "1");
      const primaryCode = code.split("-")[0].toLowerCase();
      return { code: primaryCode, quality };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { code } of languages) {
    if (isLocale(code)) {
      return code;
    }
  }

  return null;
};

/**
 * 같은 요청의 서버 컴포넌트(`i18n/request.ts`의 cookies())가 바로 새 로케일을
 * 읽도록 요청 쿠키를 갱신하고, 다음 방문을 위해 응답 쿠키도 저장한다.
 */
const applyLocale = (request: NextRequest, locale: Locale) => {
  request.cookies.set(LOCALE_COOKIE_NAME, locale);

  const response = NextResponse.next({
    request: { headers: request.headers },
  });
  response.cookies.set(LOCALE_COOKIE_NAME, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
  });

  return response;
};

const resolveLocaleResponse = (request: NextRequest) => {
  // `?locale=en` 같은 명시적 지정이 최우선이다. 쿠키가 없는 검색엔진·AI 크롤러가
  // hreflang으로 연결된 각 언어 버전에 접근하는 유일한 경로다.
  const queryLocale = request.nextUrl.searchParams.get(LOCALE_QUERY_PARAM);
  if (isLocale(queryLocale)) {
    return applyLocale(request, queryLocale);
  }

  const existingLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  if (isLocale(existingLocale)) {
    return NextResponse.next();
  }

  const acceptLanguage = request.headers.get("accept-language");
  const detectedLocale = parseAcceptLanguage(acceptLanguage) ?? defaultLocale;

  return applyLocale(request, detectedLocale);
};

/**
 * 링크 프리페치·RSC fetch·봇 요청은 사용자의 실제 랜딩이 아니므로 로그에서 뺀다.
 * Next.js는 middleware에 넘기기 전에 RSC 헤더를 지우므로 Sec-Fetch-Dest로 구분한다.
 * 이 헤더를 보내지 않는 오래된 인앱 브라우저는 페이지 이동으로 간주한다.
 */
const isPageNavigation = (request: NextRequest) => {
  const { headers } = request;
  if (request.method !== "GET") return false;
  const fetchDest = headers.get("sec-fetch-dest");
  if (fetchDest && fetchDest !== "document") return false;
  const purpose = headers.get("purpose") ?? headers.get("sec-purpose");
  if (purpose?.includes("prefetch")) return false;
  return !userAgent(request).isBot;
};

/**
 * utm_* 가 붙은 랜딩이면 마지막 유입 쿠키를 갱신하고 utm_events에 landing을 남긴다.
 * 가입·결제 시 이 쿠키를 읽어 유입경로를 귀속시킨다.
 */
const trackUtmLanding = (
  request: NextRequest,
  response: NextResponse,
  event: NextFetchEvent
) => {
  if (!isPageNavigation(request)) return;

  const attribution = parseAttributionFromUrl({
    url: request.nextUrl,
    referrer: request.headers.get("referer"),
  });
  if (!attribution) return;

  const secure = request.nextUrl.protocol === "https:";
  const visitorId =
    parseVisitorId(request.cookies.get(VISITOR_ID_COOKIE)?.value) ??
    crypto.randomUUID();

  response.cookies.set(VISITOR_ID_COOKIE, visitorId, {
    path: "/",
    maxAge: VISITOR_ID_COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    secure,
  });
  response.cookies.set(ATTRIBUTION_COOKIE, serializeAttribution(attribution), {
    path: "/",
    maxAge: ATTRIBUTION_COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    secure,
  });

  event.waitUntil(
    logUtmEvent({ eventType: "landing", attribution, visitorId })
  );
};

export const middleware = (request: NextRequest, event: NextFetchEvent) => {
  const response = resolveLocaleResponse(request);
  trackUtmLanding(request, response, event);
  return response;
};

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
