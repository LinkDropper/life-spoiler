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

  // 프로필 선택 상태 관리 (단일 effect로 통합하여 race condition 방지)
  useEffect(() => {
    // 프로필이 없으면 선택 해제
    if (profiles.length === 0) {
      setSelectedProfileId(null);
      return;
    }

    // 선택된 프로필이 없거나 삭제된 경우 첫 번째 프로필 자동 선택
    const isSelectionValid =
      selectedProfileId && profiles.some((p) => p.id === selectedProfileId);

    if (!isSelectionValid) {
      setSelectedProfileId(profiles[0].id);
    }
  }, [profiles]); // selectedProfileId를 의존성에서 제외하여 불필요한 effect 실행 방지

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
