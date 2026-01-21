"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";

import {
  useProfileById,
  useIsProfilesLoaded,
  useProfileActions,
} from "@/libs/stores/profile";
import { useAuthStatus } from "@/libs/stores/user";

import type { ProfileData, YearlyFortuneResult } from "./types";

interface UseYearlyFortuneOptions {
  onProfileNotFound?: () => string;
  onFetchError?: () => string;
  onUnknownError?: () => string;
}

interface UseYearlyFortuneReturn {
  isLoading: boolean;
  error: string | null;
  result: YearlyFortuneResult | null;
  profile: ProfileData | null;
  profileId: string;
  currentYear: number;
  showCopyToast: boolean;
  handleShare: () => Promise<void>;
}

export const useYearlyFortune = (
  options: UseYearlyFortuneOptions = {}
): UseYearlyFortuneReturn => {
  const params = useParams();
  const router = useRouter();
  const authStatus = useAuthStatus();
  const locale = useLocale();
  const profileId = params.profileId as string;

  const cachedProfile = useProfileById(profileId);
  const isProfilesLoaded = useIsProfilesLoaded();
  const { fetchProfiles } = useProfileActions();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<YearlyFortuneResult | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);

  const currentYear = new Date().getFullYear();

  // Use ref to avoid infinite loop from options object
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Fetch profiles when authenticated
  useEffect(() => {
    if (authStatus === "authenticated" && !isProfilesLoaded) {
      fetchProfiles();
    }
  }, [authStatus, isProfilesLoaded, fetchProfiles]);

  // Sync cached profile to local state
  useEffect(() => {
    if (cachedProfile) {
      setProfile(cachedProfile);
    }
  }, [cachedProfile]);

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

    if (!cachedProfile) {
      setError(
        optionsRef.current.onProfileNotFound?.() ?? "프로필을 찾을 수 없습니다."
      );
      setIsLoading(false);
      return;
    }

    const fetchYearlyFortune = async () => {
      try {
        const targetProfile = cachedProfile;

        const res = await fetch("/api/interpret/yearly", {
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
            targetYear: currentYear,
            profileId: targetProfile.id,
            language: locale,
          }),
        });

        if (!res.ok) {
          throw new Error(
            optionsRef.current.onFetchError?.() ??
              "올해 운세 조회에 실패했습니다."
          );
        }

        const data = await res.json();
        setResult(data.data);
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

    fetchYearlyFortune();
  }, [
    authStatus,
    profileId,
    router,
    isProfilesLoaded,
    cachedProfile,
    currentYear,
    locale,
  ]);

  const handleShare = useCallback(async () => {
    const shareUrl = `${window.location.origin}/fortune/yearly/share/${profileId}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 2000);
    } catch {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setShowCopyToast(true);
        setTimeout(() => setShowCopyToast(false), 2000);
      } catch {
        alert(
          `링크 복사에 실패했습니다. 다음 주소를 직접 복사해주세요: ${shareUrl}`
        );
      }
    }
  }, [profileId]);

  const isActuallyLoading =
    authStatus === "loading" || isLoading || !isProfilesLoaded;

  return {
    isLoading: isActuallyLoading,
    error,
    result,
    profile,
    profileId,
    currentYear,
    showCopyToast,
    handleShare,
  };
};
