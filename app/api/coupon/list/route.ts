import { NextResponse } from "next/server";

import { createAuthClient } from "@/libs/supabase";
import type { PromoCodeRow } from "@/libs/supabase/types";

interface CouponItem {
  id: string;
  code: string;
  benefitType: "free_fortune" | "discount";
  fortuneType: string;
  discountPercent: number | null;
  status: "active" | "used" | "expired";
  validUntil: string | null;
  campaignName: string | null;
  createdAt: string;
}

/**
 * 쿠폰의 현재 상태를 판단
 */
const determineCouponStatus = (
  row: PromoCodeRow
): "active" | "used" | "expired" => {
  // single_use 코드가 비활성화됨 → 사용 완료
  if (!row.is_active) {
    return "used";
  }

  // 유효기간이 존재하고 현재 시간보다 과거 → 만료
  if (row.valid_until && new Date(row.valid_until) < new Date()) {
    return "expired";
  }

  return "active";
};

/**
 * DB Row를 API 응답 형식으로 변환
 */
const mapToCouponItem = (row: PromoCodeRow): CouponItem => ({
  id: row.id,
  code: row.code,
  benefitType: row.benefit_type,
  fortuneType: row.fortune_type,
  discountPercent: row.discount_percent,
  status: determineCouponStatus(row),
  validUntil: row.valid_until,
  campaignName: row.campaign_name,
  createdAt: row.created_at,
});

/**
 * 쿠폰함 목록 조회 API
 *
 * GET /api/coupon/list
 * - 현재 로그인한 사용자가 소유한 쿠폰 목록 반환
 * - 생성일 역순 정렬 (최신 먼저)
 */
export async function GET() {
  try {
    const supabase = await createAuthClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("promo_codes") as any)
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("쿠폰 목록 조회 실패:", error);
      return NextResponse.json(
        { success: false, error: "쿠폰 목록을 불러올 수 없습니다." },
        { status: 500 }
      );
    }

    const coupons: CouponItem[] = (data as PromoCodeRow[]).map(mapToCouponItem);

    return NextResponse.json({
      success: true,
      data: coupons,
    });
  } catch (error) {
    console.error("Error in GET /api/coupon/list:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
