import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PrivacyContent } from "./PrivacyContent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("policy.privacy");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default function PrivacyPage() {
  return <PrivacyContent />;
}
