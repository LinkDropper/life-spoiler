import { NextRequest, NextResponse } from "next/server";

import {
  FIRST_PAYMENT_AMOUNT_KRW,
  NORMAL_AMOUNT_KRW,
} from "@/libs/services/payment/first-payment-event";
import { isFirstPaymentEligible } from "@/libs/services/payment/first-payment-eligibility";
import type { FortuneType } from "@/libs/supabase";

export const runtime = "nodejs";

const VALID_TYPES: FortuneType[] = [
  "lifetime",
  "yearly",
  "compatibility",
  "past_life",
];

const isFortuneType = (value: string | null): value is FortuneType =>
  value !== null && VALID_TYPES.includes(value as FortuneType);

/**
 * 첫 결제 100원 자격 조회 (국내 KRW 전용).
 * 결제 페이지가 표시 금액·토스 요청 금액을 정하기 위해 호출.
 * 실제 금액 강제는 confirm 라우트가 동일 로직으로 재검증한다.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get("profileId");
  const type = searchParams.get("type");

  if (!profileId || !isFortuneType(type)) {
    return NextResponse.json({
      eligible: false,
      amount: NORMAL_AMOUNT_KRW,
    });
  }

  try {
    const eligible = await isFirstPaymentEligible(type, profileId);
    return NextResponse.json({
      eligible,
      amount: eligible ? FIRST_PAYMENT_AMOUNT_KRW : NORMAL_AMOUNT_KRW,
    });
  } catch (error) {
    console.error("첫 결제 자격 조회 실패:", error);
    // 자격 판정 실패 시 안전하게 정상가로 폴백
    return NextResponse.json({
      eligible: false,
      amount: NORMAL_AMOUNT_KRW,
    });
  }
}
