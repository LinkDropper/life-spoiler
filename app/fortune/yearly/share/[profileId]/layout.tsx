import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { createServerClient } from "@/libs/supabase/client";
import type { Database, FortuneRow, ProfileRow } from "@/libs/supabase/types";
import type { YearlyFortuneData } from "@/libs/supabase/fortune";
import { getOpenGraphImage } from "@/libs/utils/og";
import { removeEmoji } from "@/libs/utils/text";
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
  let headline = "";
  let scores: {
    wealth: number;
    career: number;
    relationship: number;
    health: number;
  } | null = null;

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

    const { data: fortune } = await supabase
      .from("fortunes")
      .select("result")
      .eq("profile_id", profileId)
      .eq("fortune_type", "yearly")
      .eq("year", currentYear)
      .single<Pick<FortuneRow, "result">>();

    if (fortune?.result) {
      const fortuneData = fortune.result as unknown as YearlyFortuneData;
      if (fortuneData.interpretation?.overview?.headline) {
        headline = removeEmoji(fortuneData.interpretation.overview.headline);
      }
      if (fortuneData.interpretation?.categories) {
        scores = {
          wealth: fortuneData.interpretation.categories.wealth.score,
          career: fortuneData.interpretation.categories.career.score,
          relationship:
            fortuneData.interpretation.categories.relationship.score,
          health: fortuneData.interpretation.categories.health.score,
        };
      }
    }
  } catch {
    // fallback to default metadata
  }

  const ogTitle =
    profileName && headline
      ? t("share.ogTitleWithHeadline", {
          name: profileName,
          year: currentYear,
          headline,
        })
      : profileName
        ? t("share.ogTitle", { name: profileName, year: currentYear })
        : tMeta("title");

  const ogDescription =
    profileName && scores
      ? t("share.ogDescriptionWithScores", {
          name: profileName,
          year: currentYear,
          wealth: scores.wealth,
          career: scores.career,
          relationship: scores.relationship,
          health: scores.health,
        })
      : profileName
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
