import type { Metadata } from "next";
import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

import { env } from "@/env";
import { ProfileProvider } from "@/libs/stores/profile";
import { UserProvider } from "@/libs/stores/user";
import { getOpenGraphImage } from "@/libs/utils/og";
import BrowserRedirect from "@/components/BrowserRedirect";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { KakaoScript } from "@/components/common/KakaoScript";
import { NavigationEvents } from "@/libs/analytics";
import {
  OPEN_GRAPH_LOCALE,
  SITE_NAME,
  SITE_URL,
  isLocale,
} from "@/libs/seo/site";
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
} from "@/libs/seo/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";
import { defaultLocale } from "@/i18n/config";

import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  const rawLocale = await getLocale();
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const ogImage = getOpenGraphImage(locale);

  const title = t("title", {
    default: "인생스포 - 당신의 인생 시나리오를 미리 확인하세요",
  });
  const description = t("description", {
    default:
      "사주보다 더 정밀한 자미두수. 114개 별이 그리는 당신만의 운명 지도를 확인하세요.",
  });

  return {
    metadataBase: new URL(SITE_URL),
    verification: {
      google: env.GOOGLE_SITE_VERIFICATION,
      other: {
        "naver-site-verification": "b9f55db2e85752f53bee336ab2b11f91cfba35d1",
        ...(env.BING_SITE_VERIFICATION && {
          "msvalidate.01": env.BING_SITE_VERIFICATION,
        }),
      },
    },
    title,
    description,
    keywords: [
      "자미두수",
      "운세",
      "사주",
      "인생운세",
      "올해운세",
      "평생운세",
      "점술",
      "명리학",
      "인생스포",
      "Zi Wei Dou Shu",
      "fortune telling",
      "life spoiler",
      "life-spoiler",
      "astrology",
    ],
    authors: [{ name: SITE_NAME[locale], url: SITE_URL }],
    creator: SITE_NAME[locale],
    publisher: SITE_NAME[locale],
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: OPEN_GRAPH_LOCALE[locale],
      siteName: SITE_NAME[locale],
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 600,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    // canonical/hreflang은 페이지마다 다르므로 루트에서 지정하지 않는다.
    // 여기서 지정하면 모든 하위 페이지가 홈을 canonical로 상속해 중복 페이지로 취급된다.
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const schemaLocale = isLocale(locale) ? locale : defaultLocale;

  return (
    <html lang={locale}>
      <body>
        <JsonLd
          data={[
            buildOrganizationSchema(schemaLocale),
            buildWebSiteSchema(schemaLocale),
          ]}
        />
        <GoogleAnalytics />
        <KakaoScript />
        <Suspense fallback={null}>
          <NavigationEvents />
        </Suspense>
        <NextIntlClientProvider messages={messages}>
          <BrowserRedirect />
          <UserProvider>
            <ProfileProvider>{children}</ProfileProvider>
          </UserProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
