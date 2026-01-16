import { PALACE_CATEGORY_WEIGHTS } from "../constants";
import type {
  BranchIndex,
  Gender,
  Palace,
  StemIndex,
  WuxingJu,
  ZiweiChart,
} from "../types";

// ============================================================
// 대운(大運) 관련 타입
// ============================================================

export interface DayunPeriod {
  /** 대운 순번 (1대운, 2대운...) */
  index: number;
  /** 시작 나이 */
  startAge: number;
  /** 종료 나이 */
  endAge: number;
  /** 대운궁 지지 인덱스 */
  branchIndex: BranchIndex;
  /** 대운궁 천간 인덱스 */
  stemIndex: StemIndex;
  /** 해당 대운궁의 궁 이름 */
  palaceName: string;
  /** 해당 대운궁 정보 */
  palace: Palace;
  /** 운세 점수 (AI가 채워줌, 초기값 50) */
  score: {
    overall: number;
    wealth: number;
    career: number;
    relationship: number;
    health: number;
  };
}

export interface DayunResult {
  /** 대운 방향: "순행"(시계방향) 또는 "역행"(반시계방향) */
  direction: "순행" | "역행";
  /** 대운 시작 나이 (오행국 수치) */
  startAge: number;
  /** 모든 대운 기간 (보통 8-10개) */
  periods: DayunPeriod[];
}

// ============================================================
// 대운 계산 함수
// ============================================================

/**
 * 양년/음년 판별
 * 천간이 갑(0), 병(2), 무(4), 경(6), 임(8)이면 양년
 */
const isYangYear = (yearStem: StemIndex): boolean => {
  return yearStem % 2 === 0;
};

/**
 * 대운 방향 결정
 * - 남자 양년생 / 여자 음년생 → 순행 (시계방향, 지지 인덱스 증가)
 * - 남자 음년생 / 여자 양년생 → 역행 (반시계방향, 지지 인덱스 감소)
 */
const getDayunDirection = (
  gender: Gender,
  yearStem: StemIndex
): "순행" | "역행" => {
  const isYang = isYangYear(yearStem);
  const isMale = gender === "male";

  // 양남음녀 = 순행, 음남양녀 = 역행
  if ((isMale && isYang) || (!isMale && !isYang)) {
    return "순행";
  }
  return "역행";
};

/**
 * 대운 시작 나이 계산
 * 오행국 수치가 대운 시작 나이
 * - 수이국(2) → 2세 시작
 * - 목삼국(3) → 3세 시작
 * - 금사국(4) → 4세 시작
 * - 토오국(5) → 5세 시작
 * - 화육국(6) → 6세 시작
 */
const getDayunStartAge = (wuxingJu: WuxingJu): number => {
  return wuxingJu;
};

/**
 * 지지 인덱스 순환 (0-11 범위 유지)
 */
const cycleBranch = (index: number): BranchIndex => {
  return (((index % 12) + 12) % 12) as BranchIndex;
};

/**
 * 대운궁의 천간 계산
 * 대운궁 천간은 명궁 천간에서 시작하여 순행/역행
 */
const getDayunStem = (
  baseStem: StemIndex,
  steps: number,
  direction: "순행" | "역행"
): StemIndex => {
  const delta = direction === "순행" ? steps : -steps;
  return ((((baseStem + delta) % 10) + 10) % 10) as StemIndex;
};

/**
 * 지지 인덱스로 궁 이름 찾기
 */
const findPalaceByBranch = (
  palaces: Palace[],
  branchIndex: BranchIndex
): Palace => {
  const palace = palaces.find((p) => p.branch === branchIndex);
  if (!palace) {
    throw new Error(`궁을 찾을 수 없습니다: branch=${branchIndex}`);
  }
  return palace;
};

/**
 * 대운 계산 메인 함수
 * @param chart 명반 데이터
 * @param maxAge 최대 나이 (기본 100세)
 * @returns 대운 결과
 */
export const calculateDayun = (
  chart: ZiweiChart,
  maxAge: number = 100
): DayunResult => {
  const { gender } = chart.input;
  const { yearStem } = chart.lunarDate;
  const { wuxingJu, mingGong, palaces } = chart;

  // 1. 대운 방향 결정
  const direction = getDayunDirection(gender, yearStem);

  // 2. 대운 시작 나이
  const startAge = getDayunStartAge(wuxingJu);

  // 3. 명궁의 천간 찾기
  const mingPalace = findPalaceByBranch(palaces, mingGong);

  // 4. 대운 기간 계산
  const periods: DayunPeriod[] = [];
  let currentAge = startAge;
  let periodIndex = 1;

  // 명궁에서 시작
  let currentBranch = mingGong;

  while (currentAge < maxAge) {
    const endAge = Math.min(currentAge + 9, maxAge - 1);
    const palace = findPalaceByBranch(palaces, currentBranch);

    // 대운 천간 계산 (명궁 천간에서 이동)
    const stemIndex = getDayunStem(mingPalace.stem, periodIndex - 1, direction);

    periods.push({
      index: periodIndex,
      startAge: currentAge,
      endAge,
      branchIndex: currentBranch,
      stemIndex,
      palaceName: palace.name,
      palace,
      score: {
        overall: 50,
        wealth: 50,
        career: 50,
        relationship: 50,
        health: 50,
      },
    });

    // 다음 대운으로 이동
    currentAge += 10;
    periodIndex++;

    // 순행이면 +1, 역행이면 -1
    currentBranch = cycleBranch(
      currentBranch + (direction === "순행" ? 1 : -1)
    );
  }

  return {
    direction,
    startAge,
    periods,
  };
};

/**
 * 현재 나이에 해당하는 대운 찾기
 */
export const getCurrentDayun = (
  dayunResult: DayunResult,
  currentAge: number
): DayunPeriod | null => {
  return (
    dayunResult.periods.find(
      (p) => currentAge >= p.startAge && currentAge <= p.endAge
    ) ?? null
  );
};

// 별 이름별 카테고리 보너스
const STAR_CATEGORY_BONUS: Record<
  string,
  { wealth: number; career: number; relationship: number; health: number }
> = {
  자미: { wealth: 5, career: 15, relationship: 5, health: 5 },
  천기: { wealth: 5, career: 10, relationship: 5, health: 5 },
  태양: { wealth: 5, career: 10, relationship: 10, health: 5 },
  무곡: { wealth: 15, career: 10, relationship: 0, health: 5 },
  천동: { wealth: 5, career: 5, relationship: 10, health: 10 },
  염정: { wealth: 5, career: 10, relationship: 5, health: 0 },
  천부: { wealth: 15, career: 10, relationship: 5, health: 5 },
  태음: { wealth: 10, career: 5, relationship: 10, health: 5 },
  탐랑: { wealth: 5, career: 5, relationship: 15, health: 5 },
  거문: { wealth: 5, career: 10, relationship: 5, health: 5 },
  천상: { wealth: 5, career: 10, relationship: 10, health: 5 },
  천량: { wealth: 5, career: 10, relationship: 5, health: 15 },
  칠살: { wealth: 10, career: 15, relationship: 0, health: 5 },
  파군: { wealth: 5, career: 10, relationship: 5, health: 0 },
};

/**
 * 대운 점수 계산 (별 밝기 + 궁 특성 기반)
 * 결정적 계산으로 같은 명반은 항상 같은 점수
 */
export const calculateDayunScores = (period: DayunPeriod): DayunPeriod => {
  const { palace, palaceName } = period;

  // 밝기별 기본 점수
  const brightnessScore: Record<string, number> = {
    묘: 100,
    왕: 80,
    득: 60,
    리: 40,
    평: 20,
    함: 0,
  };

  // 카테고리별 점수 초기화
  const scores = {
    overall: 50,
    wealth: 50,
    career: 50,
    relationship: 50,
    health: 50,
  };

  // 궁 특성 가중치 가져오기
  const weights = PALACE_CATEGORY_WEIGHTS[palaceName] || {
    wealth: 1.0,
    career: 1.0,
    relationship: 1.0,
    health: 1.0,
  };

  // 주성별 점수 계산
  for (const star of palace.mainStars) {
    const baseBrightness = brightnessScore[star.brightness] ?? 50;
    const starBonus = STAR_CATEGORY_BONUS[star.name] || {
      wealth: 0,
      career: 0,
      relationship: 0,
      health: 0,
    };

    // 사화 보정값
    let sihuaBonus = 0;
    if (star.sihua === "화록") sihuaBonus = 20;
    else if (star.sihua === "화권") sihuaBonus = 15;
    else if (star.sihua === "화과") sihuaBonus = 10;
    else if (star.sihua === "화기") sihuaBonus = -15;

    // 종합 점수
    scores.overall += (baseBrightness - 50) * 0.5 + sihuaBonus;

    // 카테고리별 점수 (밝기 + 별 보너스 + 사화) * 궁 가중치
    scores.wealth +=
      ((baseBrightness - 50) * 0.3 + starBonus.wealth + sihuaBonus * 0.5) *
      weights.wealth;
    scores.career +=
      ((baseBrightness - 50) * 0.3 + starBonus.career + sihuaBonus * 0.5) *
      weights.career;
    scores.relationship +=
      ((baseBrightness - 50) * 0.3 +
        starBonus.relationship +
        sihuaBonus * 0.5) *
      weights.relationship;
    scores.health +=
      ((baseBrightness - 50) * 0.3 + starBonus.health + sihuaBonus * 0.5) *
      weights.health;
  }

  // 주성이 없는 경우 기본값 유지하되 약간 감점
  if (palace.mainStars.length === 0) {
    scores.overall -= 10;
    scores.wealth -= 5;
    scores.career -= 5;
    scores.relationship -= 5;
    scores.health -= 5;
  }

  // 점수 범위 제한 (0-100)
  const clamp = (score: number) =>
    Math.max(0, Math.min(100, Math.round(score)));

  return {
    ...period,
    score: {
      overall: clamp(scores.overall),
      wealth: clamp(scores.wealth),
      career: clamp(scores.career),
      relationship: clamp(scores.relationship),
      health: clamp(scores.health),
    },
  };
};

/**
 * 전체 대운에 점수 적용
 */
export const calculateAllDayunScores = (
  dayunResult: DayunResult
): DayunResult => {
  return {
    ...dayunResult,
    periods: dayunResult.periods.map(calculateDayunScores),
  };
};
