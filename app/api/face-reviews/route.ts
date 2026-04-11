import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { sendReviewNotification } from "@/libs/discord/webhook";
import { createAuthClient } from "@/libs/supabase";

import type { Database, FaceReviewInsert } from "@/libs/supabase/types";

type SupabaseDB = SupabaseClient<Database>;

const MIN_CONTENT_LENGTH = 5;
const MAX_CONTENT_LENGTH = 200;
const MIN_RATING = 1;
const MAX_RATING = 5;

interface FaceReviewCreateRequest {
  faceProfileId: string;
  rating: number;
  content: string;
}

const validateRequest = (body: FaceReviewCreateRequest): string | null => {
  const { faceProfileId, rating, content } = body;

  if (!faceProfileId || typeof faceProfileId !== "string") {
    return "관상 프로필 ID가 필요합니다.";
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
    const supabase = (await createAuthClient()) as SupabaseDB;

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
    const faceProfileId = searchParams.get("faceProfileId");

    if (!faceProfileId) {
      return NextResponse.json(
        { error: "faceProfileId가 필요합니다." },
        { status: 400 }
      );
    }

    const { data: faceProfile, error: faceProfileError } = await supabase
      .from("face_profiles")
      .select("id")
      .eq("id", faceProfileId)
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (faceProfileError || !faceProfile) {
      return NextResponse.json(
        { error: "프로필을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const { data: review } = await supabase
      .from("face_reviews")
      .select("id, rating, content")
      .eq("face_profile_id", faceProfileId)
      .maybeSingle();

    return NextResponse.json({ exists: !!review, review: review ?? null });
  } catch (error) {
    console.error("GET /api/face-reviews error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
};

export const POST = async (request: Request) => {
  try {
    const supabase = (await createAuthClient()) as SupabaseDB;

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

    const body: FaceReviewCreateRequest = await request.json();
    const validationError = validateRequest(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { faceProfileId, rating, content } = body;

    const { data: faceProfile, error: faceProfileError } = await supabase
      .from("face_profiles")
      .select("id")
      .eq("id", faceProfileId)
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (faceProfileError || !faceProfile) {
      return NextResponse.json(
        { error: "프로필을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const { data: paidReport, error: paidReportError } = await supabase
      .from("face_reports")
      .select("id")
      .eq("face_profile_id", faceProfileId)
      .not("paid_at", "is", null)
      .limit(1)
      .maybeSingle();

    if (paidReportError || !paidReport) {
      return NextResponse.json(
        { error: "해당 운세를 이용한 이력이 없습니다." },
        { status: 403 }
      );
    }

    const reviewData: FaceReviewInsert = {
      face_profile_id: faceProfileId,
      rating,
      content: content.trim(),
    };

    const { data: review, error: insertError } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("face_reviews") as any)
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

      console.error("POST /api/face-reviews insert error:", insertError);
      return NextResponse.json(
        { error: "후기 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    sendReviewNotification({
      fortuneType: "face_spoiler",
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
    console.error("POST /api/face-reviews error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
};
