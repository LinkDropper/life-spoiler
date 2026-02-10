import { NextRequest, NextResponse } from "next/server";

import { sendFreePromoNotification } from "@/libs/discord";
import {
  createAuthClient,
  claimFreeCompatibility,
  isCompatibilityFreeEligible,
} from "@/libs/supabase";
import type { CompatibilityPairRow } from "@/libs/supabase/types";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pairId } = await params;

    // 1. 인증 확인
    const supabase = await createAuthClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 2. pair 조회
    const { data: pairData, error: pairError } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("compatibility_pairs") as any)
        .select("*")
        .eq("id", pairId)
        .single();

    if (pairError || !pairData) {
      return NextResponse.json(
        { success: false, error: "궁합 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const pair = pairData as CompatibilityPairRow;

    // 3. 소유권 확인
    if (pair.user_id !== authUser.id) {
      return NextResponse.json(
        { success: false, error: "접근 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 4. 이미 결제됨
    if (pair.paid_at) {
      return NextResponse.json(
        { success: false, error: "이미 결제된 궁합입니다." },
        { status: 400 }
      );
    }

    // 5. 무료 프로모션 자격 확인
    const eligible = await isCompatibilityFreeEligible(authUser.id);
    if (!eligible) {
      return NextResponse.json(
        { success: false, error: "무료 프로모션 대상이 아닙니다." },
        { status: 403 }
      );
    }

    // 6. 무료 청구 처리
    const claimed = await claimFreeCompatibility(pairId);
    if (!claimed) {
      return NextResponse.json(
        { success: false, error: "무료 청구에 실패했습니다." },
        { status: 500 }
      );
    }

    // 7. Discord 알림 (비동기, 실패해도 응답에 영향 없음)
    const claimedAt = new Date().toISOString();

    // 프로필 이름 조회
    let profileNames: string | undefined;
    try {
      const { data: profileA } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", pair.profile_a_id)
        .single<{ name: string }>();
      const { data: profileB } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", pair.profile_b_id)
        .single<{ name: string }>();
      const nameA = profileA?.name ?? "?";
      const nameB = profileB?.name ?? "?";
      profileNames = `${nameA} × ${nameB}`;
    } catch {
      // 프로필 조회 실패 시 무시
    }

    sendFreePromoNotification({
      userId: authUser.id,
      pairId,
      profileNames,
      claimedAt,
    }).catch((error) => {
      console.error("디스코드 알림 전송 실패:", error);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("무료 궁합 청구 API 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
