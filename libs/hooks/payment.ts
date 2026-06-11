"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";

import {
  FIRST_PAYMENT_AMOUNT_KRW,
  NORMAL_AMOUNT_KRW,
  isFirstPaymentEventActive,
} from "@/libs/services/payment/first-payment-event";
import type { FortuneType } from "@/libs/supabase";

/**
 * 첫 결제 100원 이벤트 표시 여부 (국내 ko + 이벤트 기간).
 * 랜딩 등 프로필이 없는 마케팅 노출용.
 */
export const useIsFirstPaymentEvent = (): boolean => {
  const locale = useLocale();
  return locale === "ko" && isFirstPaymentEventActive();
};

/**
 * 특정 프로필/운세의 첫 결제 100원 "실제 자격" (국내 전용).
 * 서버 자격 API로 확인하므로, 이미 결제한 적 있는 유저는 false.
 * preview 등 결제 직전 화면에서 정확한 금액을 보여줄 때 사용.
 */
export const useFirstPaymentEligibility = (
  profileId?: string,
  fortuneType?: FortuneType
): boolean => {
  const locale = useLocale();
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    if (
      locale !== "ko" ||
      !isFirstPaymentEventActive() ||
      !profileId ||
      !fortuneType
    ) {
      setEligible(false);
      return;
    }
    let cancelled = false;
    fetch(
      `/api/payment/first-payment-eligibility?profileId=${encodeURIComponent(
        profileId
      )}&type=${fortuneType}`
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setEligible(Boolean(data.eligible));
        }
      })
      .catch(() => {
        // 실패 시 비자격(정상가) 유지
      });
    return () => {
      cancelled = true;
    };
  }, [locale, profileId, fortuneType]);

  return eligible;
};

/**
 * 정상가가 포함된 표시 문구(예: "전체 스포 확인하기 (990원)", "990원")의
 * 금액을 이벤트가로 치환한다. 국내(ko) 문구에만 적용.
 */
export const toEventPriceText = (text: string): string =>
  text.replaceAll(String(NORMAL_AMOUNT_KRW), String(FIRST_PAYMENT_AMOUNT_KRW));
