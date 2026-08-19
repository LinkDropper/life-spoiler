import {
  calculateFriendCompatibility,
  calculateOwnerOneLiner,
  ZiWeiError,
} from "@/libs/zi-wei-dou-shu";

import { normalizeBirthTimeForStorage, toEngineBirthTime } from "./birth-time";
import {
  GUEST_LIMIT_PER_UNIVERSE,
  GUEST_SUBMIT_LIMIT_PER_HOUR,
  UNIVERSE_CREATE_LIMIT_PER_DAY,
} from "./constants";
import { calculationFailed, rateLimited, universeFull } from "./errors";
import {
  generateOwnerToken,
  generatePublicId,
  generateStarSeed,
  hashOwnerToken,
} from "./identity";
import { resolveOneLinerKo, resolveOwnerOneLinerKo } from "./one-liner";
import { computeGuestPlacement } from "./placement";
import {
  countRecentGuestsByIp,
  countRecentUniversesByIp,
  findGuestCountRank,
  findGuestPlacementContext,
  findUniverseForCalculation,
  findUniverseForDisplay,
  insertUniverse,
  saveOwnerOneLiner,
  touchLastViewedAt,
  upsertGuest,
} from "./repository";

import type { GuestSubmitInput, UniverseCreateInput } from "./validation";
import type { GuestSubmitResultDto, UniverseDetailDto } from "./types";
import type {
  FriendCompatibilityPerson,
  OwnerOneLinerPerson,
  OwnerOneLinerResult,
} from "@/libs/zi-wei-dou-shu";

const hoursAgoIso = (hours: number): string =>
  new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

/**
 * 우주 생성.
 *
 * rate limit은 인메모리가 아니라 DB 카운트 슬라이딩 윈도우로 판정한다.
 * Vercel 서버리스는 인스턴스마다 메모리가 리셋되어 인메모리 카운터를 신뢰할 수 없다.
 */
export const createUniverse = async (
  input: UniverseCreateInput,
  creatorIpHash: string | null
): Promise<{ publicId: string; ownerToken: string }> => {
  if (creatorIpHash) {
    const recentCount = await countRecentUniversesByIp(
      creatorIpHash,
      hoursAgoIso(24)
    );

    if (recentCount >= UNIVERSE_CREATE_LIMIT_PER_DAY) {
      throw rateLimited();
    }
  }

  const publicId = generatePublicId();
  const ownerToken = generateOwnerToken();
  const birthTime = normalizeBirthTimeForStorage(
    input.birthTime,
    input.birthTimeUnknown
  );

  // owner 한줄평은 생성 시점에 산출해 스냅샷으로 저장한다(조회마다 재계산하지 않음).
  const ownerOneLiner = runOwnerOneLinerCalculation({
    birthDate: input.birthDate,
    birthTime: toEngineBirthTime(birthTime, input.birthTimeUnknown),
    calendarType: input.calendarType,
    isLeapMonth: input.isLeapMonth,
    gender: input.gender,
  });

  await insertUniverse({
    publicId,
    ownerName: input.ownerName ?? null,
    birthDate: input.birthDate,
    birthTime,
    birthTimeUnknown: input.birthTimeUnknown,
    calendarType: input.calendarType,
    isLeapMonth: input.isLeapMonth,
    gender: input.gender,
    ownerTokenHash: hashOwnerToken(ownerToken),
    creatorIpHash,
    ownerOneLinerId: ownerOneLiner.oneLinerId,
    ownerOneLinerVersion: ownerOneLiner.matrixVersion,
  });

  return { publicId, ownerToken };
};

export const getUniverseDetail = async (
  publicId: string
): Promise<UniverseDetailDto> => {
  const { universeId, ownerSummary, guests } =
    await findUniverseForDisplay(publicId);

  // 부가 정보이므로 실패해도 조회를 막지 않는다.
  void touchLastViewedAt(publicId).catch(() => undefined);

  const ownerOneLiner = await resolveOwnerOneLiner(
    publicId,
    universeId,
    ownerSummary.ownerOneLinerId
  );

  // 별을 하나라도 보유한 우주만 순위를 매긴다("별을 하나라도 추가한 사람이라면").
  // 0명인 우주까지 순위를 매기면 사실상 전체 우주 개수 안내가 되어 의미가 없다.
  const guestCountRank =
    ownerSummary.guestCount >= 1
      ? await findGuestCountRank(ownerSummary.guestCount)
      : null;

  return {
    publicId,
    ownerSummary: {
      ownerName: ownerSummary.ownerName,
      guestCount: ownerSummary.guestCount,
      confidence: ownerSummary.confidence,
      oneLinerId: ownerOneLiner.oneLinerId,
      oneLinerKo: ownerOneLiner.oneLinerKo,
      guestCountRank,
    },
    guests,
    guestCount: ownerSummary.guestCount,
    isFull: ownerSummary.guestCount >= GUEST_LIMIT_PER_UNIVERSE,
  };
};

/**
 * owner 한줄평 조회 — 저장된 값이 있으면 그대로 문구만 다시 조회하고,
 * 없으면(컬럼 추가 이전 우주) 지금 계산해서 반환한다.
 *
 * 계산 자체는 이번 응답을 완성하는 데 필요하므로 기다리지만, 그 결과를 DB에 남기는
 * 저장은 `touchLastViewedAt`과 동일하게 fire-and-forget으로 처리해 조회를 막지 않는다.
 * 한 번 저장된 뒤에는 이 분기를 다시 타지 않는다(다음 조회부터는 저장된 값을 그대로 씀).
 */
const resolveOwnerOneLiner = async (
  publicId: string,
  universeId: string,
  storedOneLinerId: string | null
): Promise<{ oneLinerId: string; oneLinerKo: string }> => {
  if (storedOneLinerId) {
    return {
      oneLinerId: storedOneLinerId,
      oneLinerKo: resolveOwnerOneLinerKo(storedOneLinerId),
    };
  }

  const owner = await findUniverseForCalculation(publicId);
  const result = runOwnerOneLinerCalculation({
    birthDate: owner.birthDate,
    birthTime: toEngineBirthTime(owner.birthTime, owner.birthTimeUnknown),
    calendarType: owner.calendarType,
    isLeapMonth: owner.isLeapMonth,
    gender: owner.gender,
  });

  void saveOwnerOneLiner(
    universeId,
    result.oneLinerId,
    result.matrixVersion
  ).catch(() => undefined);

  return {
    oneLinerId: result.oneLinerId,
    oneLinerKo: resolveOwnerOneLinerKo(result.oneLinerId),
  };
};

/**
 * 친구 별 등록 + 궁합 계산.
 *
 * 계산은 순수 동기 함수이며 결과를 스냅샷으로 저장한다(재계산하지 않는다).
 */
export const submitGuest = async (
  publicId: string,
  input: GuestSubmitInput,
  creatorIpHash: string | null
): Promise<GuestSubmitResultDto> => {
  const universe = await findUniverseForCalculation(publicId);

  if (universe.guestCount >= GUEST_LIMIT_PER_UNIVERSE) {
    throw universeFull();
  }

  if (creatorIpHash) {
    const recentCount = await countRecentGuestsByIp(
      creatorIpHash,
      hoursAgoIso(1)
    );

    if (recentCount >= GUEST_SUBMIT_LIMIT_PER_HOUR) {
      throw rateLimited();
    }
  }

  const guestBirthTime = normalizeBirthTimeForStorage(
    input.birthTime,
    input.birthTimeUnknown
  );

  const ownerPerson: FriendCompatibilityPerson = {
    birthDate: universe.birthDate,
    birthTime: toEngineBirthTime(universe.birthTime, universe.birthTimeUnknown),
    calendarType: universe.calendarType,
    isLeapMonth: universe.isLeapMonth,
  };

  const guestPerson: FriendCompatibilityPerson = {
    birthDate: input.birthDate,
    birthTime: toEngineBirthTime(guestBirthTime, input.birthTimeUnknown),
    calendarType: input.calendarType,
    isLeapMonth: input.isLeapMonth,
  };

  const result = runCalculation(ownerPerson, guestPerson);

  // 좌표는 등록 시점에만 산출한다. 재제출(업서트)이면 이 값은 버려지고 기존 좌표가
  // 유지된다(`upsertGuest` 참조) — 계산 자체는 가벼워 낭비해도 무해하다.
  const existingContext = await findGuestPlacementContext(universe.id);
  const existingStars = existingContext.map((guest) => ({
    xRatio: guest.posXRatio,
    yRatio: guest.posYRatio,
    score: guest.score,
  }));
  const position = computeGuestPlacement(existingStars, result.score);

  const { starSeed, isDuplicate, posXRatio, posYRatio } = await upsertGuest({
    universeId: universe.id,
    starSeed: generateStarSeed(),
    name: input.name,
    birthDate: input.birthDate,
    birthTime: guestBirthTime,
    birthTimeUnknown: input.birthTimeUnknown,
    calendarType: input.calendarType,
    isLeapMonth: input.isLeapMonth,
    creatorIpHash,
    result,
    posXRatio: position.xRatio,
    posYRatio: position.yRatio,
  });

  return {
    starSeed,
    name: input.name,
    score: result.score,
    tier: result.tier,
    oneLinerId: result.oneLinerId,
    oneLinerKo: resolveOneLinerKo(result.oneLinerId),
    confidence: result.confidence,
    factors: result.factors,
    isDuplicate,
    posXRatio,
    posYRatio,
  };
};

/**
 * 엔진 에러만 사용자용 검증 에러로 바꾼다.
 * 그 외 예외는 삼키지 않고 그대로 올려보낸다(근본 원인 은폐 금지).
 */
const runCalculation = (
  owner: FriendCompatibilityPerson,
  guest: FriendCompatibilityPerson
) => {
  try {
    return calculateFriendCompatibility(owner, guest);
  } catch (error) {
    if (error instanceof ZiWeiError) {
      throw calculationFailed();
    }
    throw error;
  }
};

/** `runCalculation`과 동일한 에러 변환 원칙을 owner 한줄평 산출에도 적용한다. */
const runOwnerOneLinerCalculation = (
  person: OwnerOneLinerPerson
): OwnerOneLinerResult => {
  try {
    return calculateOwnerOneLiner(person);
  } catch (error) {
    if (error instanceof ZiWeiError) {
      throw calculationFailed();
    }
    throw error;
  }
};
