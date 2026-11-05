"use client";

import { useTranslations } from "next-intl";

import { ScreeningLoading, useScreeningHold } from "@/components/screening";

/**
 * 운세 화면 공용 로딩.
 * - 예고편·본편: 상영관 전환이 이미 화면을 덮고 있어 빈 화면만 둔다(전환이 이 로딩이 끝날 때까지 기다린다).
 * - 공유 페이지처럼 전환 대상이 아닌 곳: 같은 상영관 화면을 "친구가 보낸 본편"으로 띄운다.
 *   (예전 풍경 영상·Lottie·문구 목록은 2026-11 상영관 개편으로 뺐다)
 */
export const Loading = () => {
  const t = useTranslations("screening");
  const isCoveredByScreening = useScreeningHold();

  if (isCoveredByScreening) {
    return (
      <div
        aria-busy="true"
        style={{
          minHeight: "100vh",
          background: "var(--cinema-night, #0c1220)",
        }}
      />
    );
  }

  return <ScreeningLoading title={t("shared.title")} />;
};
