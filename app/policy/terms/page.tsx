import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { TermsContent } from "./TermsContent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("policy.terms");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default function TermsPage() {
  return <TermsContent />;
}
