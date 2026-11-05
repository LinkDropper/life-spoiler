"use client";

import { useEffect, useState } from "react";

import { SCREENING_TIMELINE } from "@/libs/screening/screening-policy";

import { ScreeningOverlay } from "./ScreeningOverlay";

import type { ActiveScreening } from "./ScreeningProvider";
import type { ScreeningOverlayCopy } from "./ScreeningOverlay";

interface ScreeningLoadingProps {
  /** 스크린에 걸리는 제목 (매표소 · 친구가 보낸 본편 …) */
  title: string;
  /** 없으면 운세 상영 문구(screening.*) */
  copy?: ScreeningOverlayCopy;
}

/**
 * 상영관 전환 세션 없이 상영관 화면만 띄우는 로딩.
 * 결제(매표소·발권)와, 상영관 전환 대상이 아닌 공유 페이지 첫 화면이 쓴다.
 * 기다려야만 하는 로딩이라 건너뛰기가 없고, 3D 장면(three.js) 대신 CSS 장면을 쓴다.
 * 서버 렌더·첫 페인트에는 포털을 열 수 없어 같은 밤색 빈 화면을 먼저 둔다.
 */
export const ScreeningLoading = ({ title, copy }: ScreeningLoadingProps) => {
  const [phase, setPhase] = useState<ActiveScreening["phase"] | null>(null);

  useEffect(() => {
    setPhase("entering");
    const timer = setTimeout(
      () => setPhase("waiting"),
      SCREENING_TIMELINE.readyAt
    );
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      aria-busy="true"
      style={{ minHeight: "100vh", background: "var(--cinema-night, #0c1220)" }}
    >
      {phase && (
        <ScreeningOverlay
          screening={{
            title,
            entry: "arrival",
            variant: "short",
            timeline: SCREENING_TIMELINE,
            phase,
            allow3D: false,
          }}
          copy={copy}
        />
      )}
    </div>
  );
};
