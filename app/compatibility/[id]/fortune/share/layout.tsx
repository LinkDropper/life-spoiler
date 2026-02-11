import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { createServerClient } from "@/libs/supabase/client";
import type {
  Database,
  CompatibilityPairRow,
  ProfileRow,
} from "@/libs/supabase/types";
import type { CompatibilityResult } from "@/libs/hooks/compatibility/types";
import { getOpenGraphImage } from "@/libs/utils/og";
import { removeEmoji } from "@/libs/utils/text";
import type { SupabaseClient } from "@supabase/supabase-js";

type SupabaseDB = SupabaseClient<Database>;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://life-spoiler.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: pairId } = await params;
  const locale = await getLocale();
  const ogImage = getOpenGraphImage(locale);
  const t = await getTranslations("compatibility.fortune");
  const tMeta = await getTranslations("metadata");

  let nameA = "";
  let nameB = "";
  let headline = "";
  let score: number | null = null;
  let subScores: {
    communication: number;
    growth: number;
    trust: number;
    crisis: number;
  } | null = null;

  try {
    const supabase = createServerClient() as SupabaseDB;

    const { data: pair } = await supabase
      .from("compatibility_pairs")
      .select("profile_a_id, profile_b_id, score, result")
      .eq("id", pairId)
      .not("paid_at", "is", null)
      .single<
        Pick<
          CompatibilityPairRow,
          "profile_a_id" | "profile_b_id" | "score" | "result"
        >
      >();

    if (pair) {
      ({ score } = pair);

      // 프로필 이름 조회
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", [pair.profile_a_id, pair.profile_b_id])
        .returns<Pick<ProfileRow, "id" | "name">[]>();

      if (profiles) {
        const profileA = profiles.find((p) => p.id === pair.profile_a_id);
        const profileB = profiles.find((p) => p.id === pair.profile_b_id);
        if (profileA) nameA = profileA.name;
        if (profileB) nameB = profileB.name;
      }

      if (pair.result) {
        const result = pair.result as unknown as CompatibilityResult;
        if (result.interpretation?.headline) {
          headline = removeEmoji(result.interpretation.headline);
        }
        if (result.subScores) {
          subScores = {
            communication: result.subScores.communication,
            growth: result.subScores.growthSynergy,
            trust: result.subScores.trustIndex,
            crisis: result.subScores.crisisResilience,
          };
        }
      }
    }
  } catch {
    // fallback to default metadata
  }

  const ogTitle =
    nameA && nameB && headline
      ? t("share.ogTitleWithHeadline", { nameA, nameB, headline })
      : nameA && nameB
        ? t("share.ogTitle", { nameA, nameB })
        : tMeta("title");

  const ogDescription =
    nameA && nameB && score !== null && subScores
      ? t("share.ogDescriptionWithScore", {
          nameA,
          nameB,
          score,
          communication: subScores.communication,
          growth: subScores.growth,
          trust: subScores.trust,
          crisis: subScores.crisis,
        })
      : nameA && nameB
        ? t("share.ogDescription", { nameA, nameB })
        : tMeta("description");

  const pageUrl = `${SITE_URL}/compatibility/${pairId}/fortune/share`;

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

export default function CompatibilityShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
