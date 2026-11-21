"use client";

import { useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { HeaderClient } from "@/components/landing";
import {
  SpoilerShelf,
  TodayFortuneBanner,
  UniverseBanner,
} from "@/components/home";
import { trackDailyEvent } from "@/libs/analytics";
import { useReferral } from "@/libs/hooks/useReferral";
import { useAuthStatus } from "@/libs/stores/user";

import styles from "./page.module.css";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authStatus = useAuthStatus();
  const locale = useLocale();
  const t = useTranslations("home");
  const isKo = locale === "ko";
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

  const handleDailyFortune = useCallback(() => {
    trackDailyEvent("daily_entry_click", { source: "home" });
  }, []);

  if (authStatus === "loading" || authStatus === "unauthenticated") {
    return null;
  }

  return (
    <div className={styles.page}>
      <HeaderClient />
      <main className={styles.main}>
        {/* 오늘의 운세는 문구 사전이 KO뿐이라 KO 로케일에서만 진입점을 노출한다 */}
        {isKo && (
          <TodayFortuneBanner
            href="/profiles?type=daily"
            onClick={handleDailyFortune}
          />
        )}
        <h1 className={styles.heading}>
          {t(isKo ? "shelf.titleWithToday" : "shelf.title")}
        </h1>
        <SpoilerShelf />
        {/*
          친구 우주 궁합은 한줄평/등급 라벨 EN/JA 번역이 Phase 2라
          KO 로케일에서만 노출한다. 링크 직접 진입(/universe/{publicId})은
          로케일과 무관하게 항상 동작한다 — 막으면 바이럴 루프가 끊긴다.
        */}
        {isKo && <UniverseBanner href="/universe/create" />}
      </main>
    </div>
  );
}
