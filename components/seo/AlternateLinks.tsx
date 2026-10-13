import type { Locale } from "@/i18n/config";
import { buildAlternates } from "@/libs/seo/site";

interface AlternateLinksProps {
  path: string;
  locale: Locale;
}

/**
 * canonical + hreflang `<link>`를 직접 렌더링한다 (React 19가 <head>로 호이스팅).
 *
 * Next.js Metadata API는 경로가 `/`인 URL을 origin으로 바꾸면서 쿼리스트링을 버려
 * (`next/dist/lib/metadata/resolvers/resolve-url.js`의 `resolveAbsoluteUrlWithPathname`)
 * 홈의 `/?locale=en` 같은 언어별 URL을 표현할 수 없다. 이 경우에만 사용하고,
 * 그 외 페이지는 `getLocalizedAlternates`로 Metadata API를 쓴다.
 */
export const AlternateLinks = ({ path, locale }: AlternateLinksProps) => {
  const { canonical, languages } = buildAlternates(path, locale);

  return (
    <>
      <link rel="canonical" href={canonical} />
      {Object.entries(languages).map(([hrefLang, href]) => (
        <link key={hrefLang} rel="alternate" hrefLang={hrefLang} href={href} />
      ))}
    </>
  );
};
