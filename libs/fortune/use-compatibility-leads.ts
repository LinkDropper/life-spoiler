"use client";

import { useMemo } from "react";

import type { CompatibilityLead } from "@/components/fortune/screen/CompatibilitySections";
import { useScreenCast } from "@/libs/fortune/use-screen-cast";
import type { CompatibilityResult } from "@/libs/hooks/compatibility/types";

interface CompatibilityLeads {
  leadA: CompatibilityLead;
  leadB: CompatibilityLead;
}

/** 궁합 화면의 두 주연: 이름 · 명궁 주성 · 오행국 · 한 줄 소개 · 명반 별자리 */
export const useCompatibilityLeads = (
  result: CompatibilityResult | null
): CompatibilityLeads => {
  const chartA = result?.charts.profileA.rawChart ?? null;
  const chartB = result?.charts.profileB.rawChart ?? null;
  const castA = useScreenCast(chartA);
  const castB = useScreenCast(chartB);

  return useMemo(() => {
    const profileA = result?.charts.profileA;
    const profileB = result?.charts.profileB;
    const interpretation = result?.interpretation;
    return {
      leadA: {
        side: "a",
        name: profileA?.name ?? "",
        starKey: castA.stars[0]?.starName ?? null,
        leadStar: castA.leadStar,
        wuxingJu: profileA?.chart.wuxingJu ?? "",
        summary: interpretation?.profileASummary,
        chart: chartA,
        stars: castA.stars,
      },
      leadB: {
        side: "b",
        name: profileB?.name ?? "",
        starKey: castB.stars[0]?.starName ?? null,
        leadStar: castB.leadStar,
        wuxingJu: profileB?.chart.wuxingJu ?? "",
        summary: interpretation?.profileBSummary,
        chart: chartB,
        stars: castB.stars,
      },
    };
  }, [result, castA, castB, chartA, chartB]);
};
