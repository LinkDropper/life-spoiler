import {
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  PALACE_CATEGORY_WEIGHTS,
} from "../constants";
import type {
  BranchIndex,
  Palace,
  SihuaResult,
  StemIndex,
  ZiweiChart,
} from "../types";

import { calculateSihua } from "./sihua";
import { calculateDayun, getCurrentDayun, type DayunResult } from "./dayun";
import {
  calculateHongluan,
  calculateTianxi,
  calculateTianma,
} from "./minor-stars";

// ============================================================
// 유년(流年) 관련 타입
// ============================================================

export interface YearlySihuaEffect {
  star: string;
  palace: string;
  palaceMeaning: string;
}

export interface YearlySihua {
  yearStem: StemIndex;
  yearBranch: BranchIndex;
  yearStemName: string;
  yearBranchName: string;
  hualu: YearlySihuaEffect;
  huaquan: YearlySihuaEffect;
  huake: YearlySihuaEffect;
  huaji: YearlySihuaEffect;
}

export interface MonthlyFortune {
  month: number;
  monthStem: StemIndex;
  monthBranch: BranchIndex;
  monthStemName: string;
  monthBranchName: string;
  score: number;
  theme: string;
}

/** 유년궁 정보 */
export interface YearlyPalaceInfo {
  /** 유년 명궁 (해당 연도 지지 위치) */
  yearlyMingGong: {
    branch: BranchIndex;
    branchName: string;
    palaceName: string;
    mainStars: string[];
    minorStars: string[];
  };
  /** 유년 부처궁 (연애운) */
  yearlySpousePalace: {
    branch: BranchIndex;
    palaceName: string;
    mainStars: string[];
    minorStars: string[];
    hasPeachBlossom: boolean; // 도화성 여부
  };
  /** 유년 재백궁 (재물운) */
  yearlyWealthPalace: {
    branch: BranchIndex;
    palaceName: string;
    mainStars: string[];
  };
}

/** 유년 도화성 정보 */
export interface YearlyPeachBlossomInfo {
  /** 유년 지지 기준 홍란 위치 */
  hongluan: {
    branch: BranchIndex;
    branchName: string;
    palaceName: string;
  };
  /** 유년 지지 기준 천희 위치 */
  tianxi: {
    branch: BranchIndex;
    branchName: string;
    palaceName: string;
  };
  /** 유년 지지 기준 천마 위치 */
  tianma: {
    branch: BranchIndex;
    branchName: string;
    palaceName: string;
  };
  /** 도화 활성화 여부 (명궁/부처궁에 도화성 있음) */
  isPeachBlossomActive: boolean;
  /** 도화 관련 특이사항 */
  peachBlossomNotes: string[];
}

export interface YearlyFortuneResult {
  year: number;
  sihua: YearlySihua;
  /** 유년궁 정보 */
  yearlyPalaces: YearlyPalaceInfo;
  /** 유년 도화성 정보 */
  peachBlossom: YearlyPeachBlossomInfo;
  currentDayun: {
    period: string;
    palaceName: string;
    mainStars: string[];
  } | null;
  monthlyFortunes: MonthlyFortune[];
  scores: {
    overall: number;
    wealth: number;
    career: number;
    relationship: number;
    health: number;
  };
}

// ============================================================
// 유년 계산 함수
// ============================================================

/**
 * 양력 연도에서 천간/지지 계산
 * 기준: 1984년 = 갑자년 (천간: 0, 지지: 0)
 */
export const getYearStemBranch = (
  year: number
): { stem: StemIndex; branch: BranchIndex } => {
  const baseYear = 1984;
  const diff = year - baseYear;

  const stem = ((diff % 10) + 10) % 10;
  const branch = ((diff % 12) + 12) % 12;

  return {
    stem: stem as StemIndex,
    branch: branch as BranchIndex,
  };
};

/**
 * 월간 천간 계산 (오호둔갑법)
 * 연간 천간과 월(1-12)로 월간 천간 계산
 */
export const getMonthStem = (yearStem: StemIndex, month: number): StemIndex => {
  // 연간 천간별 정월(1월) 시작 천간
  // 갑/기년 → 병인월(2), 을/경년 → 무인월(4), 병/신년 → 경인월(6)
  // 정/임년 → 임인월(8), 무/계년 → 갑인월(0)
  const monthStartStems: Record<number, number> = {
    0: 2,
    1: 4,
    2: 6,
    3: 8,
    4: 0,
    5: 2,
    6: 4,
    7: 6,
    8: 8,
    9: 0,
  };

  const startStem = monthStartStems[yearStem];
  return ((startStem + (month - 1)) % 10) as StemIndex;
};

/**
 * 월 지지 계산 (인월부터 시작)
 * 1월=인(2), 2월=묘(3), ..., 12월=축(1)
 */
export const getMonthBranch = (month: number): BranchIndex => {
  // 1월=인(2), 2월=묘(3), ..., 11월=자(0), 12월=축(1)
  return ((month + 1) % 12) as BranchIndex;
};

/**
 * 궁 이름의 의미 설명
 */
const PALACE_MEANINGS: Record<string, string> = {
  명궁: "자아, 성격, 인생 전반",
  형제궁: "형제자매, 동료 관계",
  부처궁: "배우자, 연인, 파트너십",
  자녀궁: "자녀, 창작, 투자",
  재백궁: "재물, 수입, 재테크",
  질액궁: "건강, 질병, 액운",
  천이궁: "이동, 여행, 외부 활동",
  교우궁: "친구, 부하, 인맥",
  관록궁: "직업, 사업, 사회적 성취",
  전택궁: "부동산, 가정환경",
  복덕궁: "정신적 만족, 취미",
  부모궁: "부모, 상사, 학업",
};

/**
 * 별이 위치한 궁 찾기
 */
const findStarPalace = (chart: ZiweiChart, starName: string): string => {
  for (const palace of chart.palaces) {
    const found =
      palace.mainStars.find((s) => s.name === starName) ||
      palace.minorStars.find((s) => s.name === starName);
    if (found) return palace.name;
  }
  return "불명";
};

/**
 * 유년 사화 분석
 */
export const calculateYearlySihua = (
  chart: ZiweiChart,
  targetYear: number
): YearlySihua => {
  const { stem, branch } = getYearStemBranch(targetYear);
  const sihua: SihuaResult = calculateSihua(stem);

  const createEffect = (starName: string): YearlySihuaEffect => {
    const palaceName = findStarPalace(chart, starName);
    return {
      star: starName,
      palace: palaceName,
      palaceMeaning: PALACE_MEANINGS[palaceName] || "",
    };
  };

  return {
    yearStem: stem,
    yearBranch: branch,
    yearStemName: HEAVENLY_STEMS[stem],
    yearBranchName: EARTHLY_BRANCHES[branch],
    hualu: createEffect(sihua.hualu),
    huaquan: createEffect(sihua.huaquan),
    huake: createEffect(sihua.huake),
    huaji: createEffect(sihua.huaji),
  };
};

// ============================================================
// 유년궁 분석 함수
// ============================================================

/** 도화성 목록 */
const PEACH_BLOSSOM_STARS = ["홍란", "천희", "탐랑", "염정", "천요", "함지"];

/**
 * 지지(branch)에 해당하는 궁 찾기
 */
const findPalaceByBranch = (
  chart: ZiweiChart,
  branch: BranchIndex
): Palace | undefined => {
  return chart.palaces.find((p) => p.branch === branch);
};

/**
 * 궁에 도화성이 있는지 확인
 */
const hasPeachBlossomInPalace = (palace: Palace): boolean => {
  const mainStarNames = palace.mainStars.map((s) => s.name);
  const minorStarNames = palace.minorStars.map((s) => s.name);
  const allStars = [...mainStarNames, ...minorStarNames];

  return allStars.some((star) => PEACH_BLOSSOM_STARS.includes(star));
};

/**
 * 유년궁 분석 (유년 지지가 어느 본명반 궁에 해당하는지)
 */
export const calculateYearlyPalaces = (
  chart: ZiweiChart,
  yearBranch: BranchIndex
): YearlyPalaceInfo => {
  // 유년 명궁 = 해당 연도 지지 위치의 궁
  const yearlyMingPalace = findPalaceByBranch(chart, yearBranch);

  // 유년 부처궁 = 유년 명궁에서 반시계 방향 2칸 (PALACE_ORDER index 2)
  const yearlySpouseBranch = ((yearBranch - 2 + 12) % 12) as BranchIndex;
  const yearlySpousePalace = findPalaceByBranch(chart, yearlySpouseBranch);

  // 유년 재백궁 = 유년 명궁에서 반시계 방향 4칸 (PALACE_ORDER index 4)
  const yearlyWealthBranch = ((yearBranch - 4 + 12) % 12) as BranchIndex;
  const yearlyWealthPalace = findPalaceByBranch(chart, yearlyWealthBranch);

  return {
    yearlyMingGong: {
      branch: yearBranch,
      branchName: EARTHLY_BRANCHES[yearBranch],
      palaceName: yearlyMingPalace?.name || "불명",
      mainStars: yearlyMingPalace?.mainStars.map((s) => s.name) || [],
      minorStars: yearlyMingPalace?.minorStars.map((s) => s.name) || [],
    },
    yearlySpousePalace: {
      branch: yearlySpouseBranch,
      palaceName: yearlySpousePalace?.name || "불명",
      mainStars: yearlySpousePalace?.mainStars.map((s) => s.name) || [],
      minorStars: yearlySpousePalace?.minorStars.map((s) => s.name) || [],
      hasPeachBlossom: yearlySpousePalace
        ? hasPeachBlossomInPalace(yearlySpousePalace)
        : false,
    },
    yearlyWealthPalace: {
      branch: yearlyWealthBranch,
      palaceName: yearlyWealthPalace?.name || "불명",
      mainStars: yearlyWealthPalace?.mainStars.map((s) => s.name) || [],
    },
  };
};

/**
 * 유년 도화성 계산 (유년 지지 기준)
 */
export const calculateYearlyPeachBlossom = (
  chart: ZiweiChart,
  yearBranch: BranchIndex,
  yearlyPalaces: YearlyPalaceInfo
): YearlyPeachBlossomInfo => {
  // 유년 지지 기준 홍란/천희/천마 위치 계산
  const hongluanBranch = calculateHongluan(yearBranch);
  const tianxiBranch = calculateTianxi(yearBranch);
  const tianmaBranch = calculateTianma(yearBranch);

  const hongluanPalace = findPalaceByBranch(chart, hongluanBranch);
  const tianxiPalace = findPalaceByBranch(chart, tianxiBranch);
  const tianmaPalace = findPalaceByBranch(chart, tianmaBranch);

  const peachBlossomNotes: string[] = [];
  let isPeachBlossomActive = false;

  // 유년 홍란이 명궁에 있으면 도화 활성
  if (hongluanPalace?.name === "명궁") {
    isPeachBlossomActive = true;
    peachBlossomNotes.push(
      "올해 홍란이 명궁에 입궁 - 이성에게 인기가 높아지는 해"
    );
  }

  // 유년 홍란이 부처궁에 있으면 결혼/연애운 상승
  if (hongluanPalace?.name === "부처궁") {
    isPeachBlossomActive = true;
    peachBlossomNotes.push(
      "올해 홍란이 부처궁에 입궁 - 연애/결혼 가능성 높은 해"
    );
  }

  // 유년 천희가 명궁/부처궁에 있으면
  if (tianxiPalace?.name === "명궁" || tianxiPalace?.name === "부처궁") {
    isPeachBlossomActive = true;
    peachBlossomNotes.push("올해 천희 입궁 - 기쁜 인연이 생길 수 있는 해");
  }

  // 유년 명궁에 탐랑/염정이 있으면
  const mingStars = yearlyPalaces.yearlyMingGong.mainStars;
  if (mingStars.includes("탐랑")) {
    isPeachBlossomActive = true;
    peachBlossomNotes.push(
      "유년 명궁에 탐랑 - 매력이 상승하고 이성 관계가 활발한 해"
    );
  }
  if (mingStars.includes("염정")) {
    isPeachBlossomActive = true;
    peachBlossomNotes.push("유년 명궁에 염정 - 사교적이고 인기가 많은 해");
  }

  // 유년 부처궁에 도화성이 있으면
  if (yearlyPalaces.yearlySpousePalace.hasPeachBlossom) {
    isPeachBlossomActive = true;
    peachBlossomNotes.push("유년 부처궁에 도화성 - 연애/이성 문제가 활발한 해");
  }

  // 천마가 부처궁에 있으면 (만남의 기회)
  if (tianmaPalace?.name === "부처궁") {
    peachBlossomNotes.push(
      "올해 천마가 부처궁 - 새로운 인연을 만날 기회가 많음"
    );
  }

  return {
    hongluan: {
      branch: hongluanBranch,
      branchName: EARTHLY_BRANCHES[hongluanBranch],
      palaceName: hongluanPalace?.name || "불명",
    },
    tianxi: {
      branch: tianxiBranch,
      branchName: EARTHLY_BRANCHES[tianxiBranch],
      palaceName: tianxiPalace?.name || "불명",
    },
    tianma: {
      branch: tianmaBranch,
      branchName: EARTHLY_BRANCHES[tianmaBranch],
      palaceName: tianmaPalace?.name || "불명",
    },
    isPeachBlossomActive,
    peachBlossomNotes,
  };
};

// ============================================================
// 점수 계산
// ============================================================

/**
 * 유년 점수 계산 (사화 + 도화성 + 유년궁 종합)
 */
const calculateYearlyScores = (
  yearlySihua: YearlySihua,
  yearlyPalaces: YearlyPalaceInfo,
  peachBlossom: YearlyPeachBlossomInfo
): { wealth: number; career: number; relationship: number; health: number } => {
  const scores = { wealth: 50, career: 50, relationship: 50, health: 50 };

  const applyBonus = (
    palaceName: string,
    bonus: number,
    category?: "wealth" | "career" | "relationship" | "health"
  ) => {
    const weights = PALACE_CATEGORY_WEIGHTS[palaceName];
    if (!weights) return;

    if (category) {
      scores[category] += bonus * weights[category];
    } else {
      scores.wealth += bonus * weights.wealth * 0.5;
      scores.career += bonus * weights.career * 0.5;
      scores.relationship += bonus * weights.relationship * 0.5;
      scores.health += bonus * weights.health * 0.5;
    }
  };

  // ========== 사화 점수 ==========
  // 화록: 복, 기회 증가 (+20)
  applyBonus(yearlySihua.hualu.palace, 20);
  // 화권: 권력, 주도권 (+15)
  applyBonus(yearlySihua.huaquan.palace, 15);
  // 화과: 명예, 인정 (+10)
  applyBonus(yearlySihua.huake.palace, 10);
  // 화기: 막힘, 주의 (-15)
  applyBonus(yearlySihua.huaji.palace, -15);

  // 특정 궁에 사화가 작용할 때 카테고리 직접 보너스
  if (yearlySihua.hualu.palace === "재백궁") scores.wealth += 15;
  if (yearlySihua.hualu.palace === "관록궁") scores.career += 15;
  if (yearlySihua.hualu.palace === "부처궁") scores.relationship += 15;
  if (yearlySihua.hualu.palace === "질액궁") scores.health += 10;

  if (yearlySihua.huaji.palace === "재백궁") scores.wealth -= 10;
  if (yearlySihua.huaji.palace === "관록궁") scores.career -= 10;
  if (yearlySihua.huaji.palace === "부처궁") scores.relationship -= 10;
  if (yearlySihua.huaji.palace === "질액궁") scores.health -= 15;

  // ========== 도화성 점수 (인연운 영향) ==========
  if (peachBlossom.isPeachBlossomActive) {
    // 도화 활성화되면 인연운 대폭 상승
    scores.relationship += 20;
  }

  // 유년 홍란이 명궁에 있으면 인기 상승
  if (peachBlossom.hongluan.palaceName === "명궁") {
    scores.relationship += 15;
    scores.career += 5; // 인맥으로 인한 커리어 보너스
  }

  // 유년 홍란이 부처궁에 있으면 연애/결혼운 급상승
  if (peachBlossom.hongluan.palaceName === "부처궁") {
    scores.relationship += 20;
  }

  // 유년 천희가 명궁/부처궁에 있으면
  if (
    peachBlossom.tianxi.palaceName === "명궁" ||
    peachBlossom.tianxi.palaceName === "부처궁"
  ) {
    scores.relationship += 10;
  }

  // ========== 유년궁 별 점수 ==========
  const mingStars = yearlyPalaces.yearlyMingGong.mainStars;

  // 유년 명궁의 주성에 따른 보너스
  if (mingStars.includes("자미")) {
    scores.career += 10;
    scores.relationship += 5;
  }
  if (mingStars.includes("천기")) {
    scores.career += 8;
  }
  if (mingStars.includes("태양")) {
    scores.career += 12;
    scores.wealth += 5;
  }
  if (mingStars.includes("무곡")) {
    scores.wealth += 15;
    scores.career += 8;
  }
  if (mingStars.includes("천동")) {
    scores.relationship += 8;
    scores.health += 5;
  }
  if (mingStars.includes("탐랑")) {
    scores.relationship += 18; // 도화성!
    scores.wealth += 5;
  }
  if (mingStars.includes("염정")) {
    scores.relationship += 15; // 도화성!
    scores.career += 5;
  }
  if (mingStars.includes("거문")) {
    scores.career += 10;
  }
  if (mingStars.includes("천량")) {
    scores.health += 10;
    scores.career += 5;
  }
  if (mingStars.includes("파군")) {
    scores.career += 8;
    scores.relationship -= 5; // 변동이 많음
  }
  if (mingStars.includes("칠살")) {
    scores.career += 10;
    scores.health -= 5;
  }

  // 유년 부처궁에 도화성이 있으면
  if (yearlyPalaces.yearlySpousePalace.hasPeachBlossom) {
    scores.relationship += 15;
  }

  return scores;
};

/**
 * 월별 테마 결정
 */
const getMonthlyTheme = (monthBranch: BranchIndex, score: number): string => {
  const themes: Record<number, string[]> = {
    0: ["새로운 시작", "계획 수립"],
    1: ["안정과 축적", "기반 다지기"],
    2: ["성장과 발전", "활발한 활동"],
    3: ["감성의 달", "관계 중심"],
    4: ["변화의 기운", "도전 정신"],
    5: ["열정과 추진", "적극적 행동"],
    6: ["균형과 조화", "중심 잡기"],
    7: ["수확의 시기", "결실 맺기"],
    8: ["확장과 전진", "기회 포착"],
    9: ["정리와 마무리", "내실 다지기"],
    10: ["준비의 시간", "다음을 위해"],
    11: ["휴식과 충전", "재정비"],
  };

  const baseThemes = themes[monthBranch] || ["평온한 달"];
  return score >= 60 ? baseThemes[0] : baseThemes[1] || baseThemes[0];
};

/**
 * 월별 운세 계산
 */
export const calculateMonthlyFortunes = (
  chart: ZiweiChart,
  targetYear: number,
  yearlySihua: YearlySihua,
  yearlyScores: {
    wealth: number;
    career: number;
    relationship: number;
    health: number;
  }
): MonthlyFortune[] => {
  const { stem: yearStem } = getYearStemBranch(targetYear);
  const monthlyFortunes: MonthlyFortune[] = [];

  // 기본 점수 (연간 점수 기반)
  const baseScore =
    (yearlyScores.wealth +
      yearlyScores.career +
      yearlyScores.relationship +
      yearlyScores.health) /
    4;

  for (let month = 1; month <= 12; month++) {
    const monthStem = getMonthStem(yearStem, month);
    const monthBranch = getMonthBranch(month);

    // 월별 변동 (지지 기반 패턴)
    // 인/묘/진(봄): +5, 사/오/미(여름): +3, 신/유/술(가을): 0, 해/자/축(겨울): -3
    let seasonalBonus = 0;
    if ([2, 3, 4].includes(monthBranch)) seasonalBonus = 5;
    else if ([5, 6, 7].includes(monthBranch)) seasonalBonus = 3;
    else if ([8, 9, 10].includes(monthBranch)) seasonalBonus = 0;
    else seasonalBonus = -3;

    // 월간 사화 영향 (간단히)
    const monthSihua = calculateSihua(monthStem);
    let monthSihuaBonus = 0;

    // 월 사화가 유년 사화와 같은 별에 작용하면 효과 증폭
    if (monthSihua.hualu === yearlySihua.hualu.star) monthSihuaBonus += 5;
    if (monthSihua.huaji === yearlySihua.huaji.star) monthSihuaBonus -= 5;

    const score = Math.max(
      0,
      Math.min(100, Math.round(baseScore + seasonalBonus + monthSihuaBonus))
    );

    monthlyFortunes.push({
      month,
      monthStem,
      monthBranch,
      monthStemName: HEAVENLY_STEMS[monthStem],
      monthBranchName: EARTHLY_BRANCHES[monthBranch],
      score,
      theme: getMonthlyTheme(monthBranch, score),
    });
  }

  return monthlyFortunes;
};

/**
 * 유년 운세 메인 계산 함수
 */
export const calculateYearlyFortune = (
  chart: ZiweiChart,
  targetYear: number,
  currentAge?: number
): YearlyFortuneResult => {
  // 1. 유년 사화 계산
  const yearlySihua = calculateYearlySihua(chart, targetYear);
  const { branch: yearBranch } = getYearStemBranch(targetYear);

  // 2. 유년궁 분석
  const yearlyPalaces = calculateYearlyPalaces(chart, yearBranch);

  // 3. 유년 도화성 분석
  const peachBlossom = calculateYearlyPeachBlossom(
    chart,
    yearBranch,
    yearlyPalaces
  );

  // 4. 현재 대운 정보 (나이가 제공된 경우)
  let currentDayunInfo: YearlyFortuneResult["currentDayun"] = null;
  if (currentAge !== undefined) {
    const dayunResult: DayunResult = calculateDayun(chart);
    const currentDayun = getCurrentDayun(dayunResult, currentAge);
    if (currentDayun) {
      currentDayunInfo = {
        period: `${currentDayun.startAge}-${currentDayun.endAge}세`,
        palaceName: currentDayun.palaceName,
        mainStars: currentDayun.palace.mainStars.map((s) => s.name),
      };
    }
  }

  // 5. 연간 점수 계산 (사화 + 도화성 + 유년궁 종합)
  const rawScores = calculateYearlyScores(
    yearlySihua,
    yearlyPalaces,
    peachBlossom
  );
  const clamp = (score: number) =>
    Math.max(0, Math.min(100, Math.round(score)));

  const scores = {
    overall: clamp(
      (rawScores.wealth +
        rawScores.career +
        rawScores.relationship +
        rawScores.health) /
        4
    ),
    wealth: clamp(rawScores.wealth),
    career: clamp(rawScores.career),
    relationship: clamp(rawScores.relationship),
    health: clamp(rawScores.health),
  };

  // 6. 월별 운세 계산
  const monthlyFortunes = calculateMonthlyFortunes(
    chart,
    targetYear,
    yearlySihua,
    scores
  );

  return {
    year: targetYear,
    sihua: yearlySihua,
    yearlyPalaces,
    peachBlossom,
    currentDayun: currentDayunInfo,
    monthlyFortunes,
    scores,
  };
};

/**
 * 좋은 달과 주의할 달 추출
 */
export const getLuckyAndCautionMonths = (
  monthlyFortunes: MonthlyFortune[]
): { luckyMonths: number[]; cautionMonths: number[] } => {
  const sorted = [...monthlyFortunes].sort((a, b) => b.score - a.score);

  return {
    luckyMonths: sorted.slice(0, 3).map((m) => m.month),
    cautionMonths: sorted.slice(-3).map((m) => m.month),
  };
};
