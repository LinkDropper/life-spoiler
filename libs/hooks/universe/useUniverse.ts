"use client";

import { useCallback, useEffect, useState } from "react";

import { GUEST_LIMIT_PER_UNIVERSE } from "@/libs/universe/constants";

import type {
  UniverseDetailDto,
  UniverseGuestDto,
} from "@/libs/universe/types";

interface ApiErrorBody {
  error?: { code?: string; message?: string };
}

export type UniverseLoadState = "loading" | "loaded" | "notFound" | "error";

interface UseUniverseResult {
  state: UniverseLoadState;
  detail: UniverseDetailDto | null;
  reload: () => void;
  /** 친구 등록 성공 후 목록을 낙관적으로 갱신 */
  applyGuest: (guest: UniverseGuestDto, isDuplicate: boolean) => void;
}

/**
 * 우주 상세 조회.
 *
 * 방문자 수가 많지 않은 기능이므로 전역 캐시/폴링을 두지 않고 진입 시 1회 조회한다
 * (과설계 지양 — PRD "상태 관리" 절).
 */
export const useUniverse = (publicId: string): UseUniverseResult => {
  const [state, setState] = useState<UniverseLoadState>("loading");
  const [detail, setDetail] = useState<UniverseDetailDto | null>(null);

  const fetchDetail = useCallback(async () => {
    setState("loading");

    try {
      const response = await fetch(`/api/universe/${publicId}`);

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
        setState(
          body.error?.code === "UNIVERSE_NOT_FOUND" ? "notFound" : "error"
        );
        return;
      }

      setDetail((await response.json()) as UniverseDetailDto);
      setState("loaded");
    } catch {
      setState("error");
    }
  }, [publicId]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  const applyGuest = useCallback(
    (guest: UniverseGuestDto, isDuplicate: boolean) => {
      setDetail((previous) => {
        if (!previous) {
          return previous;
        }

        const others = previous.guests.filter(
          (item) => item.starSeed !== guest.starSeed
        );
        const guests = [...others, guest].sort((a, b) => b.score - a.score);
        // 재제출(업서트)은 인원이 늘지 않는다
        const guestCount = isDuplicate
          ? previous.guestCount
          : previous.guestCount + 1;

        return {
          ...previous,
          guests,
          guestCount,
          // ownerSummary.guestCount와 isFull을 함께 갱신하지 않으면
          // 같은 값을 뜻하는 필드가 서로 어긋난 채로 남는다
          ownerSummary: { ...previous.ownerSummary, guestCount },
          isFull: guestCount >= GUEST_LIMIT_PER_UNIVERSE,
        };
      });
    },
    []
  );

  return { state, detail, reload: fetchDetail, applyGuest };
};
