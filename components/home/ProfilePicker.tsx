"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { formatBirthDate } from "./format";
import styles from "./ProfilePicker.module.css";

import type { ProfileWithFortunes } from "@/libs/stores/profile";

interface ProfilePickerProps {
  profile: ProfileWithFortunes | undefined;
  isOpen: boolean;
  onOpen: () => void;
}

/**
 * 홈 — 헤더 바로 아래 "○○님의 스포일러" 트리거.
 * 아래 오늘의 운세·진열장이 모두 이 프로필 기준이라는 걸 위치로 읽힌다.
 * 프로필이 1개여도 펼쳐야 "프로필 추가"에 닿으므로 화살표를 늘 둔다.
 * 프로필이 없으면 같은 자리에 프로필 만들기 한 줄을 둔다.
 */
export const ProfilePicker = ({
  profile,
  isOpen,
  onOpen,
}: ProfilePickerProps) => {
  const t = useTranslations("home.picker");

  if (!profile) {
    return (
      <div className={styles.start}>
        <div className={styles.text}>
          <p className={styles.startTitle}>{t("emptyTitle")}</p>
          <p className={styles.startDescription}>{t("emptyDescription")}</p>
        </div>
        <Link href="/profile/setup" className={styles.startButton}>
          {t("emptyButton")}
        </Link>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={styles.trigger}
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-label={t("triggerLabel", { name: profile.name })}
    >
      <span className={styles.who}>
        {/* 긴 이름은 이름 부분만 말줄임된다 (문구 위치는 언어마다 다름) */}
        <span className={styles.title}>
          {t.rich("title", {
            profileName: profile.name,
            name: (chunks) => <span className={styles.name}>{chunks}</span>,
          })}
        </span>
        <span className={styles.birth}>
          {formatBirthDate(profile.birth_date)}
        </span>
      </span>
      <span className={styles.chevron} aria-hidden="true">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </button>
  );
};
