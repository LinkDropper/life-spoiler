import { NextResponse, userAgent } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

import {
  ATTRIBUTION_COOKIE,
  ATTRIBUTION_COOKIE_MAX_AGE,
  VISITOR_ID_COOKIE,
  VISITOR_ID_COOKIE_MAX_AGE,
  logAccess,
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
 * 페이지 접속을 access_logs에 남기고, utm_* 가 붙은 랜딩이면 마지막 유입 쿠키를
 * 갱신해 utm_events에 landing도 남긴다. 가입·결제 시 이 쿠키를 읽어 유입경로를
 * 귀속시킨다.
 *
 * 방문자 ID는 모든 방문자에게 발급해 접속 → 유입 → 가입 → 결제를 묶는다.
 * 만료를 늦추기 위해 접속마다 쿠키를 다시 내려준다.
 */
const trackVisit = (
  request: NextRequest,
  response: NextResponse,
  event: NextFetchEvent
) => {
  if (!isPageNavigation(request)) return;

  const { nextUrl, headers, cookies } = request;
  const referrer = headers.get("referer");
  const secure = nextUrl.protocol === "https:";
  const existingVisitorId = parseVisitorId(
    cookies.get(VISITOR_ID_COOKIE)?.value
  );
  const visitorId = existingVisitorId ?? crypto.randomUUID();

  response.cookies.set(VISITOR_ID_COOKIE, visitorId, {
    path: "/",
    maxAge: VISITOR_ID_COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    secure,
  });

  event.waitUntil(
    logAccess({
      url: nextUrl,
      referrer,
      visitorId,
      isNewVisitor: !existingVisitorId,
      // resolveLocaleResponse가 요청 쿠키에 적용 로케일을 넣어 둔다
      locale: cookies.get(LOCALE_COOKIE_NAME)?.value ?? null,
      rawDeviceType: userAgent(request).device.type,
      country: headers.get("x-vercel-ip-country"),
    })
  );

  const attribution = parseAttributionFromUrl({ url: nextUrl, referrer });
  if (!attribution) return;

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
  trackVisit(request, response, event);
  return response;
};

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
