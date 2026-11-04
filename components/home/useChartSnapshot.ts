"use client";

import { useEffect, useState } from "react";

import type { ChartRequest } from "@/libs/home/home-profile";
import type { ChartSnapshot } from "@/libs/landing/chart-snapshot";

export type ChartSnapshotState =
  | { status: "idle" | "loading" | "error"; snapshot: null }
  | { status: "loaded"; snapshot: ChartSnapshot };

/**
 * 본편 결과가 없는 프로필의 필름을 그리려고 생년월일시로 명반 요약을 받는다.
 * 랜딩 "내 명반 그려보기"와 같은 계산 API다(저장·로그 없음, no-store).
 * 명반 엔진을 클라이언트 번들에 싣지 않으려고 서버에서 계산한다.
 */
export const useChartSnapshot = (
  request: ChartRequest | null
): ChartSnapshotState => {
  const [state, setState] = useState<ChartSnapshotState>({
    status: "idle",
    snapshot: null,
  });
  // 객체 참조가 아니라 값이 바뀔 때만 다시 계산한다
  const requestKey = request ? JSON.stringify(request) : null;

  useEffect(() => {
    if (!requestKey) {
      setState({ status: "idle", snapshot: null });
      return;
    }

    const controller = new AbortController();
    setState({ status: "loading", snapshot: null });

    fetch("/api/landing/chart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestKey,
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`명반 요약 요청 실패: ${response.status}`);
        }
        const { snapshot } = (await response.json()) as {
          snapshot: ChartSnapshot;
        };
        setState({ status: "loaded", snapshot });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        console.error("[home] 명반 요약을 불러오지 못했습니다.", error);
        setState({ status: "error", snapshot: null });
      });

    return () => controller.abort();
  }, [requestKey]);

  return state;
};
