"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

import { useAuthStatus } from "@/libs/stores/user";

import type { CompatibilityResult } from "./types";
import type { CompatibilityRelationshipType } from "@/libs/supabase/types";

interface UseCompatibilityFortuneReturn {
  isLoading: boolean;
  error: string | null;
  result: CompatibilityResult | null;
  pairId: string;
  isAIGenerated: boolean;
  relationshipType: CompatibilityRelationshipType | null;
  handlePayment: () => void;
  handleBack: () => void;
}

export const useCompatibilityFortune = (): UseCompatibilityFortuneReturn => {
  const params = useParams();
  const router = useRouter();
  const authStatus = useAuthStatus();
  const pairId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  const [relationshipType, setRelationshipType] =
    useState<CompatibilityRelationshipType | null>(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (authStatus !== "authenticated") {
      return;
    }

    if (hasFetchedRef.current) {
      return;
    }
    hasFetchedRef.current = true;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/compatibility/${pairId}/interpret`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          throw new Error(errorData?.error || "궁합 해석에 실패했습니다.");
        }

        const data = await res.json();

        if (data.isPaid) {
          router.replace(`/compatibility/${pairId}/fortune/result`);
          return;
        }

        setResult(data.data);
        setIsAIGenerated(data.isAIGenerated ?? false);
        setRelationshipType(data.relationshipType ?? null);

        if (!data.isAIGenerated) {
          setError("궁합 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [authStatus, pairId, router]);

  const handlePayment = useCallback(() => {
    if (!isAIGenerated || !result) {
      return;
    }
    const nameA = encodeURIComponent(result.charts.profileA.name);
    const nameB = encodeURIComponent(result.charts.profileB.name);
    router.push(
      `/payment/compatibility/${pairId}?nameA=${nameA}&nameB=${nameB}`
    );
  }, [router, pairId, isAIGenerated, result]);

  const handleBack = useCallback(() => {
    router.push("/compatibility");
  }, [router]);

  const isActuallyLoading = authStatus === "loading" || isLoading;

  return {
    isLoading: isActuallyLoading,
    error,
    result,
    pairId,
    isAIGenerated,
    relationshipType,
    handlePayment,
    handleBack,
  };
};
