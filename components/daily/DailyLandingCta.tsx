"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { trackDailyEvent } from "@/libs/analytics";

import styles from "./DailySharedActions.module.css";

/** `/daily` 랜딩의 로그인 유도 CTA. 비로그인이면 프로필 화면이 로그인으로 보낸다 */
export const DailyLandingCta = () => {
  const t = useTranslations("daily.landing.ui");

  return (
    <Link
      href="/profiles?type=daily"
      className={styles.button}
      onClick={() =>
        trackDailyEvent("daily_entry_click", { source: "landing" })
      }
    >
      {t("ctaButton")}
    </Link>
  );
};
