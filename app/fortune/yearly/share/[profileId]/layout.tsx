import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { createServerClient } from "@/libs/supabase/client";
import type { Database, ProfileRow } from "@/libs/supabase/types";
import { getOpenGraphImage } from "@/libs/utils/og";
import type { SupabaseClient } from "@supabase/supabase-js";

type SupabaseDB = SupabaseClient<Database>;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://life-spoiler.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ profileId: string }>;
}): Promise<Metadata> {
  const { profileId } = await params;
  const locale = await getLocale();
  const ogImage = getOpenGraphImage(locale);
  const t = await getTranslations("fortune.yearly");
  const tMeta = await getTranslations("metadata");

  const currentYear = new Date().getFullYear();

  let profileName = "";
  try {
    const supabase = createServerClient() as SupabaseDB;
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", profileId)
      .single<Pick<ProfileRow, "name">>();

    if (profile) {
      profileName = profile.name;
    }
  } catch {
    // fallback to default metadata
  }

  const ogTitle = profileName
    ? t("share.ogTitle", { name: profileName, year: currentYear })
    : tMeta("title");

  const ogDescription = profileName
    ? t("share.ogDescription", { name: profileName, year: currentYear })
    : tMeta("description");

  const pageUrl = `${SITE_URL}/fortune/yearly/share/${profileId}`;

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

export default function YearlyShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
