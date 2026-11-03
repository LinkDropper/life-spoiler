"use client";

import { useEffect, useState } from "react";

import { DawnScene } from "./DawnScene";
import { FilmScene } from "./FilmScene";
import { ScrollTrigger } from "./gsap";
import { HourDialScene } from "./HourDialScene";
import { ProofScene } from "./ProofScene";
import { SkyChartScene } from "./SkyChartScene";
import { TicketScene } from "./TicketScene";
import { TryScene } from "./TryScene";

import type { TryResult } from "./TryScene";
import type { ReactNode } from "react";
import type { LandingCinemaData } from "@/libs/landing/landing-cinema-data";

interface CinemaLandingProps {
  data: LandingCinemaData;
  totalCount: number | null;
  /** 마지막 새벽 장면 직전에 끼울 정적 콘텐츠 (FAQ) */
  beforeFinale?: ReactNode;
}

/**
 * 스크롤하면 인생이 상영되는 랜딩.
 * 밤하늘 → 명반 → 시진 → 내 명반 → 인생 필름 → 관람권 → 누적 건수 → 새벽 CTA.
 * 방문자가 자기 명반을 그리면 이후 필름 장면이 그 사람의 대운으로 바뀐다.
 */
export const CinemaLanding = ({
  data,
  totalCount,
  beforeFinale,
}: CinemaLandingProps) => {
  const [tryResult, setTryResult] = useState<TryResult | null>(null);
  const { protagonist, hours } = data;

  // 내 명반 결과가 열리면 아래 장면들의 스크롤 구간 위치가 바뀌므로 다시 잰다
  useEffect(() => {
    const frameId = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(frameId);
  }, [tryResult]);

  return (
    <>
      <SkyChartScene protagonist={protagonist} />
      <HourDialScene birthDate={protagonist.birthDate} hours={hours} />
      <TryScene result={tryResult} onResult={setTryResult} />
      <FilmScene
        frames={tryResult?.snapshot.frames ?? protagonist.frames}
        birthYear={
          tryResult?.birthYear ?? Number(protagonist.birthDate.slice(0, 4))
        }
        isMine={tryResult !== null}
      />
      <TicketScene />
      <ProofScene totalCount={totalCount} />
      {beforeFinale}
      <DawnScene />
    </>
  );
};
