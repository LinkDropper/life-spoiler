"use client";

import { useTranslations } from "next-intl";

import { ScreeningLoading } from "./ScreeningLoading";

import type { ScreeningOverlayCopy } from "./ScreeningOverlay";

type PaymentLoadingStage = "checkout" | "confirm";

interface PaymentScreeningLoadingProps {
  /** checkout: 결제 화면 준비(매표소), confirm: 결제 승인 확인(발권) */
  stage: PaymentLoadingStage;
}

const WAITING_KEYS: Record<PaymentLoadingStage, readonly string[]> = {
  checkout: ["checkout1", "checkout2"],
  confirm: ["confirm1", "confirm2", "confirm3"],
};

/**
 * 결제 흐름의 로딩 — 운세 이동과 같은 상영관 화면을 매표소·발권 문구로 띄운다.
 * 결제는 상영관 전환 대상 경로가 아니라(screening-policy) 전환 세션 없이 화면만 쓴다(ScreeningLoading).
 * 결제 승인은 기다려야만 하므로 건너뛰기가 없다.
 */
export const PaymentScreeningLoading = ({
  stage,
}: PaymentScreeningLoadingProps) => {
  const t = useTranslations("screening.payment");
  const title = t(`${stage}Title`);
  const copy: ScreeningOverlayCopy = {
    preparing: t("preparing"),
    waiting: WAITING_KEYS[stage].map((key) => t(`waiting.${key}`)),
    long: t("long"),
    status: t("status", { title }),
  };

  return <ScreeningLoading title={title} copy={copy} />;
};
