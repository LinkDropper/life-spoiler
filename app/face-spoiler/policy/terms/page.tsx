import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getLocalizedAlternates } from "@/libs/seo/metadata";

import { TermsContent } from "./TermsContent";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("faceSpoiler.policy.terms");
  return {
    title: t("metaTitle", { default: "이용약관 - 관상스포" }),
    description: t("metaDescription", { default: "관상스포 서비스 이용약관" }),
    alternates: await getLocalizedAlternates("/face-spoiler/policy/terms"),
  };
};

export default function FaceSpoilerTermsPage() {
  return <TermsContent />;
}
