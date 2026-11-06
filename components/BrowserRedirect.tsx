"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  isKakaoTalkBrowser,
  openWithExternalBrowser,
} from "@/libs/utils/browser";
import styles from "./BrowserRedirect.module.css";

/**
 * 카카오톡 인앱 브라우저 감지 및 외부 브라우저(크롬/사파리)로 리다이렉트.
 * 닫을 수 없는 전체 화면 관문이라 X 버튼이 없다.
 */
export default function BrowserRedirect() {
  const t = useTranslations("browserRedirect");
  const [isKakaoTalk, setIsKakaoTalk] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // 카카오톡 브라우저인지 확인
    if (isKakaoTalkBrowser()) {
      setIsKakaoTalk(true);
      setIsRedirecting(true);

      // 즉시 외부 브라우저로 리다이렉트 시도
      openWithExternalBrowser();

      // 3초 후에도 리다이렉트되지 않았다면, 수동 버튼을 표시합니다.
      const redirectTimer = setTimeout(() => {
        setIsRedirecting(false);
      }, 3000);

      return () => clearTimeout(redirectTimer);
    }
  }, []);

  // 수동 버튼이 나타나면 바로 누를 수 있게 포커스
  useEffect(() => {
    if (isKakaoTalk && !isRedirecting) {
      openButtonRef.current?.focus();
    }
  }, [isKakaoTalk, isRedirecting]);

  if (!isKakaoTalk) {
    return null;
  }

  return (
    <div
      className={styles.gate}
      role="dialog"
      aria-modal="true"
      aria-labelledby="browser-redirect-title"
      aria-describedby="browser-redirect-description"
      aria-busy={isRedirecting}
    >
      <div className={styles.content}>
        <p className={styles.eyebrow} aria-hidden="true">
          OPEN IN BROWSER
        </p>

        <h1 id="browser-redirect-title" className={styles.title}>
          {isRedirecting ? t("redirecting") : t("openExternal")}
        </h1>

        <p id="browser-redirect-description" className={styles.description}>
          {t("description")}
          <strong>{t("chromeOrSafari")}</strong>
        </p>

        {isRedirecting ? (
          <p className={styles.status} role="status">
            {t("redirectingStatus")}
          </p>
        ) : (
          <button
            ref={openButtonRef}
            type="button"
            className={styles.button}
            onClick={() => {
              setIsRedirecting(true);
              openWithExternalBrowser();
            }}
          >
            {t("openButton")}
          </button>
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
