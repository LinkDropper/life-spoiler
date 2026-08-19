import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { getOpenGraphImage } from "@/libs/utils/og";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://life-spoiler.com";

/**
 * `/universe/create` 오픈그래프. 동적 데이터가 없는 정적 폼 페이지라
 * `/universe/[publicId]/layout.tsx`와 달리 조회 없이 고정 문구만 쓴다.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const ogImage = getOpenGraphImage(locale);
  const t = await getTranslations("universe.create");

  const ogTitle = t("title");
  const ogDescription = t("description");
  const pageUrl = `${SITE_URL}/universe/create`;

  return {
    title: ogTitle,
    description: ogDescription,
    openGraph: {
      type: "website",
      locale: locale === "ko" ? "ko_KR" : locale === "ja" ? "ja_JP" : "en_US",
      url: pageUrl,
      siteName: "인생스포",
      title: ogTitle,
      description: ogDescription,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 600,
          alt: ogTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
  };
}

export default function UniverseCreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
