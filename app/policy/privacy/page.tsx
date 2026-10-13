import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getLocalizedAlternates } from "@/libs/seo/metadata";

import { PrivacyContent } from "./PrivacyContent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("policy.privacy");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: await getLocalizedAlternates("/policy/privacy"),
  };
}

export default function PrivacyPage() {
  return <PrivacyContent />;
}
