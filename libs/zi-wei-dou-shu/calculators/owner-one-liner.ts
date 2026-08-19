import {
  BRANCH_TO_OWNER_ANIMAL,
  OWNER_ONE_LINER_MATRIX_VERSION,
  OWNER_ONE_LINERS,
  OWNER_STAR_PRIORITY,
  STEM_TO_OWNER_ELEMENT_VARIANT,
  derivePaceKey,
  buildOwnerOneLinerId,
  buildOwnerYearOneLinerId,
} from "../constants/owner-one-liner-table";
import { toBrightnessGroup } from "../constants/star-traits";
import { MAIN_STAR_NAMES, type MainStarName } from "../constants/stars";
import { generateZiweiChart } from "../core";
import { ZiWeiError } from "../errors";
import type {
  CalendarType,
  Gender,
  Palace,
  TimeBranchValue,
  ZiweiChart,
} from "../types";

import { getEffectiveMainStars } from "./empty-palace";

// ============================================================
// 공개 타입
// ============================================================

/** 시진 또는 "unknown"(태어난 시간 모름) */
export type OwnerOneLinerBirthTime = TimeBranchValue | "unknown";

/**
 * 결과 신뢰 수준.
 * - `exact`: 시진이 확정되어 명궁 주성×밝기×오행국 축을 모두 쓸 수 있음
 * - `estimated`: 시진 미상 → 시진에 의존하지 않는 연간(年干) 축으로 대체
 *   (12판 평균이 아니라 애초에 다른 축 — `constants/owner-one-liner-table.ts` 참고)
 */
export type OwnerOneLinerConfidence = "exact" | "estimated";

export interface OwnerOneLinerPerson {
  /** "YYYY-MM-DD" */
  birthDate: string;
  /** 시진 ("자" ~ "해") 또는 "unknown" */
  birthTime: OwnerOneLinerBirthTime;
  calendarType: CalendarType;
  isLeapMonth?: boolean;
  /**
   * owner의 실제 성별.
   * 현재 두 축(명궁 주성×밝기×오행국 페이스 / 연간 오행×띠) 모두 성별과 무관하다
   * (`__tests__/owner-one-liner.test.ts`에서 성별 무관성을 검증).
   * `generateZiweiChart`가 필수로 요구해 입력 형태를 맞춰 받아둔다 — 대운 등
   * 성별 의존 축을 이후 버전에서 추가할 때를 대비한 필드다.
   */
  gender: Gender;
}

export interface OwnerOneLinerResult {
  /** 한줄평 템플릿 ID (i18n 키, append-only) */
  oneLinerId: string;
  /** 한국어 한줄평 원문 */
  oneLinerKo: string;
  /** 시간 미상 여부 */
  confidence: OwnerOneLinerConfidence;
  /** 매트릭스 버전 */
  matrixVersion: string;
}

// ============================================================
// 명반 생성
// ============================================================

/** 명반 생성에만 쓰이는 자리표시자 이름 (결과에 영향 없음) */
const PLACEHOLDER_NAME = "owner";

/** 시진 미상일 때 대표 시각. 연간(年干)은 시각과 무관해 어떤 값을 넣어도 결과가 같다. */
const UNKNOWN_TIME_CLOCK = "12:00";

/**
 * 시진 → 대표 시각(HH:mm).
 * `friend-compatibility.ts`와 동일한 매핑을 이 파일에 독립적으로 둔다 — 두 계산기가
 * 서로를 참조하면 우연한 결합이 생겨, 한쪽만 바꿔야 할 변경이 다른 쪽까지 건드리게 된다.
 */
const TIME_BRANCH_TO_CLOCK: Record<TimeBranchValue, string> = {
  자: "00:00",
  축: "02:00",
  인: "04:00",
  묘: "06:00",
  진: "08:00",
  사: "10:00",
  오: "12:00",
  미: "14:00",
  신: "16:00",
  유: "18:00",
  술: "20:00",
  해: "22:00",
};

const buildChart = (person: OwnerOneLinerPerson): ZiweiChart => {
  const clock =
    person.birthTime === "unknown"
      ? UNKNOWN_TIME_CLOCK
      : TIME_BRANCH_TO_CLOCK[person.birthTime];

  if (!clock) {
    throw new ZiWeiError("출생 시진 값이 올바르지 않습니다.", {
      code: "INVALID_TIME",
      field: "birthTime",
    });
  }

  return generateZiweiChart({
    name: PLACEHOLDER_NAME,
    birthDate: person.birthDate,
    birthTime: clock,
    gender: person.gender,
    calendarType: person.calendarType,
    isLeapMonth: person.isLeapMonth ?? false,
  });
};

// ============================================================
// exact 경로 — 명궁 주성 판정
// ============================================================

const isMainStarName = (name: string): name is MainStarName =>
  (MAIN_STAR_NAMES as readonly string[]).includes(name);

const findPalace = (chart: ZiweiChart, palaceName: string): Palace => {
  const palace = chart.palaces.find((p) => p.name === palaceName);

  if (!palace) {
    throw new ZiWeiError("명반에서 궁을 찾을 수 없습니다.", {
      code: "CALCULATION_ERROR",
      field: palaceName,
    });
  }

  return palace;
};

/**
 * 명궁의 대표 주성을 고른다.
 * 空宮이면 借對宮으로 차용한 주성을 그대로 쓰고(`getEffectiveMainStars`),
 * 2개 이상 동궁하면 `OWNER_STAR_PRIORITY`(자미계 우선) 순으로 결정론적으로 하나를 고른다.
 */
const pickMingGongPrimaryStar = (
  chart: ZiweiChart
): { name: MainStarName; brightness: string } => {
  const mingGong = findPalace(chart, "명궁");
  const effectiveStars = getEffectiveMainStars(mingGong).filter((star) =>
    isMainStarName(star.name)
  );

  if (effectiveStars.length === 0) {
    throw new ZiWeiError("명궁 주성을 확인할 수 없습니다.", {
      code: "CALCULATION_ERROR",
      field: "명궁",
    });
  }

  const [primary] = [...effectiveStars].sort(
    (a, b) =>
      OWNER_STAR_PRIORITY[a.name as MainStarName] -
      OWNER_STAR_PRIORITY[b.name as MainStarName]
  );

  return { name: primary.name as MainStarName, brightness: primary.brightness };
};

// ============================================================
// 메인 엔트리
// ============================================================

/**
 * 우주 주인(owner) 1인의 운세 한줄평을 결정론적으로 산출한다.
 *
 * @description
 * - LLM 호출 없음. 모든 값은 `constants/owner-one-liner-table.ts`에서 나온다.
 * - 순수 함수 — 동일 입력 → 항상 동일 출력 (Math.random / Date.now 미사용, 조회 시점 무관).
 * - 시진 확정(`exact`): 명궁 주성 × 그 별의 밝기군 × 오행국 페이스로 산출.
 * - 시진 미상(`estimated`): 시진에 의존하지 않는 연간 오행 × 띠 축으로 전환해 산출한다
 *   (12판 평균이 아니다 — 이산 슬러그는 평균을 낼 수 없어 애초에 시진 없이도
 *   확정되는 별개 축을 쓴다).
 */
export const calculateOwnerOneLiner = (
  person: OwnerOneLinerPerson
): OwnerOneLinerResult => {
  const chart = buildChart(person);

  if (person.birthTime === "unknown") {
    const elementVariant =
      STEM_TO_OWNER_ELEMENT_VARIANT[chart.lunarDate.yearStem];
    const animal = BRANCH_TO_OWNER_ANIMAL[chart.lunarDate.yearBranch];
    const oneLinerId = buildOwnerYearOneLinerId(elementVariant, animal);
    const oneLiner = OWNER_ONE_LINERS[oneLinerId];

    if (!oneLiner) {
      throw new ZiWeiError("한줄평 템플릿을 찾을 수 없습니다.", {
        code: "CALCULATION_ERROR",
        field: oneLinerId,
      });
    }

    return {
      oneLinerId,
      oneLinerKo: oneLiner.ko,
      confidence: "estimated",
      matrixVersion: OWNER_ONE_LINER_MATRIX_VERSION,
    };
  }

  const primaryStar = pickMingGongPrimaryStar(chart);
  const brightnessGroup = toBrightnessGroup(primaryStar.brightness);
  const pace = derivePaceKey(chart.wuxingJu, chart.lunarDate.yearStem);
  const oneLinerId = buildOwnerOneLinerId(
    primaryStar.name,
    brightnessGroup,
    pace
  );
  const oneLiner = OWNER_ONE_LINERS[oneLinerId];

  if (!oneLiner) {
    throw new ZiWeiError("한줄평 템플릿을 찾을 수 없습니다.", {
      code: "CALCULATION_ERROR",
      field: oneLinerId,
    });
  }

  return {
    oneLinerId,
    oneLinerKo: oneLiner.ko,
    confidence: "exact",
    matrixVersion: OWNER_ONE_LINER_MATRIX_VERSION,
  };
};
