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

import type { ProfileData, LifetimeFortuneResult } from "./types";

interface UseLifetimeFortuneOptions {
  onProfileNotFound?: () => string;
  onFetchError?: () => string;
  onUnknownError?: () => string;
}

interface UseLifetimeFortuneReturn {
  isLoading: boolean;
  error: string | null;
  result: LifetimeFortuneResult | null;
  profile: ProfileData | null;
  profileId: string;
  showCopyToast: boolean;
  handleShare: () => Promise<void>;
}

export const useLifetimeFortune = (
  options: UseLifetimeFortuneOptions = {}
): UseLifetimeFortuneReturn => {
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
  const [result, setResult] = useState<LifetimeFortuneResult | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);

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

    const fetchFortuneData = async () => {
      try {
        // 결제 상태 확인
        const paymentStatusRes = await fetch(
          `/api/fortune/${profileId}/payment-status?type=lifetime`
        );

        if (paymentStatusRes.ok) {
          const paymentStatus = await paymentStatusRes.json();

          // 결제 정보가 없으면 preview로 리다이렉트
          if (!paymentStatus.data?.paid) {
            router.replace(`/fortune/lifetime/preview/${profileId}`);
            return;
          }
        }

        const targetProfile = cachedProfile;

        const interpretRes = await fetch("/api/interpret", {
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
            includeDetails: true,
            profileId: targetProfile.id,
            language: locale,
          }),
        });

        if (!interpretRes.ok) {
          throw new Error(
            optionsRef.current.onFetchError?.() ?? "운세 해석에 실패했습니다."
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
  }, [authStatus, profileId, router, isProfilesLoaded, cachedProfile, locale]);

  const handleShare = useCallback(async () => {
    const shareUrl = `${window.location.origin}/fortune/lifetime/share/${profileId}`;

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
    showCopyToast,
    handleShare,
  };
};
