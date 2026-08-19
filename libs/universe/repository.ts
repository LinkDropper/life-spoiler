import { createServerClient } from "@/libs/supabase";

import { universeNotFound } from "./errors";
import { resolveOneLinerKo } from "./one-liner";
import { writableTable } from "./supabase-write";

import type { UniverseGuestDto } from "./types";
import type { CalendarType, Gender } from "@/libs/supabase/types";
import type {
  FriendCompatibilityConfidence,
  FriendCompatibilityFactor,
  FriendCompatibilityResult,
} from "@/libs/zi-wei-dou-shu";

/**
 * 친구 우주 궁합 DB 접근 계층.
 *
 * **개인정보 방어선 1겹째**: 조회 컬럼을 항상 명시한다. `SELECT *` 금지.
 * 공개 응답 경로에서는 birth_* / gender / creator_ip_hash 를 아예 메모리로 가져오지
 * 않으므로, 직렬화 단계에서 실수로 빠뜨려도 유출될 값 자체가 존재하지 않는다.
 * 계산이 필요한 경로에서만 `*_CALC_COLUMNS`로 별도 조회하며 그 결과는 직렬화하지 않는다.
 *
 * 방어선 2겹째는 `libs/universe/types.ts`의 DTO 컴파일 타임 가드다.
 */

/**
 * 공개 응답 경로.
 *
 * `id`는 FK 조회용, `birth_time_unknown`은 우주 단위 confidence 파생 전용이며
 * **둘 다 DTO로 직렬화하지 않는다.** 생년월일/생시 원본은 여기에 없다.
 */
const UNIVERSE_PUBLIC_COLUMNS =
  "id, public_id, owner_name, guest_count, birth_time_unknown, owner_one_liner_id";

/**
 * 계산 전용 — 민감 컬럼 포함. 직렬화 금지.
 * `gender`는 DTO에 절대 나가지 않지만 owner 한줄평 엔진 입력(`OwnerOneLinerPerson.gender`)이
 * 필수로 요구해 함께 조회한다.
 */
const UNIVERSE_CALC_COLUMNS =
  "id, guest_count, birth_date, birth_time, birth_time_unknown, calendar_type, is_leap_month, gender";

/**
 * 공개 응답 경로 — 민감 컬럼 없음. 좌표/점수는 개인정보가 아니라 포함 가능.
 * `factors`는 점수 산출 근거 breakdown(label/detail/delta)이며 이름·생년월일 등
 * 개인정보를 담지 않는 순수 계산 결과라 목록 조회 응답에도 포함한다(드로어 상세용).
 */
const GUEST_PUBLIC_COLUMNS =
  "star_seed, guest_name, score, tier, one_liner_id, confidence, pos_x_ratio, pos_y_ratio, factors";

/** 배치 계산 전용 — 좌표/점수만. 이름·생년월일 등 개인정보는 포함하지 않는다 */
const GUEST_PLACEMENT_COLUMNS = "score, pos_x_ratio, pos_y_ratio";

/** 계정 소유 우주 조회 전용 — public_id는 이미 공개 식별자라 DTO 개인정보 가드 대상이 아니다 */
const UNIVERSE_OWNER_LOOKUP_COLUMNS = "public_id";

interface UniversePublicRow {
  id: string;
  public_id: string;
  owner_name: string | null;
  guest_count: number;
  /** confidence 파생 전용 — 이 원본 boolean은 DTO로 나가지 않는다 */
  birth_time_unknown: boolean;
  /** null이면 컬럼 추가 이전 우주 — service 레이어가 지연 산출로 채운다 */
  owner_one_liner_id: string | null;
}

interface UniverseCalcQueryRow {
  id: string;
  guest_count: number;
  birth_date: string;
  birth_time: string | null;
  birth_time_unknown: boolean;
  calendar_type: CalendarType;
  is_leap_month: boolean;
  gender: Gender;
}

interface GuestPublicRow {
  star_seed: string;
  guest_name: string;
  score: number;
  tier: string;
  one_liner_id: string;
  confidence: string;
  pos_x_ratio: number;
  pos_y_ratio: number;
  /** jsonb 컬럼. 저장 시 엔진 결과(camelCase)를 그대로 넣었으므로 변환 없이 읽힌다 */
  factors: FriendCompatibilityFactor[];
}

interface GuestPlacementRow {
  score: number;
  pos_x_ratio: number;
  pos_y_ratio: number;
}

/** 배치 계산용 기존 별 컨텍스트 (점수 + 좌표) */
export interface GuestPlacementContext {
  score: number;
  posXRatio: number;
  posYRatio: number;
}

export interface UniverseCalcRow {
  id: string;
  guestCount: number;
  birthDate: string;
  birthTime: string | null;
  birthTimeUnknown: boolean;
  calendarType: CalendarType;
  isLeapMonth: boolean;
  gender: Gender;
}

/**
 * `findUniverseForDisplay` 내부 반환 타입 — 최종 `UniverseOwnerSummaryDto`보다 느슨하다.
 * `ownerOneLinerId`가 null일 수 있다는 점이 유일한 차이이며, service 레이어가 지연 산출로
 * 채운 뒤에야 DTO로 승격된다.
 */
export interface UniverseOwnerSummaryRaw {
  ownerName: string | null;
  guestCount: number;
  confidence: FriendCompatibilityConfidence;
  ownerOneLinerId: string | null;
}

export interface UniverseInsertParams {
  publicId: string;
  ownerName: string | null;
  birthDate: string;
  birthTime: string | null;
  birthTimeUnknown: boolean;
  calendarType: CalendarType;
  isLeapMonth: boolean;
  gender: Gender;
  ownerTokenHash: string;
  creatorIpHash: string | null;
  /** 우주 생성 시점에 산출한 owner 한줄평 스냅샷 */
  ownerOneLinerId: string;
  ownerOneLinerVersion: string;
  /** 생성 시점에 로그인 상태였다면 그 계정 id, 아니면 null(추후 로그인 시 귀속 가능) */
  userId: string | null;
}

export interface GuestUpsertParams {
  universeId: string;
  starSeed: string;
  name: string;
  birthDate: string;
  birthTime: string | null;
  birthTimeUnknown: boolean;
  calendarType: CalendarType;
  isLeapMonth: boolean;
  creatorIpHash: string | null;
  result: FriendCompatibilityResult;
  /** 등록 시점에 서버가 산출한 좌표. 재제출(업서트) 시에는 무시되고 기존 좌표가 유지된다 */
  posXRatio: number;
  posYRatio: number;
}

const toGuestDto = (row: GuestPublicRow): UniverseGuestDto => ({
  starSeed: row.star_seed,
  name: row.guest_name,
  score: row.score,
  tier: row.tier,
  oneLinerId: row.one_liner_id,
  oneLinerKo: resolveOneLinerKo(row.one_liner_id),
  confidence: row.confidence === "estimated" ? "estimated" : "exact",
  posXRatio: row.pos_x_ratio,
  posYRatio: row.pos_y_ratio,
  factors: row.factors,
});

/** 우주 내 기존 별들의 좌표/점수 (좌표 배치 계산용, 개인정보 없음) */
export const findGuestPlacementContext = async (
  universeId: string
): Promise<GuestPlacementContext[]> => {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("universe_guests")
    .select(GUEST_PLACEMENT_COLUMNS)
    .eq("universe_id", universeId)
    .returns<GuestPlacementRow[]>();

  if (error) {
    throw new Error(`별 배치 조회에 실패했습니다: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    score: row.score,
    posXRatio: row.pos_x_ratio,
    posYRatio: row.pos_y_ratio,
  }));
};

/** 공개 조회: owner 요약(한줄평 미백필 가능) + 친구 목록(점수 내림차순, 동점은 등록 순) */
export const findUniverseForDisplay = async (
  publicId: string
): Promise<{
  universeId: string;
  ownerSummary: UniverseOwnerSummaryRaw;
  guests: UniverseGuestDto[];
}> => {
  const supabase = createServerClient();

  const { data: universe, error } = await supabase
    .from("universes")
    .select(UNIVERSE_PUBLIC_COLUMNS)
    .eq("public_id", publicId)
    .maybeSingle<UniversePublicRow>();

  if (error) {
    throw new Error(`우주 조회에 실패했습니다: ${error.message}`);
  }

  if (!universe) {
    throw universeNotFound();
  }

  const { data: guestRows, error: guestError } = await supabase
    .from("universe_guests")
    .select(GUEST_PUBLIC_COLUMNS)
    .eq("universe_id", universe.id)
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .returns<GuestPublicRow[]>();

  if (guestError) {
    throw new Error(`친구 목록 조회에 실패했습니다: ${guestError.message}`);
  }

  return {
    universeId: universe.id,
    ownerSummary: {
      ownerName: universe.owner_name,
      guestCount: universe.guest_count,
      // 원본 boolean은 여기서 즉시 결과 성격(confidence)으로 환원하고 버린다
      confidence: universe.birth_time_unknown ? "estimated" : "exact",
      ownerOneLinerId: universe.owner_one_liner_id,
    },
    guests: (guestRows ?? []).map(toGuestDto),
  };
};

/** 계산용 owner 명반 조회 (민감 컬럼 포함 — 직렬화 금지) */
export const findUniverseForCalculation = async (
  publicId: string
): Promise<UniverseCalcRow> => {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("universes")
    .select(UNIVERSE_CALC_COLUMNS)
    .eq("public_id", publicId)
    .maybeSingle<UniverseCalcQueryRow>();

  if (error) {
    throw new Error(`우주 조회에 실패했습니다: ${error.message}`);
  }

  if (!data) {
    throw universeNotFound();
  }

  return {
    id: data.id,
    guestCount: data.guest_count,
    birthDate: data.birth_date,
    birthTime: data.birth_time,
    birthTimeUnknown: data.birth_time_unknown,
    calendarType: data.calendar_type,
    isLeapMonth: data.is_leap_month,
    gender: data.gender,
  };
};

export const insertUniverse = async (
  params: UniverseInsertParams
): Promise<void> => {
  const supabase = createServerClient();

  const { error } = await writableTable(supabase, "universes").insert({
    public_id: params.publicId,
    owner_name: params.ownerName,
    birth_date: params.birthDate,
    birth_time: params.birthTime,
    birth_time_unknown: params.birthTimeUnknown,
    calendar_type: params.calendarType,
    is_leap_month: params.isLeapMonth,
    gender: params.gender,
    owner_token_hash: params.ownerTokenHash,
    creator_ip_hash: params.creatorIpHash,
    owner_one_liner_id: params.ownerOneLinerId,
    owner_one_liner_version: params.ownerOneLinerVersion,
    user_id: params.userId,
  });

  if (error) {
    throw new Error(`우주 생성에 실패했습니다: ${error.message}`);
  }
};

/**
 * owner 토큰 소유자를 계정에 귀속시킨다.
 *
 * `user_id IS NULL` 조건으로 이미 귀속된 우주는 덮어쓰지 않는다. 매칭되는 행이 없어도
 * (쿠키가 없거나 만료됐거나 이미 귀속된 경우) 정상 케이스이므로 에러가 아니다.
 */
export const claimUniverseOwner = async (
  userId: string,
  ownerTokenHash: string
): Promise<void> => {
  const supabase = createServerClient();

  const { error } = await writableTable(supabase, "universes")
    .update({ user_id: userId })
    .eq("owner_token_hash", ownerTokenHash)
    .is("user_id", null);

  if (error) {
    throw new Error(`우주 계정 귀속에 실패했습니다: ${error.message}`);
  }
};

/**
 * owner 한줄평 지연 산출(자가 치유) 결과 저장.
 *
 * 컬럼 추가 이전에 생성된 우주는 조회 시점에 계산해 이 함수로 채운다.
 * 순수 함수라 동시에 여러 요청이 같은 값을 계산해도 결과가 항상 같으므로,
 * 경쟁 조건을 막는 조건부 UPDATE 없이 단순 UPDATE로 충분하다.
 */
export const saveOwnerOneLiner = async (
  universeId: string,
  ownerOneLinerId: string,
  ownerOneLinerVersion: string
): Promise<void> => {
  const supabase = createServerClient();

  const { error } = await writableTable(supabase, "universes")
    .update({
      owner_one_liner_id: ownerOneLinerId,
      owner_one_liner_version: ownerOneLinerVersion,
    })
    .eq("id", universeId);

  if (error) {
    throw new Error(`owner 한줄평 저장에 실패했습니다: ${error.message}`);
  }
};

/** Postgres 유니크 제약 위반 */
const UNIQUE_VIOLATION = "23505";

/**
 * 친구 별 등록 (E1 업서트).
 *
 * dedupe 유니크 인덱스가 `lower(btrim(guest_name))` 같은 **표현식 인덱스**라
 * PostgREST의 `on_conflict`(컬럼명 기반)로는 지정할 수 없다.
 * 그래서 "일단 INSERT → 23505면 기존 행을 찾아 UPDATE" 순서로 처리한다.
 * 정상 경로가 1쿼리이고 충돌은 재제출 시에만 발생하므로 비용이 낮다.
 */
export const upsertGuest = async (
  params: GuestUpsertParams
): Promise<{
  starSeed: string;
  isDuplicate: boolean;
  posXRatio: number;
  posYRatio: number;
}> => {
  const supabase = createServerClient();

  const snapshot = {
    score: params.result.score,
    tier: params.result.tier,
    one_liner_id: params.result.oneLinerId,
    factors: params.result.factors,
    matrix_version: params.result.matrixVersion,
    confidence: params.result.confidence,
    chart_combinations: params.result.chartCombinations,
    calculated_at: new Date().toISOString(),
  };

  const { error } = await writableTable(supabase, "universe_guests").insert({
    universe_id: params.universeId,
    star_seed: params.starSeed,
    guest_name: params.name,
    birth_date: params.birthDate,
    birth_time: params.birthTime,
    birth_time_unknown: params.birthTimeUnknown,
    calendar_type: params.calendarType,
    is_leap_month: params.isLeapMonth,
    creator_ip_hash: params.creatorIpHash,
    pos_x_ratio: params.posXRatio,
    pos_y_ratio: params.posYRatio,
    ...snapshot,
  });

  if (!error) {
    return {
      starSeed: params.starSeed,
      isDuplicate: false,
      posXRatio: params.posXRatio,
      posYRatio: params.posYRatio,
    };
  }

  if (error.code !== UNIQUE_VIOLATION) {
    throw new Error(`별 등록에 실패했습니다: ${error.message}`);
  }

  // 동일 조합 재제출 — 기존 행을 최신 매트릭스 기준으로 갱신하고 기존 star_seed/좌표를 유지한다.
  // (시드나 좌표가 바뀌면 별이 튀므로 update 대상(snapshot)에 두 값 모두 포함하지 않는다)
  const existing = await findExistingGuest(params);

  const { error: updateError } = await writableTable(
    supabase,
    "universe_guests"
  )
    .update(snapshot)
    .eq("star_seed", existing.starSeed);

  if (updateError) {
    throw new Error(`별 갱신에 실패했습니다: ${updateError.message}`);
  }

  return {
    starSeed: existing.starSeed,
    isDuplicate: true,
    posXRatio: existing.posXRatio,
    posYRatio: existing.posYRatio,
  };
};

const findExistingGuest = async (
  params: GuestUpsertParams
): Promise<{ starSeed: string; posXRatio: number; posYRatio: number }> => {
  const supabase = createServerClient();

  const baseQuery = supabase
    .from("universe_guests")
    .select("star_seed, pos_x_ratio, pos_y_ratio")
    .eq("universe_id", params.universeId)
    // DB 인덱스가 lower(btrim(...))로 정규화하므로 대소문자 무시 비교를 쓴다
    .ilike("guest_name", params.name)
    .eq("birth_date", params.birthDate)
    .eq("birth_time_unknown", params.birthTimeUnknown)
    .eq("calendar_type", params.calendarType)
    .eq("is_leap_month", params.isLeapMonth);

  const query = params.birthTime
    ? baseQuery.eq("birth_time", params.birthTime)
    : baseQuery.is("birth_time", null);

  const { data, error } = await query.maybeSingle<{
    star_seed: string;
    pos_x_ratio: number;
    pos_y_ratio: number;
  }>();

  if (error) {
    throw new Error(`기존 별 조회에 실패했습니다: ${error.message}`);
  }

  if (!data) {
    // 유니크 위반이 났는데 같은 조건으로 찾지 못한 상태.
    // 조용히 새 행을 만들면 중복 별이 생기므로 드러낸다.
    throw new Error("이미 등록된 별을 찾지 못했습니다. 다시 시도해주세요.");
  }

  return {
    starSeed: data.star_seed,
    posXRatio: data.pos_x_ratio,
    posYRatio: data.pos_y_ratio,
  };
};

/** 계정이 소유한 가장 최근 우주의 public_id (없으면 null) */
export const findUniverseByOwnerUserId = async (
  userId: string
): Promise<string | null> => {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("universes")
    .select(UNIVERSE_OWNER_LOOKUP_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ public_id: string }>();

  if (error) {
    throw new Error(`소유 우주 조회에 실패했습니다: ${error.message}`);
  }

  return data?.public_id ?? null;
};

/** IP당 최근 N시간 우주 생성 건수 */
export const countRecentUniversesByIp = async (
  creatorIpHash: string,
  sinceIso: string
): Promise<number> => {
  const supabase = createServerClient();

  const { count, error } = await supabase
    .from("universes")
    .select("*", { count: "exact", head: true })
    .eq("creator_ip_hash", creatorIpHash)
    .gte("created_at", sinceIso);

  if (error) {
    throw new Error(`생성 이력 조회에 실패했습니다: ${error.message}`);
  }

  return count ?? 0;
};

/** IP당 최근 N시간 친구 등록 건수 (우주 전체 합산) */
export const countRecentGuestsByIp = async (
  creatorIpHash: string,
  sinceIso: string
): Promise<number> => {
  const supabase = createServerClient();

  const { count, error } = await supabase
    .from("universe_guests")
    .select("*", { count: "exact", head: true })
    .eq("creator_ip_hash", creatorIpHash)
    .gte("created_at", sinceIso);

  if (error) {
    throw new Error(`등록 이력 조회에 실패했습니다: ${error.message}`);
  }

  return count ?? 0;
};

/**
 * 이 우주가 전체 우주 중 별(친구) 개수로 몇 번째인지.
 *
 * "나보다 별이 많은 우주 수 + 1"로 계산한다 — 동점자는 같은 순위를 공유하는
 * 표준 경쟁 순위(예: 5명이 공동 1위면 다음은 2위가 아니라 6위)다. 별도 정렬
 * 컬럼/인덱스 없이 COUNT 쿼리 하나로 끝나며, 이 기능 규모(방문자 적음)에서는
 * `guest_count`에 인덱스가 없어도 성능 문제가 되지 않는다.
 */
export const findGuestCountRank = async (
  guestCount: number
): Promise<number> => {
  const supabase = createServerClient();

  const { count, error } = await supabase
    .from("universes")
    .select("*", { count: "exact", head: true })
    .gt("guest_count", guestCount);

  if (error) {
    throw new Error(`순위 조회에 실패했습니다: ${error.message}`);
  }

  return (count ?? 0) + 1;
};

/**
 * 마지막 조회 시각 스로틀 갱신.
 * 매 조회마다 UPDATE하면 쓰기가 증폭되므로 1시간이 지난 경우에만 갱신한다.
 */
export const touchLastViewedAt = async (publicId: string): Promise<void> => {
  const supabase = createServerClient();
  const now = new Date();
  const threshold = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

  await writableTable(supabase, "universes")
    .update({ last_viewed_at: now.toISOString() })
    .eq("public_id", publicId)
    .or(`last_viewed_at.is.null,last_viewed_at.lt.${threshold}`);
};
