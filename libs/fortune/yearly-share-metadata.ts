import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import type { YearlyFortuneData } from "@/libs/supabase/fortune";
import { createServerClient } from "@/libs/supabase/client";
import type { Database, FortuneRow, ProfileRow } from "@/libs/supabase/types";
import { getOpenGraphImage } from "@/libs/utils/og";
import { removeEmoji } from "@/libs/utils/text";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { YearlyEdition } from "./yearly-editions";
import { resolveTargetYear } from "./yearly-editions";

type SupabaseDB = SupabaseClient<Database>;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://life-spoiler.com";

/**
 * yearly/yearly_2027 공유 페이지의 OG 메타데이터를 생성한다.
 * `.eq("year", ...)`·`.eq("fortune_type", ...)`를 edition 기반으로 결정한다.
 */
export const generateYearlyShareMetadata = async (
  edition: YearlyEdition,
  profileId: string
): Promise<Metadata> => {
  const locale = await getLocale();
  const ogImage = getOpenGraphImage(locale);
  const t = await getTranslations("fortune.yearly");
  const tMeta = await getTranslations("metadata");

  const targetYear = resolveTargetYear(edition);

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
      .eq("fortune_type", edition)
      .eq("year", targetYear)
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
          year: targetYear,
          headline,
        })
      : profileName
        ? t("share.ogTitle", { name: profileName, year: targetYear })
        : tMeta("title");

  const ogDescription =
    profileName && scores
      ? t("share.ogDescriptionWithScores", {
          name: profileName,
          year: targetYear,
          wealth: scores.wealth,
          career: scores.career,
          relationship: scores.relationship,
          health: scores.health,
        })
      : profileName
        ? t("share.ogDescription", { name: profileName, year: targetYear })
        : tMeta("description");

  const pageUrl = `${SITE_URL}/fortune/${edition}/share/${profileId}`;

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
};
