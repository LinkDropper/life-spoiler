import { calculateSamBangSaJeong } from "@/libs/zi-wei-dou-shu/calculators/sam-bang";
import type { BranchIndex, ZiweiChart } from "@/libs/zi-wei-dou-shu/types";

/**
 * 운세 예고편·본편(docs/fortune-screen-redesign-2026-11.md) 화면용 순수 계산.
 * 데이터는 그대로 두고, 이미 있는 명반·해석 값에서 보여 줄 형태만 만든다.
 */

/** 명반 4×4 그리드에서 지지(0=子)별 자리. components/fortune/ZiweiChartGrid.tsx와 같은 배치 */
export const PALACE_GRID_POSITIONS: Record<
  BranchIndex,
  { row: number; col: number }
> = {
  0: { row: 4, col: 3 },
  1: { row: 4, col: 2 },
  2: { row: 4, col: 1 },
  3: { row: 3, col: 1 },
  4: { row: 2, col: 1 },
  5: { row: 1, col: 1 },
  6: { row: 1, col: 2 },
  7: { row: 1, col: 3 },
  8: { row: 1, col: 4 },
  9: { row: 2, col: 4 },
  10: { row: 3, col: 4 },
  11: { row: 4, col: 4 },
};

export type ConstellationRole = "self" | "triangle1" | "triangle2" | "opposite";

export interface ConstellationStar {
  role: ConstellationRole;
  branch: BranchIndex;
  palaceName: string;
  /** 첫 주성. 空宮이면 차용 주성, 그것도 없으면 null */
  starName: string | null;
  row: number;
  col: number;
}

/**
 * 내 별자리 = 명궁과 함께 움직이는 세 궁(삼방사정).
 * 본궁·삼합 두 궁은 삼각형으로, 대궁은 점선으로 잇는다. 사람마다 모양이 다르다.
 */
export const getMingConstellation = (
  chart: ZiweiChart
): ConstellationStar[] => {
  const samBang = calculateSamBangSaJeong(chart.palaces, chart.mingGong);
  if (!samBang) {
    return [];
  }
  const roles: ConstellationRole[] = [
    "self",
    "triangle1",
    "triangle2",
    "opposite",
  ];
  return roles.map((role) => {
    const palace = samBang[role];
    const star =
      palace.mainStars[0]?.name ?? palace.borrowedMainStars?.[0]?.name ?? null;
    return {
      role,
      branch: palace.branch,
      palaceName: palace.name,
      starName: star,
      ...PALACE_GRID_POSITIONS[palace.branch],
    };
  });
};

/** 그리드 칸 가운데를 0~1 비율 좌표로 */
export const toGridPoint = (
  star: Pick<ConstellationStar, "row" | "col">
): { x: number; y: number } => ({
  x: (star.col - 0.5) / 4,
  y: (star.row - 0.5) / 4,
});

/** "25~34세", "Ages 25-34", "95세~" 같은 구간 표기에서 시작·끝 나이를 꺼낸다 */
export const parseAgePeriod = (
  period: string
): { start: number; end: number | null } | null => {
  const numbers = period.match(/\d+/g);
  if (!numbers || numbers.length === 0) {
    return null;
  }
  const start = Number(numbers[0]);
  const end = numbers.length > 1 ? Number(numbers[1]) : null;
  return { start, end };
};

export interface AgeLens {
  /** 펼쳐 둘 "지금" 시기 */
  nowIndex: number;
  /** 지금 나이가 어느 구간에도 들지 않으면 true (가장 가까운 시기를 대신 펼친다) */
  isOutside: boolean;
  /** 바로 다음 시기. 없으면 -1 */
  nextIndex: number;
  /** 다음 시기까지 남은 해. 구간 밖이거나 다음 시기가 없으면 null */
  yearsToNext: number | null;
  /** 지금 시기 안에서 지나온 비율 0~1. 구간 밖이면 null */
  progress: number | null;
}

/**
 * 나이대별 시나리오의 "가까울수록 크게" 기준 계산(기획서 §9).
 * 구간 수는 대운 수만큼이라 10개로 고정하지 않는다.
 */
export const buildAgeLens = (periods: string[], age: number): AgeLens => {
  const ranges = periods.map(parseAgePeriod);
  const lastIndex = periods.length - 1;
  const insideIndex = ranges.findIndex(
    (range) =>
      range !== null &&
      range.start <= age &&
      (range.end === null || age <= range.end)
  );

  if (insideIndex === -1) {
    const [first] = ranges;
    const nowIndex = first && age < first.start ? 0 : Math.max(lastIndex, 0);
    return {
      nowIndex,
      isOutside: true,
      nextIndex: nowIndex < lastIndex ? nowIndex + 1 : -1,
      yearsToNext: null,
      progress: null,
    };
  }

  const range = ranges[insideIndex];
  const next = ranges[insideIndex + 1];
  const span = range && range.end !== null ? range.end - range.start + 1 : null;
  return {
    nowIndex: insideIndex,
    isOutside: false,
    nextIndex: insideIndex < lastIndex ? insideIndex + 1 : -1,
    yearsToNext: next ? Math.max(next.start - age, 0) : null,
    progress:
      range && span
        ? Math.min(Math.max((age - range.start) / span, 0), 1)
        : null,
  };
};

/** 0~100 점수를 10점 만점 평점과 별 개수(5개 만점)로 */
export const toRating = (score: number): { ten: string; stars: number } => {
  const clamped = Math.min(Math.max(score, 0), 100);
  return {
    ten: (clamped / 10).toFixed(1),
    stars: Math.round(clamped / 20),
  };
};

/** 점수 높은 순 순위(1부터). 같은 점수는 같은 순위 */
export const rankByScore = <K extends string>(
  scores: Record<K, number>
): Record<K, number> => {
  const keys = Object.keys(scores) as K[];
  return keys.reduce(
    (ranks, key) => {
      ranks[key] =
        1 + keys.filter((other) => scores[other] > scores[key]).length;
      return ranks;
    },
    {} as Record<K, number>
  );
};

/** 인생·올해 운세의 네 갈래 (재물·직업·인연·건강) */
export type CategoryKey = "wealth" | "career" | "relationship" | "health";
