/**
 * 인생 운세 4영역 원점수 분위 캘리브레이션
 *
 * 실행 (저장소 루트에서):
 *   pnpm exec ts-node -r tsconfig-paths/register \
 *     -O '{"module":"commonjs","moduleResolution":"node"}' --transpile-only \
 *     scripts/fortune-quality/calibrate-lifetime-scores.ts [--step N] [--write]
 *
 * 격자: 양력 1960-01-01 ~ 2009-12-31을 N일(기본 5) 간격 × 12시진 × 남/녀.
 * 모든 입력이 결정적(Math.random/Date.now 미사용)이므로 같은 옵션이면 같은 출력.
 * --write 를 주면 libs/zi-wei-dou-shu/constants/lifetime-score-quantiles.ts 를 덮어쓴다.
 */

import { writeFileSync } from "fs";
import { join } from "path";

import { calculateLifetimeRawScores } from "@/libs/zi-wei-dou-shu/calculators/lifetime-score";
import type { CategoryScores } from "@/libs/zi-wei-dou-shu/constants/scoring";
import { generateZiweiChart } from "@/libs/zi-wei-dou-shu/core";
import type { Gender } from "@/libs/zi-wei-dou-shu/types";

const CATEGORIES: (keyof CategoryScores)[] = [
  "wealth",
  "career",
  "relationship",
  "health",
];
const QUANTILE_POINTS = 101;
const DAY_MS = 86_400_000;

const getArg = (name: string, fallback: string): string => {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1]
    ? process.argv[index + 1]
    : fallback;
};

const pad = (value: number): string => String(value).padStart(2, "0");

const formatDate = (ms: number): string => {
  const date = new Date(ms);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
};

const round = (value: number): number => Math.round(value * 1000) / 1000;

const quantilesOf = (sorted: number[]): number[] =>
  Array.from({ length: QUANTILE_POINTS }, (_, i) => {
    const pos = (i / (QUANTILE_POINTS - 1)) * (sorted.length - 1);
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    return round(sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo));
  });

const percentileOf = (quantiles: number[], raw: number): number => {
  const below = quantiles.filter((q) => q < raw).length;
  const belowOrEqual = quantiles.filter((q) => q <= raw).length;
  return (below + belowOrEqual) / 2 / quantiles.length;
};

const stats = (values: number[]) => {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return { mean, std: Math.sqrt(variance), distinct: new Set(values).size };
};

const main = (): void => {
  const step = Number(getArg("--step", "5"));
  const start = Date.UTC(1960, 0, 1);
  const end = Date.UTC(2009, 11, 31);
  const genders: Gender[] = ["male", "female"];
  const raws: Record<keyof CategoryScores, number[]> = {
    wealth: [],
    career: [],
    relationship: [],
    health: [],
  };

  for (let ms = start; ms <= end; ms += step * DAY_MS) {
    const birthDate = formatDate(ms);
    for (let branch = 0; branch < 12; branch += 1) {
      for (const gender of genders) {
        const chart = generateZiweiChart({
          name: "calibration",
          birthDate,
          birthTime: `${pad(branch * 2)}:00`,
          gender,
          calendarType: "solar",
        });
        const raw = calculateLifetimeRawScores(chart);
        CATEGORIES.forEach((category) => raws[category].push(raw[category]));
      }
    }
  }

  const quantiles = {} as Record<keyof CategoryScores, number[]>;
  console.log(`명반 수: ${raws.wealth.length} (step=${step}일)`);
  CATEGORIES.forEach((category) => {
    const sorted = [...raws[category]].sort((a, b) => a - b);
    quantiles[category] = quantilesOf(sorted);
    const raw = stats(sorted);
    const display = raws[category].map((value) =>
      Math.round(40 + 55 * percentileOf(quantiles[category], value))
    );
    const shown = stats(display);
    console.log(
      `${category}: 원점수 평균 ${raw.mean.toFixed(2)} 표준편차 ${raw.std.toFixed(2)} ` +
        `서로 다른 값 ${raw.distinct} 범위 ${sorted[0]}~${sorted[sorted.length - 1]} | ` +
        `표시 평균 ${shown.mean.toFixed(1)} 표준편차 ${shown.std.toFixed(1)} ` +
        `서로 다른 값 ${shown.distinct}`
    );
  });

  const body = CATEGORIES.map(
    (category) => `  ${category}: [${quantiles[category].join(", ")}],`
  ).join("\n");
  const content = `/**
 * 인생 운세 4영역 원점수 분위 경계 (101점: 0%, 1%, ... 100%)
 *
 * 자동 생성 — scripts/fortune-quality/calibrate-lifetime-scores.ts --write
 * 격자: 양력 1960-01-01~2009-12-31, ${step}일 간격 x 12시진 x 남/녀 (${raws.wealth.length}명반).
 * 가중치(calculators/lifetime-score.ts)를 바꾸면 반드시 다시 생성한다.
 */
import type { CategoryScores } from "./scoring";

export const LIFETIME_SCORE_QUANTILES: Record<keyof CategoryScores, number[]> =
  {
${body}
  };
`;
  if (process.argv.includes("--write")) {
    writeFileSync(
      join(
        process.cwd(),
        "libs/zi-wei-dou-shu/constants/lifetime-score-quantiles.ts"
      ),
      content
    );
    console.log("분위 상수 파일을 갱신했습니다.");
  }
};

main();
