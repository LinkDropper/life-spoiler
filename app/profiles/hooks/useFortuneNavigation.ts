"use client";

import { useMemo, useCallback } from "react";
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

  // 현재 시간을 메모이제이션 (컴포넌트 마운트 시점 기준)
  const now = useMemo(() => new Date().toISOString(), []);

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

      return selectedProfile.profile_free_access.some(
        (access) =>
          access.fortune_type === fortuneType &&
          (access.expires_at === null || access.expires_at > now)
      );
    },
    [selectedProfile, now]
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
