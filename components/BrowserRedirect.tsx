"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  isKakaoTalkBrowser,
  openWithExternalBrowser,
} from "@/libs/utils/browser";
import styles from "./BrowserRedirect.module.css";

/**
 * 카카오톡 인앱 브라우저 감지 및 외부 브라우저(크롬/사파리)로 리다이렉트
 */
export default function BrowserRedirect() {
  const t = useTranslations("browserRedirect");
  const [isKakaoTalk, setIsKakaoTalk] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // 카카오톡 브라우저인지 확인
    if (isKakaoTalkBrowser()) {
      setIsKakaoTalk(true);
      setIsRedirecting(true);

      // 즉시 외부 브라우저로 리다이렉트 시도
      openWithExternalBrowser();
    }
  }, []);

  if (!isKakaoTalk) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.iconWrapper}>
          <svg
            className={styles.browserIcon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </div>

        <h2 className={styles.title}>
          {isRedirecting ? t("redirecting") : t("openExternal")}
        </h2>

        <p className={styles.description}>
          {t("description")}
          <br />
          <strong>{t("chromeOrSafari")}</strong>
        </p>

        {!isRedirecting && (
          <button
            className={styles.button}
            onClick={() => {
              setIsRedirecting(true);
              openWithExternalBrowser();
            }}
          >
            {t("openButton")}
          </button>
        )}

        {isRedirecting && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>{t("redirectingStatus")}</p>
          </div>
        )}

        <p className={styles.helpText}>
          {t("manualHelp")}
          <br />
          {t("menuInstruction")}
          <br />
          {t("selectBrowser")}
        </p>
      </div>
    </div>
  );
}
