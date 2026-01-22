import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

import { ProfileProvider } from "@/libs/stores/profile";
import { UserProvider } from "@/libs/stores/user";
import BrowserRedirect from "@/components/BrowserRedirect";

import "./globals.css";

const SITE_URL = "https://life-spoiler.com";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  const locale = await getLocale();

  const title = t("title", {
    default: "인생스포 - 당신의 인생 시나리오를 미리 확인하세요",
  });
  const description = t("description", {
    default:
      "사주보다 더 정밀한 자미두수. 114개 별이 그리는 당신만의 운명 지도를 확인하세요.",
  });

  return {
    metadataBase: new URL(SITE_URL),
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
      "Zi Wei Dou Shu",
      "fortune telling",
      "astrology",
    ],
    authors: [{ name: "인생스포" }],
    creator: "인생스포",
    publisher: "인생스포",
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
      locale: locale === "ko" ? "ko_KR" : locale === "ja" ? "ja_JP" : "en_US",
      url: SITE_URL,
      siteName: "인생스포",
      title,
      description,
      images: [
        {
          url: "/images/open-graph.png",
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
      images: ["/images/open-graph.png"],
    },
    alternates: {
      canonical: SITE_URL,
      languages: {
        ko: `${SITE_URL}?locale=ko`,
        en: `${SITE_URL}?locale=en`,
        ja: `${SITE_URL}?locale=ja`,
      },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
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
