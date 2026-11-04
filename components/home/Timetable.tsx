"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { getFortuneHref, getTimetableKeys } from "@/libs/home/home-profile";

import styles from "./Timetable.module.css";

import type { HomeCtaPosition, HomeCtaTarget } from "@/libs/analytics";
import type { HomeFortuneKey } from "@/libs/home/home-profile";
import type { ProfileWithFortunes } from "@/libs/stores/profile/types";

interface TimetableProps {
  profile: ProfileWithFortunes | null;
  /** 다음 상영작(관람권)에 이미 건 운세 — 시간표에서 뺀다 */
  nextKey: HomeFortuneKey | null;
  onClick: (position: HomeCtaPosition, target: HomeCtaTarget) => void;
}

const Chevron = () => (
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
);

/**
 * 상영 시간표 — 랜딩 새벽 장면 "상영 안내"와 같은 줄.
 * 위에서 이미 권한 운세는 빼고, 본 운세는 맨 아래로 내린다(getTimetableKeys).
 * 친구 우주는 한줄평 번역이 KO뿐이라 KO에서만 보인다.
 */
export const Timetable = ({ profile, nextKey, onClick }: TimetableProps) => {
  const t = useTranslations("home");
  const tUniverse = useTranslations("universe.home");
  const locale = useLocale();
  const { open, owned } = getTimetableKeys(profile, nextKey);

  const renderRow = (key: HomeFortuneKey, isOwned: boolean) => (
    <li key={key}>
      <Link
        href={getFortuneHref(profile, key)}
        className={styles.row}
        // 운세 결과로 가는 줄은 ScreeningProvider가 상영관 입장과 함께 이동시킨다
        onClick={() => onClick("timetable", key)}
      >
        <span className={styles.text}>
          <b className={styles.name}>{t(`${key}.title`)}</b>
          <span className={styles.description}>{t(`${key}.subtitle`)}</span>
        </span>
        {isOwned && (
          <span className={styles.owned}>{t("timetable.owned")}</span>
        )}
        <Chevron />
      </Link>
    </li>
  );

  return (
    <section className={styles.section} aria-labelledby="home-timetable-title">
      <h2 id="home-timetable-title" className={styles.heading}>
        {t("timetable.title")}
      </h2>
      <ul className={styles.list}>
        {open.map((key) => renderRow(key, false))}
        {locale === "ko" && (
          <li>
            <Link
              href="/universe/create"
              className={styles.row}
              onClick={() => onClick("timetable", "universe")}
            >
              <span className={styles.text}>
                <b className={styles.name}>{tUniverse("title")}</b>
                <span className={styles.description}>
                  {tUniverse("subtitle")}
                </span>
              </span>
              <span className={styles.free}>{t("timetable.free")}</span>
              <Chevron />
            </Link>
          </li>
        )}
        {owned.map((key) => renderRow(key, true))}
      </ul>
    </section>
  );
};
