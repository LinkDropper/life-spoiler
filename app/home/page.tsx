"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { HeaderClient } from "@/components/landing";
import {
  ProfilePicker,
  ProfileSheet,
  SpoilerShelf,
  TodayFortuneBanner,
  UniverseBanner,
} from "@/components/home";
import { trackDailyEvent } from "@/libs/analytics";
import { getFortuneHref, getProfileSetupHref } from "@/libs/fortune/navigation";
import { useReferral } from "@/libs/hooks/useReferral";
import {
  useProfileActions,
  useProfileLoadStatus,
  useProfiles,
  useSelectedProfile,
} from "@/libs/stores/profile";
import { useAuthStatus, useUser } from "@/libs/stores/user";

import styles from "./page.module.css";

// 임시: 특정 유저는 프로필 추가/삭제 버튼 숨김 (전환만 가능)
const RESTRICTED_USER_ID = "97f9d7a9-23f2-4fd8-98cf-ac52aa4fe059";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authStatus = useAuthStatus();
  const locale = useLocale();
  const t = useTranslations("home");
  const isKo = locale === "ko";
  const { claimReferralReward } = useReferral();
  const user = useUser();
  const profiles = useProfiles();
  const profileLoadStatus = useProfileLoadStatus();
  const selectedProfile = useSelectedProfile();
  const { fetchProfiles, selectProfile } = useProfileActions();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
    }
  }, [authStatus, router]);

  // 결제·프로필 생성 뒤 돌아오면 결제 표시(진열장 조명)가 바뀌어 있어야 한다
  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchProfiles(true);
    }
  }, [authStatus, fetchProfiles]);

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

  const handleSheetOpen = useCallback(() => setIsSheetOpen(true), []);
  const handleSheetClose = useCallback(() => setIsSheetOpen(false), []);

  // 프로필 목록이 처음 오기 전에 0개 상태를 잠깐 보여주지 않도록 함께 기다린다.
  // 이미 받은 목록이 있으면 다시 받는 동안에도 화면을 유지한다
  const isFirstProfileLoad =
    profileLoadStatus === "idle" ||
    (profileLoadStatus === "loading" && profiles.length === 0);

  if (
    authStatus === "loading" ||
    authStatus === "unauthenticated" ||
    isFirstProfileLoad
  ) {
    return null;
  }

  return (
    <div className={styles.page}>
      <HeaderClient />
      <main className={styles.main}>
        {/* 목록을 못 불러왔으면 "프로필을 만들어요"로 잘못 안내하지 않도록 숨긴다 */}
        {profileLoadStatus !== "error" && (
          <ProfilePicker
            profile={selectedProfile}
            isOpen={isSheetOpen}
            onOpen={handleSheetOpen}
          />
        )}
        {/* 오늘의 운세는 문구 사전이 KO뿐이라 KO 로케일에서만 진입점을 노출한다 */}
        {isKo && (
          <TodayFortuneBanner
            href={
              selectedProfile
                ? getFortuneHref(selectedProfile, "daily")
                : getProfileSetupHref("daily")
            }
            onClick={handleDailyFortune}
          />
        )}
        <h1 className={styles.heading}>
          {t(isKo ? "shelf.titleWithToday" : "shelf.title")}
        </h1>
        <SpoilerShelf profile={selectedProfile} />
        {/*
          친구 우주 궁합은 한줄평/등급 라벨 EN/JA 번역이 Phase 2라
          KO 로케일에서만 노출한다. 링크 직접 진입(/universe/{publicId})은
          로케일과 무관하게 항상 동작한다 — 막으면 바이럴 루프가 끊긴다.
        */}
        {isKo && <UniverseBanner href="/universe/create" />}
      </main>
      <ProfileSheet
        isOpen={isSheetOpen}
        profiles={profiles}
        selectedProfileId={selectedProfile?.id}
        canEdit={user?.id !== RESTRICTED_USER_ID}
        onSelect={selectProfile}
        onClose={handleSheetClose}
      />
    </div>
  );
}
