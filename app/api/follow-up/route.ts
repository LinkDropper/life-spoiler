import { NextResponse } from "next/server";

import { AIError } from "@/libs/services/ai/errors";
import { generateFollowUpAnswer } from "@/libs/services/ai/follow-up-interpreter";
import { createAuthClient } from "@/libs/supabase";

import type {
  FollowUpFortuneType,
  FollowUpQuestionInsert,
  FollowUpQuestionRow,
} from "@/libs/supabase/types";

// ============================================================
// 설정
// ============================================================

const VALID_FORTUNE_TYPES: ReadonlySet<FollowUpFortuneType> = new Set([
  "lifetime",
  "yearly",
  "past_life",
  "compatibility",
]);

const MIN_QUESTION_LENGTH = 2;
const MAX_QUESTION_LENGTH = 200;
const FREE_QUESTION_LIMIT = 3;
const RATE_LIMIT_SECONDS = 10;
const HISTORY_LIMIT = 6; // 최근 Q&A 6개(=3회+3회 이력 여유)만 프롬프트에 포함

// ============================================================
// 공통 유틸
// ============================================================

interface ResolvedTarget {
  fortuneId: string | null;
  pairId: string | null;
  fortuneResult: unknown;
  birthDate: string;
  currentAge: number;
}

/**
 * 한국 시간(KST) 기준 오늘 날짜를 "YYYY-MM-DD" 형식으로 반환.
 * 서버가 UTC로 동작해도 KST 기준으로 정확히 계산한다.
 */
const getTodayKst = (): string =>
  new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });

/**
 * 만 나이 계산 (KST 기준)
 * birth_date("YYYY-MM-DD")와 오늘 KST 날짜를 문자열로 직접 비교해
 * 타임존 오프셋으로 인한 오차를 제거한다.
 */
const calculateAge = (birthDate: string): number => {
  const [by, bm, bd] = birthDate.split("-").map(Number);
  const [ty, tm, td] = getTodayKst().split("-").map(Number);

  if (!by || !bm || !bd || !ty || !tm || !td) {
    return 0;
  }

  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) {
    age -= 1;
  }
  return Math.max(0, age);
};

/**
 * profileId/fortuneType/pairId 기반으로 대상 운세 레코드 확인
 * - 본인 프로필 소유권 검증
 * - 결제 완료(paid_at) 확인
 * - 운세 결과 JSON 및 사용자 나이 반환
 */
const resolveTarget = async (params: {
  supabase: Awaited<ReturnType<typeof createAuthClient>>;
  authUserId: string;
  profileId: string;
  fortuneType: FollowUpFortuneType;
  pairId: string | null;
}): Promise<
  | { ok: true; target: ResolvedTarget }
  | { ok: false; status: number; error: string }
> => {
  const { supabase, authUserId, profileId, fortuneType, pairId } = params;

  // 1) 프로필 소유권 + 생년월일
  const { data: profile, error: profileError } =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("profiles") as any)
      .select("id, birth_date")
      .eq("id", profileId)
      .eq("user_id", authUserId)
      .maybeSingle();

  if (profileError || !profile || !profile.birth_date) {
    return { ok: false, status: 404, error: "프로필을 찾을 수 없습니다." };
  }

  const birthDate: string = profile.birth_date;
  const currentAge = calculateAge(birthDate);

  // 2) 결제 완료된 운세 레코드 조회
  if (fortuneType === "compatibility") {
    if (!pairId) {
      return {
        ok: false,
        status: 400,
        error: "궁합 질문에는 pairId가 필요합니다.",
      };
    }

    const { data: pair, error: pairError } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("compatibility_pairs") as any)
        .select("id, user_id, profile_a_id, profile_b_id, paid_at, result")
        .eq("id", pairId)
        .eq("user_id", authUserId)
        .not("paid_at", "is", null)
        .maybeSingle();

    if (pairError || !pair) {
      return {
        ok: false,
        status: 403,
        error: "해당 궁합 결과를 이용할 수 없습니다.",
      };
    }

    // 페어가 이 프로필을 포함하는지 확인
    if (pair.profile_a_id !== profileId && pair.profile_b_id !== profileId) {
      return {
        ok: false,
        status: 403,
        error: "해당 궁합 결과와 프로필이 일치하지 않습니다.",
      };
    }

    if (!pair.result) {
      return {
        ok: false,
        status: 404,
        error: "궁합 결과를 찾을 수 없습니다.",
      };
    }

    return {
      ok: true,
      target: {
        fortuneId: null,
        pairId: pair.id,
        fortuneResult: pair.result,
        birthDate,
        currentAge,
      },
    };
  }

  // lifetime / yearly / past_life
  const { data: fortune, error: fortuneError } =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("fortunes") as any)
      .select("id, result, paid_at, created_at")
      .eq("profile_id", profileId)
      .eq("fortune_type", fortuneType)
      .not("paid_at", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (fortuneError || !fortune) {
    return {
      ok: false,
      status: 403,
      error: "해당 운세를 이용한 이력이 없습니다.",
    };
  }

  return {
    ok: true,
    target: {
      fortuneId: fortune.id,
      pairId: null,
      fortuneResult: fortune.result,
      birthDate,
      currentAge,
    },
  };
};

/**
 * 해당 fortune/pair에 대한 무료 질문 카운트 조회
 * (is_relevant = true AND is_paid = false 인 것만 카운트)
 */
const countFreeUsed = async (params: {
  supabase: Awaited<ReturnType<typeof createAuthClient>>;
  fortuneId: string | null;
  pairId: string | null;
}): Promise<number> => {
  const { supabase, fortuneId, pairId } = params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("follow_up_questions") as any)
    .select("id", { count: "exact", head: true })
    .eq("is_relevant", true)
    .eq("is_paid", false);

  if (fortuneId) {
    query = query.eq("fortune_id", fortuneId);
  } else if (pairId) {
    query = query.eq("pair_id", pairId);
  }

  const { count } = await query;
  return count ?? 0;
};

/**
 * 해당 fortune/pair의 최근 Q&A 이력 조회 (시간순 오름차순)
 */
const fetchHistory = async (params: {
  supabase: Awaited<ReturnType<typeof createAuthClient>>;
  fortuneId: string | null;
  pairId: string | null;
  limit: number;
}): Promise<FollowUpQuestionRow[]> => {
  const { supabase, fortuneId, pairId, limit } = params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("follow_up_questions") as any)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (fortuneId) {
    query = query.eq("fortune_id", fortuneId);
  } else if (pairId) {
    query = query.eq("pair_id", pairId);
  }

  const { data } = await query;
  const rows = (data ?? []) as FollowUpQuestionRow[];
  return rows.reverse();
};

// ============================================================
// GET /api/follow-up — 이력 + 남은 횟수 조회
// ============================================================

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
    const fortuneType = searchParams.get(
      "fortuneType"
    ) as FollowUpFortuneType | null;
    const pairId = searchParams.get("pairId");

    if (!profileId || !fortuneType) {
      return NextResponse.json(
        { error: "profileId와 fortuneType이 필요합니다." },
        { status: 400 }
      );
    }

    if (!VALID_FORTUNE_TYPES.has(fortuneType)) {
      return NextResponse.json(
        { error: "유효하지 않은 운세 타입입니다." },
        { status: 400 }
      );
    }

    const resolved = await resolveTarget({
      supabase,
      authUserId: authUser.id,
      profileId,
      fortuneType,
      pairId,
    });

    if (!resolved.ok) {
      return NextResponse.json(
        { error: resolved.error },
        { status: resolved.status }
      );
    }

    const { fortuneId, pairId: resolvedPairId } = resolved.target;

    const [history, used] = await Promise.all([
      fetchHistory({
        supabase,
        fortuneId,
        pairId: resolvedPairId,
        limit: HISTORY_LIMIT,
      }),
      countFreeUsed({ supabase, fortuneId, pairId: resolvedPairId }),
    ]);

    const remaining = Math.max(0, FREE_QUESTION_LIMIT - used);

    return NextResponse.json({
      history: history.map((h) => ({
        id: h.id,
        question: h.question,
        answer: h.answer,
        isRelevant: h.is_relevant,
        createdAt: h.created_at,
      })),
      remaining,
      limit: FREE_QUESTION_LIMIT,
    });
  } catch (error) {
    console.error("GET /api/follow-up error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
};

// ============================================================
// POST /api/follow-up — 질문 생성
// ============================================================

interface FollowUpCreateRequest {
  profileId: string;
  fortuneType: string;
  pairId?: string | null;
  question: string;
}

const validateRequest = (body: FollowUpCreateRequest): string | null => {
  const { profileId, fortuneType, question } = body;

  if (!profileId || typeof profileId !== "string") {
    return "프로필 ID가 필요합니다.";
  }

  if (!VALID_FORTUNE_TYPES.has(fortuneType as FollowUpFortuneType)) {
    return "유효하지 않은 운세 타입입니다.";
  }

  if (!question || typeof question !== "string") {
    return "질문 내용이 필요합니다.";
  }

  const trimmed = question.trim().length;

  if (trimmed < MIN_QUESTION_LENGTH) {
    return `질문은 최소 ${MIN_QUESTION_LENGTH}자 이상이어야 합니다.`;
  }

  if (trimmed > MAX_QUESTION_LENGTH) {
    return `질문은 최대 ${MAX_QUESTION_LENGTH}자까지 입력할 수 있습니다.`;
  }

  return null;
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

    const body: FollowUpCreateRequest = await request.json();
    const validationError = validateRequest(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { profileId, question } = body;
    const fortuneType = body.fortuneType as FollowUpFortuneType;
    const pairId = body.pairId ?? null;
    const trimmedQuestion = question.trim();

    const resolved = await resolveTarget({
      supabase,
      authUserId: authUser.id,
      profileId,
      fortuneType,
      pairId,
    });

    if (!resolved.ok) {
      return NextResponse.json(
        { error: resolved.error },
        { status: resolved.status }
      );
    }

    const {
      fortuneId,
      pairId: resolvedPairId,
      fortuneResult,
      birthDate,
      currentAge,
    } = resolved.target;

    // Rate limit — 최근 60초 내 요청 여부
    const rateLimitCutoff = new Date(
      Date.now() - RATE_LIMIT_SECONDS * 1000
    ).toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rateLimitQuery = (supabase.from("follow_up_questions") as any)
      .select("created_at")
      .eq("profile_id", profileId)
      .eq("fortune_type", fortuneType)
      .gte("created_at", rateLimitCutoff)
      .order("created_at", { ascending: false })
      .limit(1);

    if (fortuneId) {
      rateLimitQuery = rateLimitQuery.eq("fortune_id", fortuneId);
    } else if (resolvedPairId) {
      rateLimitQuery = rateLimitQuery.eq("pair_id", resolvedPairId);
    }

    const { data: recentRows } = await rateLimitQuery;
    const recent = (recentRows ?? []) as { created_at: string }[];

    if (recent.length > 0) {
      const lastMs = new Date(recent[0].created_at).getTime();
      const retryAfterSec = Math.max(
        1,
        Math.ceil((lastMs + RATE_LIMIT_SECONDS * 1000 - Date.now()) / 1000)
      );
      return NextResponse.json(
        {
          error: "잠시 후 다시 질문해주세요.",
          code: "RATE_LIMITED",
          retryAfter: retryAfterSec,
        },
        { status: 429 }
      );
    }

    // 무료 카운트 확인
    const used = await countFreeUsed({
      supabase,
      fortuneId,
      pairId: resolvedPairId,
    });

    if (used >= FREE_QUESTION_LIMIT) {
      return NextResponse.json(
        {
          error: "무료 질문 횟수를 모두 사용했어요.",
          code: "FREE_LIMIT_EXCEEDED",
        },
        { status: 403 }
      );
    }

    // 최근 이력 조회 (프롬프트 컨텍스트용)
    const historyRows = await fetchHistory({
      supabase,
      fortuneId,
      pairId: resolvedPairId,
      limit: HISTORY_LIMIT,
    });

    // LLM 호출 (LIFE_SPOILER_LLM_PROVIDER)
    const todayDate = getTodayKst();

    let answer: string;
    let isRelevant: boolean;
    try {
      const result = await generateFollowUpAnswer({
        fortuneType,
        fortuneResult,
        userContext: {
          currentAge,
          birthDate,
          todayDate,
        },
        history: historyRows.map((h) => ({
          question: h.question,
          answer: h.answer,
        })),
        question: trimmedQuestion,
      });
      ({ answer, isRelevant } = result);
    } catch (error) {
      if (error instanceof AIError) {
        console.error("Follow-up AIError:", error.code, error.message);
      } else {
        console.error("Follow-up unknown error:", error);
      }
      return NextResponse.json(
        { error: "답변을 가져오지 못했어요. 잠시 후 다시 시도해주세요." },
        { status: 502 }
      );
    }

    // DB 저장
    const insertData: FollowUpQuestionInsert = {
      profile_id: profileId,
      fortune_type: fortuneType,
      fortune_id: fortuneId,
      pair_id: resolvedPairId,
      question: trimmedQuestion,
      answer,
      is_relevant: isRelevant,
      is_paid: false,
    };

    const { data: inserted, error: insertError } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("follow_up_questions") as any)
        .insert(insertData)
        .select("id, created_at")
        .single();

    if (insertError || !inserted) {
      console.error("Follow-up insert error:", insertError);
      return NextResponse.json(
        { error: "답변 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    // 관련 없는 질문이면 카운트 차감 안 함 (is_relevant=false로 이미 저장됨)
    const newUsed = isRelevant ? used + 1 : used;
    const remaining = Math.max(0, FREE_QUESTION_LIMIT - newUsed);

    return NextResponse.json({
      id: inserted.id,
      question: trimmedQuestion,
      answer,
      isRelevant,
      remaining,
      createdAt: inserted.created_at,
    });
  } catch (error) {
    console.error("POST /api/follow-up error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
};
