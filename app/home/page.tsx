"use client";

import { useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";

import { HeaderClient } from "@/components/landing";
import {
  CompatibilityFortuneCard,
  FriendUniverseCard,
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
  const locale = useLocale();
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

  const handleFriendUniverse = useCallback(() => {
    router.push("/universe/create");
  }, [router]);

  if (authStatus === "loading" || authStatus === "unauthenticated") {
    return null;
  }

  return (
    <div className={styles.page}>
      <HeaderClient />
      <main className={styles.main}>
        {/*
          친구 우주 궁합은 한줄평/등급 라벨 EN/JA 번역이 Phase 2라
          KO 로케일에서만 노출한다. 링크 직접 진입(/universe/{publicId})은
          로케일과 무관하게 항상 동작한다 — 막으면 바이럴 루프가 끊긴다.
        */}
        {locale === "ko" && (
          <FriendUniverseCard onClick={handleFriendUniverse} />
        )}
        <LifetimeFortuneCard onClick={handleLifetimeFortune} />
        <NextYearFortuneCard onClick={handleNextYearFortune} />
        <YearlyFortuneCard onClick={handleYearlyFortune} />
        <CompatibilityFortuneCard onClick={handleCompatibilityFortune} />
      </main>
    </div>
  );
}
