import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { createServerClient } from "@/libs/supabase/client";
import type { Database, FortuneRow, ProfileRow } from "@/libs/supabase/types";
import type { LifetimeFortuneData } from "@/libs/supabase/fortune";
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
  const t = await getTranslations("fortune.lifetime");
  const tMeta = await getTranslations("metadata");

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

    // 프로필과 운세 데이터를 함께 조회
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
      .eq("fortune_type", "lifetime")
      .single<Pick<FortuneRow, "result">>();

    if (fortune?.result) {
      const fortuneData = fortune.result as unknown as LifetimeFortuneData;
      if (fortuneData.interpretation?.lifeSpoiler?.headline) {
        headline = removeEmoji(fortuneData.interpretation.lifeSpoiler.headline);
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

  // OG Title: 이름 + headline
  const ogTitle =
    profileName && headline
      ? t("share.ogTitleWithHeadline", { name: profileName, headline })
      : profileName
        ? t("share.ogTitle", { name: profileName })
        : tMeta("title");

  // OG Description: 점수 포함
  const ogDescription =
    profileName && scores
      ? t("share.ogDescriptionWithScores", {
          name: profileName,
          wealth: scores.wealth,
          career: scores.career,
          relationship: scores.relationship,
          health: scores.health,
        })
      : profileName
        ? t("share.ogDescription", { name: profileName })
        : tMeta("description");

  const pageUrl = `${SITE_URL}/fortune/lifetime/share/${profileId}`;

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

export default function LifetimeShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
