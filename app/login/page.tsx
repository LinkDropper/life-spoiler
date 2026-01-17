"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { createBrowserClient } from "@/libs/supabase/browser";

import styles from "./page.module.css";

type OAuthProvider = "kakao" | "google";

export default function LoginPage() {
  const t = useTranslations("login");

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    const supabase = createBrowserClient();

    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.logoWrapper}>
        <Image
          src="/images/logo.png"
          alt={t("logoAlt", { default: "인생스포 로고" })}
          width={240}
          height={89}
          priority
        />
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
        </div>
      </div>
    </div>
  );
}
