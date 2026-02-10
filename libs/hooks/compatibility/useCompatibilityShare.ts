"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

import type { CompatibilityRelationshipType } from "@/libs/supabase/types";

import type { CompatibilityResult } from "./types";

interface UseCompatibilityShareReturn {
  isLoading: boolean;
  error: string | null;
  result: CompatibilityResult | null;
  relationshipType: CompatibilityRelationshipType | null;
  pairId: string;
  handleCheckMyFortune: () => void;
}

export const useCompatibilityShare = (): UseCompatibilityShareReturn => {
  const params = useParams();
  const router = useRouter();
  const pairId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [relationshipType, setRelationshipType] =
    useState<CompatibilityRelationshipType | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/compatibility/${pairId}/share`);

        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          throw new Error(
            errorData?.error || "궁합 데이터를 찾을 수 없습니다."
          );
        }

        const data = await res.json();
        setResult(data.data.result);
        setRelationshipType(data.data.relationshipType ?? null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [pairId]);

  const handleCheckMyFortune = useCallback(() => {
    router.push("/");
  }, [router]);

  return {
    isLoading,
    error,
    result,
    relationshipType,
    pairId,
    handleCheckMyFortune,
  };
};
