import { isFortuneOwned } from "@/libs/home/home-profile";
import type { HomeFortuneKey } from "@/libs/home/home-profile";
import type { YearlyEdition } from "@/libs/fortune/yearly-editions";
import type { ProfileWithFortunes } from "@/libs/stores/profile/types";
import {
  calculateMonthlyFortunes,
  calculateYearlySihua,
  getYearStemBranch,
} from "@/libs/zi-wei-dou-shu/calculators";
import {
  EARTHLY_BRANCHES_I18N,
  HEAVENLY_STEMS_I18N,
} from "@/libs/zi-wei-dou-shu/i18n";
import type { ZiweiChart } from "@/libs/zi-wei-dou-shu/types";
import type { Locale } from "@/i18n/config";

/**
 * 올해·내년 운세 화면용 순수 계산 (docs/fortune-screen-redesign-2026-11.md §10).
 * AI 해석은 그대로 두고, 명반 계산 값에서 보여 줄 형태만 만든다.
 */

/** 최고의 달·조심할 달로 표시하는 개수 (지금 YearlyInsights와 같은 3개) */
const MARK_COUNT = 3;

/** calculateYearlyInsights와 같은 기준 점수 (달별 흐름의 상대 비교용) */
const BASE_SCORES = { wealth: 50, career: 50, relationship: 50, health: 50 };

export interface YearFlow {
  /** 1~12월 점수 (index 0 = 1월) */
  scores: number[];
  /** 점수 높은 순 상위 3개 달 (1부터) */
  bestMonths: number[];
  /** 점수 낮은 순 하위 3개 달 (1부터) */
  cautionMonths: number[];
}

/** 같은 점수면 앞선 달을 먼저 */
export const rankMonths = (scores: number[]): number[] =>
  scores
    .map((score, index) => ({ score, month: index + 1 }))
    .sort((a, b) => b.score - a.score || a.month - b.month)
    .map((item) => item.month);

export const toYearFlow = (scores: number[]): YearFlow => {
  const ranked = rankMonths(scores);
  return {
    scores,
    bestMonths: ranked.slice(0, MARK_COUNT),
    cautionMonths: ranked.slice(-MARK_COUNT).reverse(),
  };
};

/**
 * 올해의 흐름: 명반으로 계산한 달별 점수.
 * 지금 "최고의 달·조심할 달"(calculateYearlyInsights)을 고르는 바로 그 계산이다.
 */
export const getYearFlow = (chart: ZiweiChart, year: number): YearFlow => {
  const yearlySihua = calculateYearlySihua(chart, year);
  const monthly = calculateMonthlyFortunes(
    chart,
    year,
    yearlySihua,
    BASE_SCORES
  );
  return toYearFlow(monthly.map((month) => month.score));
};

/** 연도 간지: 병오년 / Bing-Wu year / 丙午年 */
export const formatYearGanji = (year: number, locale: Locale): string => {
  const { stem, branch } = getYearStemBranch(year);
  const stemName = HEAVENLY_STEMS_I18N[locale][stem];
  const branchName = EARTHLY_BRANCHES_I18N[locale][branch];
  if (locale === "en") {
    return `${stemName}-${branchName} year`;
  }
  return `${stemName}${branchName}${locale === "ja" ? "年" : "년"}`;
};

export type MonthLensMode = "current" | "upcoming" | "past";

export interface MonthLens {
  /** 펼쳐 둘 달 (1~12) */
  focusMonth: number;
  /**
   * current = 그해를 지나는 중(이번 달이 있음)
   * upcoming = 아직 오지 않은 해(내년 운세를 올해 봄) → 1월
   * past = 지난해 → 12월
   */
  mode: MonthLensMode;
  /** 다음 달. 없으면 null */
  nextMonth: number | null;
  /** 이번 달 안에서 지난 비율 0~1. current가 아니면 null */
  progress: number | null;
  /** 오늘 날짜(일). current가 아니면 null */
  today: number | null;
  /** 이번 달을 뺀 남은 달 수. current가 아니면 null */
  monthsLeft: number | null;
}

/** 월별 시나리오 — 가까울수록 크게 (기획서 §10) */
export const buildMonthLens = (year: number, now = new Date()): MonthLens => {
  const thisYear = now.getFullYear();
  if (year > thisYear) {
    return {
      focusMonth: 1,
      mode: "upcoming",
      nextMonth: 2,
      progress: null,
      today: null,
      monthsLeft: null,
    };
  }
  if (year < thisYear) {
    return {
      focusMonth: 12,
      mode: "past",
      nextMonth: null,
      progress: null,
      today: null,
      monthsLeft: null,
    };
  }
  const month = now.getMonth() + 1;
  const today = now.getDate();
  const daysInMonth = new Date(year, month, 0).getDate();
  return {
    focusMonth: month,
    mode: "current",
    nextMonth: month < 12 ? month + 1 : null,
    progress: Math.min(Math.max((today - 1) / daysInMonth, 0), 1),
    today,
    monthsLeft: 12 - month,
  };
};

const EDITION_KEYS: Record<YearlyEdition, HomeFortuneKey> = {
  yearly: "yearly",
  yearly_2027: "yearly2027",
};

/** 올해 본편 다음에 권할 운세: 인생 운세가 없으면 인생, 있으면 홈 순서로 아직 안 본 것 */
const NEXT_ORDER: HomeFortuneKey[] = [
  "lifetime",
  "yearly",
  "yearly2027",
  "compatibility",
  "pastLife",
  "faceReading",
];

export const pickNextAfterYearly = (
  profile: ProfileWithFortunes | null,
  edition: YearlyEdition
): HomeFortuneKey | null => {
  const current = EDITION_KEYS[edition];
  return (
    NEXT_ORDER.find(
      (key) => key !== current && !isFortuneOwned(profile, key)
    ) ?? null
  );
};
