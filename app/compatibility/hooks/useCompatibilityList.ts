"use client";

import { useState, useCallback, useEffect } from "react";

import type { CompatibilityPairWithProfiles } from "@/app/api/compatibility/route";

interface UseCompatibilityListReturn {
  pairs: CompatibilityPairWithProfiles[];
  isLoading: boolean;
  selectedPairId: string | null;
  handlePairSelect: (pairId: string) => void;
  fetchPairs: () => Promise<void>;
  removePair: (pairId: string) => void;
}

export const useCompatibilityList = (): UseCompatibilityListReturn => {
  const [pairs, setPairs] = useState<CompatibilityPairWithProfiles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPairId, setSelectedPairId] = useState<string | null>(null);

  const fetchPairs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/compatibility");
      if (!response.ok) {
        throw new Error("Failed to fetch compatibility pairs");
      }
      const data = await response.json();
      setPairs(data.pairs);

      if (data.pairs.length > 0) {
        setSelectedPairId((prev) => {
          const stillExists = data.pairs.some(
            (p: CompatibilityPairWithProfiles) => p.id === prev
          );
          if (stillExists) return prev;
          return data.pairs[0].id;
        });
      } else {
        setSelectedPairId(null);
      }
    } catch {
      setPairs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePairSelect = useCallback((pairId: string) => {
    setSelectedPairId(pairId);
  }, []);

  const removePair = useCallback((pairId: string) => {
    setPairs((prev) => prev.filter((p) => p.id !== pairId));
    setSelectedPairId((prev) => {
      if (prev === pairId) return null;
      return prev;
    });
  }, []);

  // 삭제 후 선택이 해제된 경우 첫 번째 항목을 자동 선택
  useEffect(() => {
    if (selectedPairId === null && pairs.length > 0) {
      setSelectedPairId(pairs[0].id);
    }
  }, [pairs, selectedPairId]);

  return {
    pairs,
    isLoading,
    selectedPairId,
    handlePairSelect,
    fetchPairs,
    removePair,
  };
};
