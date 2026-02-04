"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";

import {
  useProfileById,
  useIsProfilesLoaded,
  useProfileActions,
} from "@/libs/stores/profile";
import { useAuthStatus } from "@/libs/stores/user";

import type { ProfileData, YearlyPreviewResult } from "./types";

interface UseYearlyPreviewOptions {
  onProfileNotFound?: () => string;
  onFetchError?: () => string;
  onUnknownError?: () => string;
  onAIGenerationFailed?: () => string;
}

interface UseYearlyPreviewReturn {
  isLoading: boolean;
  error: string | null;
  result: YearlyPreviewResult | null;
  profile: ProfileData | null;
  profileId: string;
  currentYear: number;
  /** AI 해석 성공 여부 (false면 결제 불가) */
  isAIGenerated: boolean;
  handlePayment: () => void;
  handleBack: () => void;
}

export const useYearlyPreview = (
  options: UseYearlyPreviewOptions = {}
): UseYearlyPreviewReturn => {
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
  const [result, setResult] = useState<YearlyPreviewResult | null>(null);
  const [isAIGenerated, setIsAIGenerated] = useState(false);

  // Memoize currentYear to prevent recalculation on every render
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // Use refs to avoid unnecessary re-renders and race conditions
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const localeRef = useRef(locale);
  localeRef.current = locale;

  const cachedProfileRef = useRef(cachedProfile);
  cachedProfileRef.current = cachedProfile;

  // Prevent duplicate fetch
  const hasFetchedRef = useRef(false);

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

    const fetchPreviewData = async () => {
      try {
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
            language: localeRef.current,
          }),
        });

        if (!res.ok) {
          throw new Error(
            optionsRef.current.onFetchError?.() ??
              "올해 운세 조회에 실패했습니다."
          );
        }

        const fortuneData = await res.json();
        setResult(fortuneData.data);
        setIsAIGenerated(fortuneData.isAIGenerated ?? false);

        // AI 생성 실패 시 에러 표시
        if (!fortuneData.isAIGenerated) {
          setError(
            optionsRef.current.onAIGenerationFailed?.() ??
              "운세 생성에 실패했습니다. 잠시 후 다시 시도해주세요."
          );
        }
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

    fetchPreviewData();
  }, [authStatus, profileId, router, isProfilesLoaded, currentYear]);

  const handlePayment = useCallback(() => {
    // AI 생성 실패 시 결제 페이지로 이동하지 않음
    if (!isAIGenerated) {
      return;
    }
    router.push(`/payment/yearly/${profileId}`);
  }, [router, profileId, isAIGenerated]);

  const handleBack = useCallback(() => {
    router.push("/profiles");
  }, [router]);

  const isActuallyLoading =
    authStatus === "loading" || isLoading || !isProfilesLoaded;

  return {
    isLoading: isActuallyLoading,
    error,
    result,
    profile: cachedProfile ?? null,
    profileId,
    currentYear,
    isAIGenerated,
    handlePayment,
    handleBack,
  };
};
