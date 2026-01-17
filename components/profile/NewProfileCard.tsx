"use client";

import { useTranslations } from "next-intl";

import styles from "./NewProfileCard.module.css";

interface NewProfileCardProps {
  onClick: () => void;
}

export const NewProfileCard = ({ onClick }: NewProfileCardProps) => {
  const t = useTranslations("profiles");

  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9 3.75V14.25"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3.75 9H14.25"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={styles.label}>
        {t("newProfile", { default: "새 프로필 만들기" })}
      </span>
    </button>
  );
};
