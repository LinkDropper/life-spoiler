import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

import { defaultLocale, locales } from "./config";
import type { Locale } from "./config";

import translations from "../messages/translations.json";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value as
    | Locale
    | undefined;

  const locale =
    cookieLocale && locales.includes(cookieLocale)
      ? cookieLocale
      : defaultLocale;

  return {
    locale,
    messages: translations[locale],
  };
});
