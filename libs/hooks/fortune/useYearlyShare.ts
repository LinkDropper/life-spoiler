"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";

import type { ShareProfileData, YearlyFortuneResult } from "./types";

interface UseYearlyShareOptions {
  onFortuneNotFound?: () => string;
  onUnknownError?: () => string;
}

interface UseYearlyShareReturn {
  isLoading: boolean;
  error: string | null;
  result: YearlyFortuneResult | null;
  profile: ShareProfileData | null;
  profileId: string;
  currentYear: number;
  handleCheckMyFortune: () => void;
}

export const useYearlyShare = (
  options: UseYearlyShareOptions = {}
): UseYearlyShareReturn => {
  const params = useParams();
  const router = useRouter();
  const profileId = params.profileId as string;

  // Memoize currentYear to prevent recalculation on every render
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<YearlyFortuneResult | null>(null);
  const [profile, setProfile] = useState<ShareProfileData | null>(null);

  // Use ref to avoid infinite loop from options object
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const fetchYearlyFortune = async () => {
      try {
        const response = await fetch(
          `/api/fortune/${profileId}?type=yearly&year=${currentYear}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              (optionsRef.current.onFortuneNotFound?.() ??
                "운세 데이터를 찾을 수 없습니다.")
          );
        }

        const data = await response.json();
        setProfile(data.data.profile);
        setResult(data.data.fortune);
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
  }, [profileId, currentYear]);

  const handleCheckMyFortune = useCallback(() => {
    router.push("/");
  }, [router]);

  return {
    isLoading,
    error,
    result,
    profile,
    profileId,
    currentYear,
    handleCheckMyFortune,
  };
};
