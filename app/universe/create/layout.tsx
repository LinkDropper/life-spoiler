import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { createAuthClient } from "@/libs/supabase";
import { findMyUniversePublicId } from "@/libs/universe/service";
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

export default async function UniverseCreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publicId = await findMyExistingUniversePublicId();

  if (publicId) {
    redirect(`/universe/${publicId}`);
  }

  return <>{children}</>;
}

/** 로그인 유저가 이미 소유한 우주가 있는지 확인한다. 비로그인이면 확인 없이 null. */
const findMyExistingUniversePublicId = async (): Promise<string | null> => {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return findMyUniversePublicId(user.id);
};
