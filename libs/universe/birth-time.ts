import { parseTimeToTimeBranch } from "@/libs/zi-wei-dou-shu";
import { TIME_BRANCHES } from "@/libs/zi-wei-dou-shu/types";

import { validationFailed } from "./errors";

import type {
  FriendCompatibilityBirthTime,
  TimeBranchValue,
} from "@/libs/zi-wei-dou-shu";

const HH_MM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * "HH:mm" 또는 "HH:mm:ss"(Postgres TIME 컬럼의 반환 형태) → "HH:mm".
 * 형식이 어긋나면 null.
 */
const normalizeClock = (value: string): string | null => {
  const normalized = value.slice(0, 5);
  return HH_MM_REGEX.test(normalized) ? normalized : null;
};

/**
 * 시각(HH:mm) → 시진(TimeBranchValue).
 *
 * 시진 경계 판정(자시가 23:00~00:59로 하루를 걸치는 규칙 포함)은 엔진의
 * `parseTimeToTimeBranch`를 그대로 쓴다. 경계 규칙을 여기에 다시 구현하면
 * 엔진이 규칙을 바꿨을 때 두 곳이 조용히 어긋난다.
 *
 * 엔진은 시진을 받지만 DB에는 사용자 원본 입력(HH:mm)을 저장한다.
 * 시진은 파생값이라 저장하지 않는다.
 */
export const toTimeBranch = (birthTime: string): TimeBranchValue => {
  const clock = normalizeClock(birthTime);

  if (!clock) {
    throw validationFailed("시간 형식이 올바르지 않습니다. (예: 16:40)");
  }

  return TIME_BRANCHES[parseTimeToTimeBranch(clock)].value;
};

/**
 * DB 저장 형태(birth_time + birth_time_unknown)를 엔진 입력으로 변환한다.
 * 시간 미상이면 "unknown"을 넘겨 엔진이 시진 12개를 전수 열거하도록 한다.
 */
export const toEngineBirthTime = (
  birthTime: string | null,
  birthTimeUnknown: boolean
): FriendCompatibilityBirthTime => {
  if (birthTimeUnknown) {
    return "unknown";
  }

  if (!birthTime) {
    // DB CHECK 제약(birth_time_unknown=false → birth_time NOT NULL)이 깨진 상태.
    // 기본 시각으로 덮으면 틀린 명궁이 연쇄되므로 드러낸다.
    // (`.claude/rules/error-handling.md` 근본 원인 우선)
    throw validationFailed("태어난 시간이 없습니다. 다시 입력해주세요.");
  }

  return toTimeBranch(birthTime);
};

/** 저장용 정규화: "HH:mm"으로 통일. 시간 미상이면 null */
export const normalizeBirthTimeForStorage = (
  birthTime: string | undefined,
  birthTimeUnknown: boolean
): string | null => {
  if (birthTimeUnknown) {
    return null;
  }

  const clock = birthTime ? normalizeClock(birthTime) : null;

  if (!clock) {
    throw validationFailed(
      "태어난 시간을 입력하거나 '시간 모름'을 선택해주세요."
    );
  }

  return clock;
};
