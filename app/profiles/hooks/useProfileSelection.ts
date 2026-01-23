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

  // 프로필 목록이 변경되고 선택된 프로필이 없으면 첫 번째 프로필 자동 선택
  useEffect(() => {
    if (profiles.length > 0 && !selectedProfileId) {
      setSelectedProfileId(profiles[0].id);
    }
  }, [profiles, selectedProfileId]);

  // 선택된 프로필이 삭제되었을 때 처리
  useEffect(() => {
    if (
      selectedProfileId &&
      !profiles.find((p) => p.id === selectedProfileId)
    ) {
      setSelectedProfileId(profiles.length > 0 ? profiles[0].id : null);
    }
  }, [profiles, selectedProfileId]);

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

      if (hasLifetime) types.push("lifetime");
      if (hasYearly) types.push("yearly");

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
