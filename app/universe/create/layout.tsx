import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { createAuthClient } from "@/libs/supabase";
import { findMyUniversePublicId } from "@/libs/universe/service";
import { getLocalizedAlternates, getSeoLocale } from "@/libs/seo/metadata";
import {
  OPEN_GRAPH_LOCALE,
  SITE_NAME,
  buildLocalizedUrl,
} from "@/libs/seo/site";
import { getOpenGraphImage } from "@/libs/utils/og";

/**
 * `/universe/create` 오픈그래프. 동적 데이터가 없는 정적 폼 페이지라
 * `/universe/[publicId]/layout.tsx`와 달리 조회 없이 고정 문구만 쓴다.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getSeoLocale();
  const ogImage = getOpenGraphImage(locale);
  const t = await getTranslations("universe.create");

  const ogTitle = t("title");
  const ogDescription = t("description");
  const pageUrl = buildLocalizedUrl("/universe/create", locale);

  return {
    title: ogTitle,
    description: ogDescription,
    openGraph: {
      type: "website",
      locale: OPEN_GRAPH_LOCALE[locale],
      url: pageUrl,
      siteName: SITE_NAME[locale],
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
    alternates: await getLocalizedAlternates("/universe/create"),
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
