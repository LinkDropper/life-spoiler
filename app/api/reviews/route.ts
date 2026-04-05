import { NextResponse } from "next/server";

import { sendReviewNotification } from "@/libs/discord/webhook";
import { createAuthClient } from "@/libs/supabase";

import type { ReviewFortuneType, ReviewInsert } from "@/libs/supabase/types";

const VALID_FORTUNE_TYPES: ReadonlySet<ReviewFortuneType> = new Set([
  "lifetime",
  "yearly",
  "past_life",
  "compatibility",
]);

const MIN_CONTENT_LENGTH = 5;
const MAX_CONTENT_LENGTH = 200;
const MIN_RATING = 1;
const MAX_RATING = 5;

interface ReviewCreateRequest {
  profileId: string;
  fortuneType: string;
  rating: number;
  content: string;
}

const validateRequest = (body: ReviewCreateRequest): string | null => {
  const { profileId, fortuneType, rating, content } = body;

  if (!profileId || typeof profileId !== "string") {
    return "프로필 ID가 필요합니다.";
  }

  if (!VALID_FORTUNE_TYPES.has(fortuneType as ReviewFortuneType)) {
    return "유효하지 않은 운세 타입입니다.";
  }

  if (
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < MIN_RATING ||
    rating > MAX_RATING
  ) {
    return `별점은 ${MIN_RATING}~${MAX_RATING} 사이의 정수여야 합니다.`;
  }

  if (!content || typeof content !== "string") {
    return "후기 내용이 필요합니다.";
  }

  const trimmedLength = content.trim().length;

  if (trimmedLength < MIN_CONTENT_LENGTH) {
    return `후기는 최소 ${MIN_CONTENT_LENGTH}자 이상이어야 합니다.`;
  }

  if (trimmedLength > MAX_CONTENT_LENGTH) {
    return `후기는 최대 ${MAX_CONTENT_LENGTH}자까지 작성할 수 있습니다.`;
  }

  return null;
};

export const GET = async (request: Request) => {
  try {
    const supabase = await createAuthClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");
    const fortuneType = searchParams.get("fortuneType");

    if (!profileId || !fortuneType) {
      return NextResponse.json(
        { error: "profileId와 fortuneType이 필요합니다." },
        { status: 400 }
      );
    }

    const { data: review } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("reviews") as any)
        .select("id, rating, content")
        .eq("profile_id", profileId)
        .eq("fortune_type", fortuneType)
        .single();

    return NextResponse.json({ exists: !!review, review: review ?? null });
  } catch (error) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
};

export const POST = async (request: Request) => {
  try {
    const supabase = await createAuthClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    const body: ReviewCreateRequest = await request.json();
    const validationError = validateRequest(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { profileId, fortuneType, rating, content } = body;

    // 프로필이 현재 유저 소유인지 확인
    const { data: profile, error: profileError } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("profiles") as any)
        .select("id")
        .eq("id", profileId)
        .eq("user_id", authUser.id)
        .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "프로필을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 해당 프로필+운세타입으로 결제/이용 이력이 있는지 확인
    const fortuneTypeValue = fortuneType as ReviewFortuneType;

    if (fortuneTypeValue === "compatibility") {
      const { data: pair, error: pairError } =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("compatibility_pairs") as any)
          .select("id")
          .or(`profile_a_id.eq.${profileId},profile_b_id.eq.${profileId}`)
          .not("paid_at", "is", null)
          .limit(1)
          .single();

      if (pairError || !pair) {
        return NextResponse.json(
          { error: "해당 운세를 이용한 이력이 없습니다." },
          { status: 403 }
        );
      }
    } else {
      const { data: fortune, error: fortuneError } =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("fortunes") as any)
          .select("id")
          .eq("profile_id", profileId)
          .eq("fortune_type", fortuneTypeValue)
          .not("paid_at", "is", null)
          .limit(1)
          .single();

      if (fortuneError || !fortune) {
        return NextResponse.json(
          { error: "해당 운세를 이용한 이력이 없습니다." },
          { status: 403 }
        );
      }
    }

    // 후기 저장
    const reviewData: ReviewInsert = {
      profile_id: profileId,
      fortune_type: fortuneTypeValue,
      rating,
      content: content.trim(),
    };

    const { data: review, error: insertError } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("reviews") as any)
        .insert(reviewData)
        .select("id")
        .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "이미 해당 운세에 대한 후기를 작성하셨습니다." },
          { status: 409 }
        );
      }

      console.error("POST /api/reviews insert error:", insertError);
      return NextResponse.json(
        { error: "후기 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    // 디스코드 알림 (실패해도 후기 저장은 성공)
    sendReviewNotification({
      fortuneType,
      rating,
      content: content.trim(),
    }).catch((error) => {
      console.error("Discord 알림 전송 실패:", error);
    });

    return NextResponse.json(
      { success: true, reviewId: review.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
};
