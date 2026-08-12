"use client";

import { useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { HeaderClient } from "@/components/landing";
import {
  CompatibilityFortuneCard,
  LifetimeFortuneCard,
  NextYearFortuneCard,
  YearlyFortuneCard,
} from "@/components/home";
import { useReferral } from "@/libs/hooks/useReferral";
import { useAuthStatus } from "@/libs/stores/user";

import styles from "./page.module.css";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authStatus = useAuthStatus();
  const { claimReferralReward } = useReferral();

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
    }
  }, [authStatus, router]);

  // 레퍼럴 보상 트리거
  useEffect(() => {
    if (authStatus !== "authenticated") return;

    const isNewUser = searchParams.get("new") === "1";
    if (!isNewUser) return;

    // ?new=1 파라미터 제거 (히스토리 정리)
    const url = new URL(window.location.href);
    url.searchParams.delete("new");
    window.history.replaceState({}, "", url.toString());

    // 레퍼럴 보상 처리 (비동기, fire-and-forget)
    claimReferralReward();
  }, [authStatus, searchParams, claimReferralReward]);

  const handleLifetimeFortune = useCallback(() => {
    router.push("/profiles?type=lifetime");
  }, [router]);

  const handleNextYearFortune = useCallback(() => {
    router.push("/profiles?type=yearly_2027");
  }, [router]);

  const handleYearlyFortune = useCallback(() => {
    router.push("/profiles?type=yearly");
  }, [router]);

  const handleCompatibilityFortune = useCallback(() => {
    router.push("/compatibility");
  }, [router]);

  if (authStatus === "loading" || authStatus === "unauthenticated") {
    return null;
  }

  return (
    <div className={styles.page}>
      <HeaderClient />
      <main className={styles.main}>
        <LifetimeFortuneCard onClick={handleLifetimeFortune} />
        <NextYearFortuneCard onClick={handleNextYearFortune} />
        <YearlyFortuneCard onClick={handleYearlyFortune} />
        <CompatibilityFortuneCard onClick={handleCompatibilityFortune} />
      </main>
    </div>
  );
}
