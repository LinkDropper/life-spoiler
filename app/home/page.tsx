"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { HomeScreen } from "@/components/home";
import { HeaderClient } from "@/components/landing";
import { useReferral } from "@/libs/hooks/useReferral";
import { useProfileLoadStatus, useProfiles } from "@/libs/stores/profile";
import { useAuthStatus } from "@/libs/stores/user";

import styles from "./page.module.css";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authStatus = useAuthStatus();
  const profiles = useProfiles();
  const profileLoadStatus = useProfileLoadStatus();
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

  if (authStatus === "loading" || authStatus === "unauthenticated") {
    return null;
  }

  return (
    <div className={styles.page}>
      <HeaderClient />
      <main className={styles.main}>
        <HomeScreen
          profiles={profiles}
          isProfilesLoading={
            profileLoadStatus === "idle" || profileLoadStatus === "loading"
          }
        />
      </main>
    </div>
  );
}
