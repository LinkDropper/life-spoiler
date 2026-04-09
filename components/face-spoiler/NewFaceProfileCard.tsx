"use client";

import { useTranslations } from "next-intl";

import styles from "./NewFaceProfileCard.module.css";

interface NewFaceProfileCardProps {
  onClick: () => void;
}

export const NewFaceProfileCard = ({ onClick }: NewFaceProfileCardProps) => {
  const t = useTranslations("faceSpoiler.profiles");

  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <svg
        className={styles.icon}
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 4.16669V15.8334M4.16669 10H15.8334"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={styles.label}>
        {t("newCardLabel", { default: "새 프로필 추가" })}
      </span>
    </button>
  );
};
