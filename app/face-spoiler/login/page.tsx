"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { createBrowserClient } from "@/libs/supabase/browser";

import styles from "./page.module.css";

type SocialProvider = "kakao" | "google";

const REDIRECT_PATH = "/face-spoiler/profiles";

export default function FaceSpoilerLoginPage() {
  const t = useTranslations("login");
  const tFace = useTranslations("faceSpoiler.login");

  const handleOAuthLogin = async (provider: SocialProvider) => {
    const supabase = createBrowserClient();

    const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(REDIRECT_PATH)}`;

    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl,
      },
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.logoWrapper}>
        <span className={styles.logo}>관상스포</span>
        <p className={styles.tagline}>
          {tFace("tagline", {
            default: "사진 한 장으로 보는 나의 관상 리포트",
          })}
        </p>
      </div>

      <div className={styles.buttonGroup}>
        <div className={styles.buttonList}>
          <button
            type="button"
            className={styles.kakaoButton}
            onClick={() => handleOAuthLogin("kakao")}
          >
            <Image src="/icons/kakao-icon.svg" alt="" width={20} height={18} />
            <span className={styles.buttonText}>
              {t("kakaoButton", { default: "카카오로 계속하기" })}
            </span>
          </button>

          <button
            type="button"
            className={styles.googleButton}
            onClick={() => handleOAuthLogin("google")}
          >
            <Image src="/icons/google-icon.svg" alt="" width={18} height={18} />
            <span className={styles.buttonText}>
              {t("googleButton", { default: "Google로 계속하기" })}
            </span>
          </button>

          <p className={styles.agreement}>
            {t.rich("agreement", {
              terms: (chunks) => <Link href="/policy/terms">{chunks}</Link>,
              privacy: (chunks) => <Link href="/policy/privacy">{chunks}</Link>,
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
