import {
  isDailyLevel,
  isDailySlugOfSlot,
} from "@/libs/zi-wei-dou-shu/constants/daily-fortune-table";
import type {
  ColorSlug,
  EstimatedHeadlineSlug,
  HeadlineSlug,
  ItemSlug,
  TimeSlotSlug,
} from "@/libs/zi-wei-dou-shu/constants/daily-fortune-table";
import type {
  DailyDigit,
  DailyLevel,
} from "@/libs/zi-wei-dou-shu/calculators/daily-fortune-types";

import { DailyError } from "./errors";
import { isDateInServiceRange } from "./kst-date";
import type { DailyFortuneView } from "./types";

/**
 * 공유 토큰 (서명 없음, 엄격한 화이트리스트 검증)
 *
 * 형식: `v.date.headline.levels.color.item.number.timeSlot` ("." 구분, 8칸)
 *   예) `1.2026-10-14.df-hl-ziwei-bright-v1.43523.df-kc-water-1.df-ki-water-3.7.df-kt-o`
 *
 * 담는 값: 날짜, 한 줄 슬러그, 5개 level, 색·소품·시간대 슬러그, 숫자.
 * 넣지 않는 값: 생년월일시, 이름, profileId, directionBranch.
 *
 * 토큰은 입력이 아니라 "결과 키"라서 불변이며 CDN 캐시가 가능하다. 서명이 없으므로
 * 누구나 임의 조합을 만들 수 있다 — 그래서 모든 칸을 카탈로그/범위로 검증하고,
 * 화면에는 사전 조회 결과만 렌더한다 (쿼리 값 직접 출력 0).
 */

const TOKEN_VERSION = "1";
const TOKEN_MAX_LENGTH = 200;
const TOKEN_PARTS = 8;
const LEVEL_FIELDS = ["overall", "love", "money", "work", "health"] as const;

export interface DailyShareKeys {
  date: string;
  headline: HeadlineSlug | EstimatedHeadlineSlug;
  levels: Record<(typeof LEVEL_FIELDS)[number], DailyLevel>;
  color: ColorSlug;
  item: ItemSlug;
  number: DailyDigit;
  timeSlot: TimeSlotSlug;
}

const invalidToken = (reason: string): DailyError =>
  new DailyError("INVALID_SHARE_TOKEN", "공유 카드를 찾을 수 없어요.", {
    reason,
  });

const isHeadlineSlug = (
  value: unknown
): value is HeadlineSlug | EstimatedHeadlineSlug =>
  isDailySlugOfSlot("hl", value) || isDailySlugOfSlot("hx", value);

const isDigit = (value: number): value is DailyDigit =>
  Number.isInteger(value) && value >= 1 && value <= 9;

export const encodeShareToken = (keys: DailyShareKeys): string =>
  [
    TOKEN_VERSION,
    keys.date,
    keys.headline,
    LEVEL_FIELDS.map((field) => keys.levels[field]).join(""),
    keys.color,
    keys.item,
    String(keys.number),
    keys.timeSlot,
  ].join(".");

/**
 * 토큰 검증. 하나라도 어긋나면 `INVALID_SHARE_TOKEN`.
 * @param todayKst 날짜 상한 (미래 날짜 거부)
 */
export const decodeShareToken = (
  token: unknown,
  todayKst: string
): DailyShareKeys => {
  if (typeof token !== "string" || token.length > TOKEN_MAX_LENGTH) {
    throw invalidToken("shape");
  }

  const parts = token.split(".");
  if (parts.length !== TOKEN_PARTS) {
    throw invalidToken("parts");
  }

  const [
    version,
    date,
    headline,
    levelText,
    color,
    item,
    numberText,
    timeSlot,
  ] = parts;

  if (version !== TOKEN_VERSION) {
    throw invalidToken("version");
  }

  if (!isDateInServiceRange(date, todayKst)) {
    throw invalidToken("date");
  }

  if (!isHeadlineSlug(headline)) {
    throw invalidToken("headline");
  }

  if (!isDailySlugOfSlot("kc", color)) {
    throw invalidToken("color");
  }

  if (!isDailySlugOfSlot("ki", item)) {
    throw invalidToken("item");
  }

  if (!isDailySlugOfSlot("kt", timeSlot)) {
    throw invalidToken("timeSlot");
  }

  if (!/^\d$/.test(numberText)) {
    throw invalidToken("number");
  }
  const digit = Number(numberText);
  if (!isDigit(digit)) {
    throw invalidToken("number");
  }

  if (!/^\d+$/.test(levelText) || levelText.length !== LEVEL_FIELDS.length) {
    throw invalidToken("levels");
  }
  const levelValues = Array.from(levelText, Number);
  if (!levelValues.every(isDailyLevel)) {
    throw invalidToken("levels");
  }

  const levels = Object.fromEntries(
    LEVEL_FIELDS.map((field, index) => [field, levelValues[index]])
  ) as DailyShareKeys["levels"];

  return {
    date,
    headline,
    levels,
    color,
    item,
    number: digit,
    timeSlot,
  };
};

/** 결과 View → 공유 토큰 키. View에는 이미 개인정보가 없고, 여기서도 필요한 값만 고른다 */
export const toShareKeys = (view: DailyFortuneView): DailyShareKeys => {
  const { headline, keywords, overall, categories, date } = view;
  const byCategory = Object.fromEntries(
    categories.map((c) => [c.category, c.level])
  );
  const { color, item, timeSlot } = keywords;

  if (
    !isHeadlineSlug(headline.slug) ||
    !isDailySlugOfSlot("kc", color.slug) ||
    !isDailySlugOfSlot("ki", item.slug) ||
    !isDailySlugOfSlot("kt", timeSlot.slug)
  ) {
    throw invalidToken("view");
  }

  const levels = {
    overall: overall.level,
    love: byCategory.love,
    money: byCategory.money,
    work: byCategory.work,
    health: byCategory.health,
  };

  if (!Object.values(levels).every(isDailyLevel)) {
    throw invalidToken("view");
  }

  return {
    date,
    headline: headline.slug,
    levels,
    color: color.slug,
    item: item.slug,
    number: keywords.number,
    timeSlot: timeSlot.slug,
  };
};
