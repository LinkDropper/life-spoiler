import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import {
  NotFoundScreen,
  errorPageStyles,
} from "@/components/common/error-page";
import { HeaderClient } from "@/components/landing";
import { NOINDEX_METADATA } from "@/libs/seo/metadata";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("errorPage.notFound");
  return { ...NOINDEX_METADATA, title: t("metaTitle") };
};

/** 없는 주소와 notFound() 호출이 모두 이 화면으로 온다 */
export default function NotFound() {
  return (
    <div className={errorPageStyles.page}>
      <HeaderClient />
      <NotFoundScreen />
    </div>
  );
}
