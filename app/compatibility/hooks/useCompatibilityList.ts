"use client";

import { useCallback, useState } from "react";

import type { CompatibilityPairWithProfiles } from "@/app/api/compatibility/route";
import {
  toCompatibilityLineupItem,
  type CompatibilityLineupItem,
} from "@/libs/fortune/compatibility-screen";

interface UseCompatibilityListReturn {
  items: CompatibilityLineupItem[];
  isLoading: boolean;
  fetchPairs: () => Promise<void>;
  removePair: (pairId: string) => void;
}

/** 궁합 목록 = 공동 주연작 라인업. 카드를 누르면 바로 상영하므로 고르는 상태는 두지 않는다 */
export const useCompatibilityList = (): UseCompatibilityListReturn => {
  const [items, setItems] = useState<CompatibilityLineupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPairs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/compatibility");
      if (!response.ok) {
        throw new Error("Failed to fetch compatibility pairs");
      }
      const data: { pairs: CompatibilityPairWithProfiles[] } =
        await response.json();
      setItems(data.pairs.map(toCompatibilityLineupItem));
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removePair = useCallback((pairId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== pairId));
  }, []);

  return { items, isLoading, fetchPairs, removePair };
};
