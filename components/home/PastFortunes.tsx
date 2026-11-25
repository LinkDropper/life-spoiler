"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import {
  getFortuneHref,
  hasFortuneAccess,
  type PaidFortuneRouteType,
} from "@/libs/fortune/navigation";
import type { ProfileWithFortunes } from "@/libs/stores/profile";

import { HomeSheet } from "./HomeSheet";
import styles from "./PastFortunes.module.css";

interface PastFortune {
  key: "yearly2026";
  fortune: PaidFortuneRouteType;
  image: string;
}

/** 진열장에서 내린 운세. 새로 팔지 않고, 이미 가진 프로필만 다시 볼 수 있다 */
const PAST_FORTUNES: PastFortune[] = [
  { key: "yearly2026", fortune: "yearly", image: "yearly" },
];

interface PastFortunesProps {
  profile: ProfileWithFortunes | undefined;
}

/**
 * 홈 맨 끝 — 지난 운세로 가는 조용한 한 줄. 누르면 바텀시트에서 다시 본다.
 * 고른 프로필이 가진 지난 운세가 없으면 아무것도 그리지 않는다.
 */
export const PastFortunes = ({ profile }: PastFortunesProps) => {
  const t = useTranslations("home.past");
  const [isOpen, setIsOpen] = useState(false);
  const handleClose = useCallback(() => setIsOpen(false), []);

  if (!profile) return null;

  const ownedFortunes = PAST_FORTUNES.filter(({ fortune }) =>
    hasFortuneAccess(profile, fortune)
  );
  if (ownedFortunes.length === 0) return null;

  return (
    <footer className={styles.end}>
      <div className={styles.rule} aria-hidden="true">
        {t("rule")}
      </div>
      <button
        type="button"
        className={styles.more}
        aria-haspopup="dialog"
        onClick={() => setIsOpen(true)}
      >
        {t("open", { count: ownedFortunes.length })}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>
      <p className={styles.credit}>
        {ownedFortunes.map(({ key }) => t(`${key}.title`)).join(" · ")}
      </p>

      {isOpen && (
        <HomeSheet eyebrow="ARCHIVE" title={t("title")} onClose={handleClose}>
          <ul className={styles.list}>
            {ownedFortunes.map(({ key, fortune, image }) => (
              <li key={key}>
                <Link
                  href={getFortuneHref(profile, fortune)}
                  className={styles.row}
                >
                  <span className={styles.thumb}>
                    <Image
                      src={`/images/home/objects/${image}.png`}
                      alt=""
                      width={76}
                      height={76}
                    />
                  </span>
                  <span className={styles.label}>
                    <span className={styles.name}>{t(`${key}.title`)}</span>
                    <span className={styles.meta}>
                      {t("owner", { name: profile.name })}
                    </span>
                  </span>
                  <span className={styles.go}>
                    {t("rewatch")}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m9 6 6 6-6 6" />
                    </svg>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className={styles.note}>{t("note")}</p>
        </HomeSheet>
      )}
    </footer>
  );
};
