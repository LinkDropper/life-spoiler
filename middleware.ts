import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { defaultLocale, locales } from "./i18n/config";
import type { Locale } from "./i18n/config";

const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

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
    if (locales.includes(code as Locale)) {
      return code as Locale;
    }
  }

  return null;
};

export const middleware = (request: NextRequest) => {
  const existingLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value as
    | Locale
    | undefined;

  if (existingLocale && locales.includes(existingLocale)) {
    return NextResponse.next();
  }

  const acceptLanguage = request.headers.get("accept-language");
  const detectedLocale = parseAcceptLanguage(acceptLanguage) ?? defaultLocale;

  const response = NextResponse.next();
  response.cookies.set(LOCALE_COOKIE_NAME, detectedLocale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return response;
};

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
