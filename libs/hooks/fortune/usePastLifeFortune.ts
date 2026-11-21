"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";

import {
  useProfileById,
  useIsProfilesLoaded,
  useProfileActions,
} from "@/libs/stores/profile";
import { useAuthStatus, useUser } from "@/libs/stores/user";

import type { ProfileData, PastLifeFortuneResult } from "./types";

interface UsePastLifeFortuneOptions {
  onProfileNotFound?: () => string;
  onFetchError?: () => string;
  onUnknownError?: () => string;
}

interface UsePastLifeFortuneReturn {
  isLoading: boolean;
  error: string | null;
  result: PastLifeFortuneResult | null;
  profile: ProfileData | null;
  profileId: string;
  showCopyToast: boolean;
  handleShare: () => Promise<void>;
}

export const usePastLifeFortune = (
  options: UsePastLifeFortuneOptions = {}
): UsePastLifeFortuneReturn => {
  const params = useParams();
  const router = useRouter();
  const authStatus = useAuthStatus();
  const user = useUser();
  const locale = useLocale();
  const profileId = params.profileId as string;

  const cachedProfile = useProfileById(profileId);
  const isProfilesLoaded = useIsProfilesLoaded();
  const { fetchProfiles } = useProfileActions();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PastLifeFortuneResult | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);

  // Use refs to avoid unnecessary re-renders and race conditions
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const localeRef = useRef(locale);
  localeRef.current = locale;

  const cachedProfileRef = useRef(cachedProfile);
  cachedProfileRef.current = cachedProfile;

  // Timer ref for cleanup
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Prevent duplicate fetch
  const hasFetchedRef = useRef(false);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Fetch profiles when authenticated
  useEffect(() => {
    if (authStatus === "authenticated" && !isProfilesLoaded) {
      fetchProfiles();
    }
  }, [authStatus, isProfilesLoaded, fetchProfiles]);

  // Main data fetching effect
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (authStatus !== "authenticated") {
      return;
    }

    if (!isProfilesLoaded) {
      return;
    }

    const targetProfile = cachedProfileRef.current;

    if (!targetProfile) {
      setError(
        optionsRef.current.onProfileNotFound?.() ?? "프로필을 찾을 수 없습니다."
      );
      setIsLoading(false);
      return;
    }

    // Prevent duplicate fetch for the same profile
    if (hasFetchedRef.current) {
      return;
    }
    hasFetchedRef.current = true;

    const fetchFortuneData = async () => {
      try {
        // 결제 상태 확인
        const paymentStatusRes = await fetch(
          `/api/fortune/${profileId}/payment-status?type=past_life`
        );

        if (!paymentStatusRes.ok) {
          router.replace(`/fortune/past-life/preview/${profileId}`);
          return;
        }

        const paymentStatus = await paymentStatusRes.json();

        if (!paymentStatus.data?.paid) {
          router.replace(`/fortune/past-life/preview/${profileId}`);
          return;
        }

        const interpretRes = await fetch("/api/interpret/past-life", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: targetProfile.name,
            birthDate: targetProfile.birth_date,
            birthTime: targetProfile.birth_time_unknown
              ? "unknown"
              : targetProfile.birth_time?.slice(0, 5) || "unknown",
            gender: targetProfile.gender,
            calendarType: targetProfile.calendar_type,
            ...(targetProfile.relationship_status && {
              relationshipStatus: targetProfile.relationship_status,
            }),
            ...(targetProfile.relationship_status_custom && {
              relationshipStatusCustom:
                targetProfile.relationship_status_custom,
            }),
            ...(targetProfile.occupation_status && {
              occupationStatus: targetProfile.occupation_status,
            }),
            ...(targetProfile.occupation_status_custom && {
              occupationStatusCustom: targetProfile.occupation_status_custom,
            }),
            profileId: targetProfile.id,
            language: localeRef.current,
          }),
        });

        if (!interpretRes.ok) {
          throw new Error(
            optionsRef.current.onFetchError?.() ??
              "전생 운세 조회에 실패했습니다."
          );
        }

        const fortuneData = await interpretRes.json();
        setResult(fortuneData.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : (optionsRef.current.onUnknownError?.() ??
                "알 수 없는 오류가 발생했습니다.")
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchFortuneData();
  }, [authStatus, profileId, router, isProfilesLoaded]);

  const handleShare = useCallback(async () => {
    const shareUrl = `${window.location.origin}/fortune/past-life/share/${profileId}?ref=${user?.id ?? ""}`;

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowCopyToast(true);
      toastTimerRef.current = setTimeout(() => setShowCopyToast(false), 2000);
    } catch {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setShowCopyToast(true);
        toastTimerRef.current = setTimeout(() => setShowCopyToast(false), 2000);
      } catch {
        alert(
          `링크 복사에 실패했습니다. 다음 주소를 직접 복사해주세요: ${shareUrl}`
        );
      }
    }
  }, [profileId, user]);

  const isActuallyLoading =
    authStatus === "loading" || isLoading || !isProfilesLoaded;

  return {
    isLoading: isActuallyLoading,
    error,
    result,
    profile: cachedProfile ?? null,
    profileId,
    showCopyToast,
    handleShare,
  };
};
