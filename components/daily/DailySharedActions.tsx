"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { trackDailyEvent } from "@/libs/analytics";
import { useReferral } from "@/libs/hooks/useReferral";

import styles from "./DailySharedActions.module.css";

interface DailySharedActionsProps {
  /** 공유자의 ref(검증된 UUID만 서버가 넘긴다). 없으면 null */
  referrerUserId: string | null;
}

/** 공유 수신자 화면의 "내 오늘도 보기" 버튼 + 열람/클릭 계측 */
export const DailySharedActions = ({
  referrerUserId,
}: DailySharedActionsProps) => {
  const t = useTranslations("daily.share");
  const { saveReferrer } = useReferral();

  useEffect(() => {
    trackDailyEvent("daily_shared_link_open");
  }, []);

  useEffect(() => {
    if (referrerUserId) {
      saveReferrer(referrerUserId);
    }
  }, [referrerUserId, saveReferrer]);

  const handleClick = () => {
    trackDailyEvent("daily_shared_cta_click");
    trackDailyEvent("daily_entry_click", { source: "share" });
  };

  return (
    <Link
      href="/profiles?type=daily"
      className={styles.button}
      onClick={handleClick}
    >
      {t("openMine")}
    </Link>
  );
};
