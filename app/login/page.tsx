"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { createBrowserClient } from "@/libs/supabase/browser";
import type { UserInsert } from "@/libs/supabase/types";

import styles from "./page.module.css";

type SocialProvider = "kakao" | "google";

const TEST_ACCOUNT = {
  email: "test@life-spoiler.com",
  password: "test1234!@#$",
};

export default function LoginPage() {
  const t = useTranslations("login");
  const [isLoading, setIsLoading] = useState(false);

  const handleOAuthLogin = async (provider: SocialProvider) => {
    const supabase = createBrowserClient();

    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleTestLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const supabase = createBrowserClient();

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: TEST_ACCOUNT.email,
          password: TEST_ACCOUNT.password,
        });

      if (authError || !authData.user) {
        console.error("테스트 로그인 실패:", authError?.message);
        alert(
          "테스트 로그인에 실패했습니다. 테스트 계정이 생성되어 있는지 확인해주세요."
        );
        return;
      }

      const { id, email } = authData.user;

      // users 테이블 업데이트 (실패해도 계속 진행 - 트리거로 이미 생성됨)
      try {
        const userData: UserInsert = {
          id,
          email: email ?? TEST_ACCOUNT.email,
          provider: "email",
          provider_id: id,
          last_login_at: new Date().toISOString(),
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("users") as any).upsert(userData, {
          onConflict: "id",
        });
      } catch {
        // 이미 트리거로 생성된 경우 무시
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", id)
        .limit(1);

      if (profiles && profiles.length > 0) {
        window.location.href = "/profiles";
      } else {
        window.location.href = "/profile/setup";
      }
    } catch (error) {
      console.error("테스트 로그인 중 오류:", error);
      alert("테스트 로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
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

          <button
            type="button"
            className={styles.testButton}
            onClick={handleTestLogin}
            disabled={isLoading}
          >
            <span className={styles.buttonText}>
              {isLoading ? "로그인 중..." : "PG 테스트 로그인"}
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
