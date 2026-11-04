"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import styles from "./TodayCard.module.css";

import type { ProfileWithFortunes } from "@/libs/stores/profile/types";

interface TodayCardProps {
  profile: ProfileWithFortunes;
  onClick: () => void;
}

/**
 * 오늘의 운세 진입 (KO만 — 문구 사전이 KO뿐이라 호출부가 분기한다).
 * 결과 문장은 홈에서 미리 보여 주지 않는다. 오늘의 운세는 산통을 직접 뽑아야
 * 결과가 드러나는 구조라(specs/daily-fortune.md) 미리 보여 주면 그 경험을 망친다.
 */
export const TodayCard = ({ profile, onClick }: TodayCardProps) => {
  const t = useTranslations("home.today");
  const tDaily = useTranslations("daily.home");
  const locale = useLocale();
  const date = new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <Link
      href={`/fortune/daily/${profile.id}`}
      className={styles.card}
      onClick={onClick}
    >
      <span className={styles.text}>
        <b className={styles.title}>{tDaily("title")}</b>
        <span className={styles.description}>{t("description")}</span>
      </span>
      <span className={styles.meta}>
        {t("meta", { date })}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          aria-hidden="true"
          className={styles.chevron}
        >
          <path
            d="M6 3l5 5-5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Link>
  );
};
