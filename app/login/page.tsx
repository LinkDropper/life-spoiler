"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { peekLandingBirthDraft } from "@/libs/landing/birth-draft";
import type { LandingBirthDraft } from "@/libs/landing/birth-draft";
import { createBrowserClient } from "@/libs/supabase/browser";

import { SeatMap } from "./SeatMap";
import styles from "./page.module.css";

type SocialProvider = "kakao" | "google";

/** 생시(HH:mm)를 로케일 시각 표기로 (ko "오후 9:30") */
const formatBirthTime = (time: string, locale: string): string => {
  const [hour, minute] = time.split(":").map(Number);
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2000, 0, 1, hour, minute)));
};

/**
 * 로그인 = 상영관에 내 자리 잡기.
 * 로그인하면 본 운세·쿠폰이 남는다는 이유를 먼저 보여 주고,
 * 랜딩에서 그린 명반이 이 기기에 남아 있으면 이어서 볼 수 있다고 알린다.
 * OAuth 실패로 `?error=`와 함께 돌아오면 다시 시도하라는 안내를 띄운다.
 */
export default function LoginPage() {
  const t = useTranslations("login");
  const tCard = useTranslations("profiles.card");
  const locale = useLocale();
  const [draft, setDraft] = useState<LandingBirthDraft | null>(null);
  const [hasError, setHasError] = useState(false);

  // 저장소·주소창은 브라우저에서만 읽을 수 있어 마운트 뒤에 확인한다
  useEffect(() => {
    setDraft(peekLandingBirthDraft());
    setHasError(new URLSearchParams(window.location.search).has("error"));
  }, []);

  const handleOAuthLogin = async (provider: SocialProvider) => {
    const supabase = createBrowserClient();

    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const draftSummary = draft
    ? [
        draft.birthDate.replaceAll("-", "."),
        draft.birthTimeUnknown || !draft.birthTime
          ? tCard("timeUnknown")
          : formatBirthTime(draft.birthTime, locale),
        draft.gender === "male" ? tCard("male") : tCard("female"),
        draft.calendarType === "solar" ? tCard("solar") : tCard("lunar"),
      ].join(" · ")
    : null;

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <Image
          src="/images/landing/logo.png"
          alt={t("logoAlt")}
          width={87}
          height={32}
          priority
          quality={100}
        />
        <Link
          href="/"
          className={styles.close}
          aria-label={t("closeAriaLabel")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </Link>
      </header>

      <main className={styles.main}>
        <SeatMap />

        <div className={styles.copy}>
          <h1 className={styles.title}>
            <span>{t("titleLine1")}</span>
            <span>{t("titleLine2")}</span>
          </h1>
          <p className={styles.description}>{t("description")}</p>
        </div>

        {hasError ? (
          <div className={styles.notice} role="alert">
            <p className={styles.noticeTitle}>{t("errorTitle")}</p>
            <p className={styles.noticeBody}>{t("errorBody")}</p>
          </div>
        ) : (
          draftSummary && (
            <div className={styles.notice}>
              <p className={styles.noticeTitle}>
                <span className={styles.noticeDot} aria-hidden="true" />
                {t("draftTitle")}
              </p>
              <p className={styles.draftSummary}>{draftSummary}</p>
              <p className={styles.noticeBody}>{t("draftBody")}</p>
            </div>
          )
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.kakaoButton}
            onClick={() => handleOAuthLogin("kakao")}
          >
            <Image src="/icons/kakao-icon.svg" alt="" width={20} height={18} />
            {t("kakaoButton")}
          </button>

          <button
            type="button"
            className={styles.googleButton}
            onClick={() => handleOAuthLogin("google")}
          >
            <Image src="/icons/google-icon.svg" alt="" width={18} height={18} />
            {t("googleButton")}
          </button>

          <p className={styles.agreement}>
            {t.rich("agreement", {
              terms: (chunks) => <Link href="/policy/terms">{chunks}</Link>,
              privacy: (chunks) => <Link href="/policy/privacy">{chunks}</Link>,
            })}
          </p>
        </div>
      </main>
    </div>
  );
}
