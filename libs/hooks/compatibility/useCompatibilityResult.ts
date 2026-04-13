"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

import { useAuthStatus, useUser } from "@/libs/stores/user";
import type { CompatibilityRelationshipType } from "@/libs/supabase/types";

import type { CompatibilityResult } from "./types";

interface UseCompatibilityResultReturn {
  isLoading: boolean;
  error: string | null;
  result: CompatibilityResult | null;
  pairId: string;
  relationshipType: CompatibilityRelationshipType | null;
  showCopyToast: boolean;
  isShareDrawerOpen: boolean;
  handleShare: () => void;
  handleOpenShareDrawer: () => void;
  handleCloseShareDrawer: () => void;
}

export const useCompatibilityResult = (): UseCompatibilityResultReturn => {
  const params = useParams();
  const router = useRouter();
  const authStatus = useAuthStatus();
  const user = useUser();
  const pairId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [relationshipType, setRelationshipType] =
    useState<CompatibilityRelationshipType | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [isShareDrawerOpen, setIsShareDrawerOpen] = useState(false);

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

        if (!data.isPaid) {
          router.replace(`/compatibility/${pairId}/fortune/preview`);
          return;
        }

        setResult(data.data);
        setRelationshipType(data.relationshipType ?? null);
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

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/compatibility/${pairId}/fortune/share?ref=${user?.id ?? ""}`;
    navigator.clipboard.writeText(url).then(() => {
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 2000);
    });
    setIsShareDrawerOpen(false);
  }, [pairId, user]);

  const handleOpenShareDrawer = useCallback(() => {
    setIsShareDrawerOpen(true);
  }, []);

  const handleCloseShareDrawer = useCallback(() => {
    setIsShareDrawerOpen(false);
  }, []);

  const isActuallyLoading = authStatus === "loading" || isLoading;

  return {
    isLoading: isActuallyLoading,
    error,
    result,
    pairId,
    relationshipType,
    showCopyToast,
    isShareDrawerOpen,
    handleShare,
    handleOpenShareDrawer,
    handleCloseShareDrawer,
  };
};
