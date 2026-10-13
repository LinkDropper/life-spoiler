import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getLocalizedAlternates } from "@/libs/seo/metadata";

import { PrivacyContent } from "./PrivacyContent";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("faceSpoiler.policy.privacy");
  return {
    title: t("metaTitle", { default: "개인정보 처리방침 - 관상스포" }),
    description: t("metaDescription", {
      default: "관상스포 개인정보 처리방침",
    }),
    alternates: await getLocalizedAlternates("/face-spoiler/policy/privacy"),
  };
};

export default function FaceSpoilerPrivacyPage() {
  return <PrivacyContent />;
}
