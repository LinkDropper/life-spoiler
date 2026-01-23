"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import type { ProfileWithFortunes } from "@/libs/stores/profile";

type FortuneType = "lifetime" | "yearly";

interface UseFortuneNavigationProps {
  selectedProfile: ProfileWithFortunes | undefined;
}

interface UseFortuneNavigationReturn {
  hasPaidFortune: (fortuneType: FortuneType) => boolean;
  hasFreeAccess: (fortuneType: FortuneType) => boolean;
  hasAccess: (fortuneType: FortuneType) => boolean;
  navigateToFortune: (fortuneType: FortuneType) => void;
}

export const useFortuneNavigation = ({
  selectedProfile,
}: UseFortuneNavigationProps): UseFortuneNavigationReturn => {
  const router = useRouter();

  const hasPaidFortune = useCallback(
    (fortuneType: FortuneType): boolean => {
      if (!selectedProfile?.fortunes) return false;

      return selectedProfile.fortunes.some(
        (f) => f.fortune_type === fortuneType && f.paid_at !== null
      );
    },
    [selectedProfile]
  );

  const hasFreeAccess = useCallback(
    (fortuneType: FortuneType): boolean => {
      if (!selectedProfile?.profile_free_access) return false;

      // 호출 시점의 현재 시간으로 만료 체크 (정적 시간 사용하지 않음)
      const now = new Date().toISOString();

      return selectedProfile.profile_free_access.some(
        (access) =>
          access.fortune_type === fortuneType &&
          (access.expires_at === null || access.expires_at > now)
      );
    },
    [selectedProfile]
  );

  const hasAccess = useCallback(
    (fortuneType: FortuneType): boolean => {
      return hasPaidFortune(fortuneType) || hasFreeAccess(fortuneType);
    },
    [hasPaidFortune, hasFreeAccess]
  );

  const navigateToFortune = useCallback(
    (fortuneType: FortuneType) => {
      if (!selectedProfile) return;

      const profileId = selectedProfile.id;

      if (hasAccess(fortuneType)) {
        router.push(`/fortune/${fortuneType}/${profileId}`);
      } else {
        router.push(`/fortune/${fortuneType}/preview/${profileId}`);
      }
    },
    [selectedProfile, hasAccess, router]
  );

  return {
    hasPaidFortune,
    hasFreeAccess,
    hasAccess,
    navigateToFortune,
  };
};
