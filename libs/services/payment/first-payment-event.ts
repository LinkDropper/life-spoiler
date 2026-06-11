import type { FortuneType } from "@/libs/supabase";

// ============================================================
// 첫 결제 100원 이벤트 — 단일 진실 소스
// 배너 노출 / 결제 페이지 금액 / 서버 금액 검증이 모두 이 모듈을 참조한다.
// ============================================================

/** 정상가 (원) */
export const NORMAL_AMOUNT_KRW = 990;
/** 정상가 (달러) */
export const NORMAL_AMOUNT_USD = 0.99;
/** 첫 결제 이벤트가는 (원) */
export const FIRST_PAYMENT_AMOUNT_KRW = 100;

/**
 * 이벤트 설정.
 * - 기간은 KST(+09:00) 기준.
 * - enabled를 false로 두면 기간과 무관하게 즉시 종료된다.
 * - 100원은 국내(KRW)·본편 운세에만 적용 (해외 USD·관상 제외).
 */
export const FIRST_PAYMENT_EVENT = {
  enabled: true,
  startsAt: "2026-06-11T00:00:00+09:00",
  endsAt: "2026-07-12T23:59:59+09:00",
  eligibleTypes: [
    "lifetime",
    "yearly",
    "compatibility",
    "past_life",
  ] as FortuneType[],
} as const;

/** 현재 시각 기준 이벤트 진행 중 여부 (기간 + enabled) */
export const isFirstPaymentEventActive = (now: Date = new Date()): boolean => {
  if (!FIRST_PAYMENT_EVENT.enabled) {
    return false;
  }
  const current = now.getTime();
  const start = new Date(FIRST_PAYMENT_EVENT.startsAt).getTime();
  const end = new Date(FIRST_PAYMENT_EVENT.endsAt).getTime();
  return current >= start && current <= end;
};

/** 해당 운세 타입이 이벤트 대상인지 */
export const isFirstPaymentEventType = (fortuneType: FortuneType): boolean =>
  FIRST_PAYMENT_EVENT.eligibleTypes.includes(fortuneType);

/**
 * 국내(KRW) 결제 금액 결정.
 * @param firstPaymentApplied 첫 결제 자격이 확정된 경우 true
 */
export const resolveKrwAmount = (firstPaymentApplied: boolean): number =>
  firstPaymentApplied ? FIRST_PAYMENT_AMOUNT_KRW : NORMAL_AMOUNT_KRW;
