"use client";

import { useTranslations } from "next-intl";

import styles from "./ErrorState.module.css";

interface ErrorStateProps {
  /** 무엇이 안 됐는지 한 줄 (훅이 준 오류 문구) */
  message: string;
  buttonText: string;
  onButtonClick: () => void;
}

/**
 * 운세·공유 페이지 오류 = 상영 중단(INTERMISSION).
 * 이유 한 줄 + 갈 곳(내 예고편 · 프로필 목록) + 다시 불러오기.
 */
export const ErrorState = ({
  message,
  buttonText,
  onButtonClick,
}: ErrorStateProps) => {
  const t = useTranslations("fortune.screen.error");

  return (
    <div className={styles.error} role="alert">
      <div className={styles.screen}>
        <span className={styles.code}>INTERMISSION</span>
        <b className={styles.title}>{t("intermission")}</b>
      </div>
      <p className={styles.message}>{message}</p>
      <div className={styles.buttons}>
        <button
          type="button"
          className={styles.primary}
          onClick={onButtonClick}
        >
          {buttonText}
        </button>
        <button
          type="button"
          className={styles.ghost}
          onClick={() => window.location.reload()}
        >
          {t("refresh")}
        </button>
      </div>
    </div>
  );
};
