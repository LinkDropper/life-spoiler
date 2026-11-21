"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import {
  hasFortuneAccessOf,
  hasFreeAccessOf,
  hasPaidFortuneOf,
} from "@/libs/fortune/entitlement";
import type { ProfileWithFortunes } from "@/libs/stores/profile";

type FortuneType =
  | "lifetime"
  | "yearly"
  | "past-life"
  | "yearly_2027"
  | "daily";
type PaidFortuneType = Exclude<FortuneType, "daily">;

const toDbFortuneType = (
  type: PaidFortuneType
): "lifetime" | "yearly" | "past_life" | "yearly_2027" =>
  type === "past-life" ? "past_life" : type;

interface UseFortuneNavigationProps {
  selectedProfile: ProfileWithFortunes | undefined;
}

interface UseFortuneNavigationReturn {
  hasPaidFortune: (fortuneType: PaidFortuneType) => boolean;
  hasFreeAccess: (fortuneType: PaidFortuneType) => boolean;
  hasAccess: (fortuneType: PaidFortuneType) => boolean;
  navigateToFortune: (fortuneType: FortuneType) => void;
}

export const useFortuneNavigation = ({
  selectedProfile,
}: UseFortuneNavigationProps): UseFortuneNavigationReturn => {
  const router = useRouter();

  const hasPaidFortune = useCallback(
    (fortuneType: PaidFortuneType): boolean =>
      hasPaidFortuneOf(selectedProfile, toDbFortuneType(fortuneType)),
    [selectedProfile]
  );

  // 호출 시점의 현재 시간으로 만료 체크 (정적 시간 사용하지 않음)
  const hasFreeAccess = useCallback(
    (fortuneType: PaidFortuneType): boolean =>
      hasFreeAccessOf(selectedProfile, toDbFortuneType(fortuneType)),
    [selectedProfile]
  );

  const hasAccess = useCallback(
    (fortuneType: PaidFortuneType): boolean =>
      hasFortuneAccessOf(selectedProfile, toDbFortuneType(fortuneType)),
    [selectedProfile]
  );

  const navigateToFortune = useCallback(
    (fortuneType: FortuneType) => {
      if (!selectedProfile) return;

      const profileId = selectedProfile.id;

      // 오늘의 운세는 무료라 결제/미리보기 분기 없이 결과로 직행한다
      if (fortuneType === "daily") {
        router.push(`/fortune/daily/${profileId}`);
        return;
      }

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
