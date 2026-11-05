"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

import type { ShareProfileData, PastLifeFortuneResult } from "./types";

interface UsePastLifeShareOptions {
  onFortuneNotFound?: () => string;
  onUnknownError?: () => string;
}

interface UsePastLifeShareReturn {
  isLoading: boolean;
  error: string | null;
  result: PastLifeFortuneResult | null;
  profile: ShareProfileData | null;
  profileId: string;
  handleCheckMyFortune: () => void;
}

export const usePastLifeShare = (
  options: UsePastLifeShareOptions = {}
): UsePastLifeShareReturn => {
  const params = useParams();
  const router = useRouter();
  const profileId = params.profileId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PastLifeFortuneResult | null>(null);
  const [profile, setProfile] = useState<ShareProfileData | null>(null);

  // Use ref to avoid infinite loop from options object
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const fetchFortuneData = async () => {
      try {
        const response = await fetch(
          `/api/fortune/${profileId}?type=past_life`
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

    fetchFortuneData();
  }, [profileId]);

  const handleCheckMyFortune = useCallback(() => {
    router.push("/");
  }, [router]);

  return {
    isLoading,
    error,
    result,
    profile,
    profileId,
    handleCheckMyFortune,
  };
};
