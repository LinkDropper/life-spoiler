import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

export const middleware = (request: NextRequest) => {
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

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
