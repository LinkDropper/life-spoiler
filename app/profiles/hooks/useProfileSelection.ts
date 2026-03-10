"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

import type { ProfileWithFortunes } from "@/libs/stores/profile";
import type { FortuneType } from "@/libs/stores/user";

interface UseProfileSelectionProps {
  profiles: ProfileWithFortunes[];
}

interface UseProfileSelectionReturn {
  selectedProfileId: string | null;
  selectedProfile: ProfileWithFortunes | undefined;
  handleProfileSelect: (profileId: string) => void;
  getCompletedFortunes: (profile: ProfileWithFortunes) => FortuneType[];
}

export const useProfileSelection = ({
  profiles,
}: UseProfileSelectionProps): UseProfileSelectionReturn => {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null
  );

  // 프로필 선택 상태 관리 (함수형 업데이트로 현재 상태를 안전하게 참조)
  useEffect(() => {
    setSelectedProfileId((currentId) => {
      if (profiles.length === 0) {
        return null;
      }

      const isSelectionValid =
        currentId && profiles.some((p) => p.id === currentId);

      if (!isSelectionValid) {
        return profiles[0].id;
      }

      return currentId;
    });
  }, [profiles]);

  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id === selectedProfileId),
    [profiles, selectedProfileId]
  );

  const handleProfileSelect = useCallback((profileId: string) => {
    setSelectedProfileId(profileId);
  }, []);

  const getCompletedFortunes = useCallback(
    (profile: ProfileWithFortunes): FortuneType[] => {
      if (!profile.fortunes) return [];

      const types: FortuneType[] = [];
      const hasLifetime = profile.fortunes.some(
        (f) => f.fortune_type === "lifetime" && f.paid_at
      );
      const hasYearly = profile.fortunes.some(
        (f) => f.fortune_type === "yearly" && f.paid_at
      );
      const hasPastLife = profile.fortunes.some(
        (f) => f.fortune_type === "past_life" && f.paid_at
      );

      if (hasLifetime) types.push("lifetime");
      if (hasYearly) types.push("yearly");
      if (hasPastLife) types.push("past_life");

      return types;
    },
    []
  );

  return {
    selectedProfileId,
    selectedProfile,
    handleProfileSelect,
    getCompletedFortunes,
  };
};
