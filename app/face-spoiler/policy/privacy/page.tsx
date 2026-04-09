import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PrivacyContent } from "./PrivacyContent";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("faceSpoiler.policy.privacy");
  return {
    title: t("metaTitle", { default: "개인정보 처리방침 - 관상스포" }),
    description: t("metaDescription", {
      default: "관상스포 개인정보 처리방침",
    }),
  };
};

export default function FaceSpoilerPrivacyPage() {
  return <PrivacyContent />;
}
