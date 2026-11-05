import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/config";
import { SITE_NAME, SITE_URL } from "@/libs/seo/site";
import { createServerClient } from "@/libs/supabase/client";
import type { Database, FortuneRow, ProfileRow } from "@/libs/supabase/types";
import { getOpenGraphImage } from "@/libs/utils/og";
import { removeEmoji } from "@/libs/utils/text";
import type { SupabaseClient } from "@supabase/supabase-js";

type SupabaseDB = SupabaseClient<Database>;

interface PastLifeResultJson {
  interpretation?: {
    spoiler?: { headline?: string; description?: string };
  };
}

/** 전생 공유 페이지 OG (기획서 §12: 공유 링크가 404였던 경로를 새로 만든다) */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ profileId: string }>;
}): Promise<Metadata> {
  const { profileId } = await params;
  const locale = await getLocale();
  const ogImage = getOpenGraphImage(locale);
  const t = await getTranslations("fortune.screen.pastLife.share");
  const tMeta = await getTranslations("metadata");

  let profileName = "";
  let headline = "";
  let description = "";

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
      .eq("fortune_type", "past_life")
      .single<Pick<FortuneRow, "result">>();
    const spoiler = (fortune?.result as PastLifeResultJson | undefined)
      ?.interpretation?.spoiler;
    headline = spoiler?.headline ? removeEmoji(spoiler.headline) : "";
    description = spoiler?.description ? removeEmoji(spoiler.description) : "";
  } catch {
    // fallback to default metadata
  }

  const ogTitle =
    profileName && headline
      ? t("ogTitleWithHeadline", { name: profileName, headline })
      : profileName
        ? t("ogTitle", { name: profileName })
        : tMeta("title");
  const ogDescription =
    description ||
    (profileName
      ? t("ogDescription", { name: profileName })
      : tMeta("description"));
  const pageUrl = `${SITE_URL}/fortune/past-life/share/${profileId}`;

  return {
    title: ogTitle,
    description: ogDescription,
    openGraph: {
      type: "website",
      locale: locale === "ko" ? "ko_KR" : locale === "ja" ? "ja_JP" : "en_US",
      url: pageUrl,
      siteName: SITE_NAME[locale as Locale] ?? SITE_NAME.ko,
      title: ogTitle,
      description: ogDescription,
      images: [{ url: ogImage, width: 1200, height: 600, alt: ogTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
  };
}

export default function PastLifeShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
