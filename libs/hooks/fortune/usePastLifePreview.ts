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

import type { ProfileData, PastLifePreviewResult } from "./types";

interface UsePastLifePreviewOptions {
  onProfileNotFound?: () => string;
  onFetchError?: () => string;
  onUnknownError?: () => string;
  onAIGenerationFailed?: () => string;
}

interface UsePastLifePreviewReturn {
  isLoading: boolean;
  error: string | null;
  result: PastLifePreviewResult | null;
  profile: ProfileData | null;
  profileId: string;
  /** AI 해석 성공 여부 (false면 결제 불가) */
  isAIGenerated: boolean;
  handlePayment: () => void;
  handleBack: () => void;
}

export const usePastLifePreview = (
  options: UsePastLifePreviewOptions = {}
): UsePastLifePreviewReturn => {
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
  const [result, setResult] = useState<PastLifePreviewResult | null>(null);
  const [isAIGenerated, setIsAIGenerated] = useState(false);

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

    // 이미 결제한 경우 API 호출 없이 바로 결과 페이지로 리다이렉트
    const hasPaid = targetProfile.fortunes?.some(
      (f) => f.fortune_type === "past_life" && f.paid_at !== null
    );
    if (hasPaid) {
      router.replace(`/fortune/past-life/${profileId}`);
      return;
    }

    // Prevent duplicate fetch for the same profile
    if (hasFetchedRef.current) {
      return;
    }
    hasFetchedRef.current = true;

    const fetchPreviewData = async () => {
      try {
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
              "전생 운세 생성에 실패했습니다."
          );
        }

        const fortuneData = await interpretRes.json();

        // 이미 결제한 경우 결과 페이지로 리다이렉트
        if (fortuneData.isPaid) {
          router.replace(`/fortune/past-life/${profileId}`);
          return;
        }

        setResult(fortuneData.data);
        setIsAIGenerated(fortuneData.isAIGenerated ?? false);

        // AI 생성 실패 시 에러 표시
        if (!fortuneData.isAIGenerated) {
          setError(
            optionsRef.current.onAIGenerationFailed?.() ??
              "전생 운세 생성에 실패했습니다."
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
  }, [authStatus, profileId, router, isProfilesLoaded]);

  const handlePayment = useCallback(() => {
    if (!isAIGenerated) {
      return;
    }
    router.push(`/payment/past_life/${profileId}`);
  }, [router, profileId, isAIGenerated]);

  const handleBack = useCallback(() => {
    router.push("/profiles?type=past-life");
  }, [router]);

  const isActuallyLoading =
    authStatus === "loading" || isLoading || !isProfilesLoaded;

  return {
    isLoading: isActuallyLoading,
    error,
    result,
    profile: cachedProfile ?? null,
    profileId,
    isAIGenerated,
    handlePayment,
    handleBack,
  };
};
