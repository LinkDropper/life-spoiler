import {
  FIRST_PAYMENT_AMOUNT_KRW,
  NORMAL_AMOUNT_KRW,
  NORMAL_AMOUNT_USD,
} from "@/libs/services/payment/first-payment-event";
import type { FortuneType } from "@/libs/supabase";

/** 결제 화면이 다루는 운세 상품. 이 밖의 값은 잘못된 URL이다 */
export const PAYMENT_FORTUNE_TYPES: readonly FortuneType[] = [
  "yearly",
  "yearly_2027",
  "lifetime",
  "past_life",
  "compatibility",
];

export const isPaymentFortuneType = (value: unknown): value is FortuneType =>
  typeof value === "string" &&
  PAYMENT_FORTUNE_TYPES.some((fortuneType) => fortuneType === value);

/** 관람권 제목 번역 키 (payment 네임스페이스) */
export const getProductNameKey = (fortuneType: FortuneType): string => {
  switch (fortuneType) {
    case "yearly":
      return "productNameYearly";
    case "yearly_2027":
      return "productNameYearly2027";
    case "past_life":
      return "productNamePastLife";
    case "compatibility":
      return "productNameCompatibility";
    default:
      return "productNameLifetime";
  }
};

/** 안내 문장 속에 들어가는 짧은 상품명 번역 키 (payment 네임스페이스) */
export const getShortProductKey = (fortuneType: FortuneType): string =>
  `shortProduct.${fortuneType}`;

export type PaymentBenefit = "coupon" | "firstPayment";

export interface AmountDisplay {
  /** 취소선으로 보여 줄 정가. 할인이 없으면 null */
  originalAmount: number | null;
  /** 실제로 내는 금액 */
  amount: number;
  benefit: PaymentBenefit | null;
}

interface ResolveAmountDisplayParams {
  isForeign: boolean;
  firstPaymentApplied: boolean;
  couponApplied: boolean;
}

/**
 * 관람권과 하단 바에 표시할 금액을 정한다. 표시 전용이며 결제 요청 금액은 건드리지 않는다.
 * 쿠폰이 우선이고, 첫 결제 이벤트는 국내(KRW)에서만 적용된다.
 */
export const resolveAmountDisplay = ({
  isForeign,
  firstPaymentApplied,
  couponApplied,
}: ResolveAmountDisplayParams): AmountDisplay => {
  const listPrice = isForeign ? NORMAL_AMOUNT_USD : NORMAL_AMOUNT_KRW;

  if (couponApplied) {
    return { originalAmount: listPrice, amount: 0, benefit: "coupon" };
  }

  if (firstPaymentApplied && !isForeign) {
    return {
      originalAmount: listPrice,
      amount: FIRST_PAYMENT_AMOUNT_KRW,
      benefit: "firstPayment",
    };
  }

  return { originalAmount: null, amount: listPrice, benefit: null };
};

/** 해외는 $0.00, 국내는 천 단위 구분 + 통화 접미사 */
export const formatPaymentAmount = (
  amount: number,
  isForeign: boolean,
  krwSuffix: string
): string =>
  isForeign
    ? `$${amount.toFixed(2)}`
    : `${amount.toLocaleString("ko-KR")}${krwSuffix}`;

/** /api/coupon/list 응답 중 결제 화면이 쓰는 필드 */
export interface OwnedCoupon {
  id: string;
  code: string;
  benefitType: "free_fortune" | "discount";
  fortuneType: string;
  discountPercent: number | null;
  status: "active" | "used" | "expired";
}
