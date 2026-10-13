import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getLocalizedAlternates } from "@/libs/seo/metadata";

import { TermsContent } from "./TermsContent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("policy.terms");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: await getLocalizedAlternates("/policy/terms"),
  };
}

export default function TermsPage() {
  return <TermsContent />;
}
