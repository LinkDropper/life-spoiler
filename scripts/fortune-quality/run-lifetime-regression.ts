/**
 * 인생 운세 품질 회귀 측정
 *
 * 고정 명반 세트로 해석을 생성하거나(LLM 호출, OPENAI_API_KEY 필요),
 * 이미 있는 결과 파일을 읽어 docs/lifetime-fortune-quality-2026-11.md §5 지표를 출력한다.
 *
 * 실행 (저장소 루트에서):
 *   pnpm exec ts-node -r tsconfig-paths/register \
 *     -O '{"module":"commonjs","moduleResolution":"node"}' --transpile-only \
 *     scripts/fortune-quality/run-lifetime-regression.ts [옵션]
 *
 * 옵션:
 *   --generate          고정 명반 세트로 새로 생성 (LLM 비용 발생: 명반당 8회 호출)
 *   --count N           --generate 시 사용할 명반 수 (기본 48, 최대 48)
 *   --language L        ko | en | ja (기본 ko)
 *   --concurrency N     동시에 생성할 명반 수 (기본 3)
 *   --out FILE          생성 결과 저장 경로 (기본 표준 출력에 지표만)
 *   --from FILE         결과 파일에서 지표만 계산. 형식은 아래 둘 중 하나의 JSON 배열
 *                       ① { chartId, language, interpretation }
 *                       ② fortunes 행 { result: { language, chart, interpretation } }
 *   --list-charts       고정 명반 세트의 명궁 분포만 출력
 *
 * 고정 명반 세트와 기준일은 코드에 고정돼 있어 같은 옵션이면 같은 입력이 나간다
 * (LLM 출력 자체는 temperature 때문에 매번 다를 수 있다).
 */

import { writeFileSync, readFileSync } from "node:fs";

import type { Locale } from "@/i18n/config";
import {
  calculateLifetimeQualityReport,
  type LifetimeQualitySample,
} from "@/libs/services/ai/quality-metrics";
import type { FortuneInterpretation } from "@/libs/services/ai/types";
import { EARTHLY_BRANCHES } from "@/libs/zi-wei-dou-shu/constants/branches";
import { generateZiweiChart } from "@/libs/zi-wei-dou-shu/core";
import type { ZiweiInput } from "@/libs/zi-wei-dou-shu/types";

// ------------------------------------------------------------
// 옵션
// ------------------------------------------------------------

const args = process.argv.slice(2);
const readOption = (name: string): string | undefined => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const hasFlag = (name: string): boolean => args.includes(name);

const LANGUAGE = (readOption("--language") ?? "ko") as Locale;
const CONCURRENCY = Number(readOption("--concurrency") ?? 3);
const OUT_FILE = readOption("--out");
const FROM_FILE = readOption("--from");

/** 나이 계산 기준일 — 회귀 비교가 날짜에 따라 흔들리지 않게 고정 */
const REFERENCE_DATE = new Date("2026-11-06T00:00:00+09:00");

// ------------------------------------------------------------
// 고정 명반 세트 (48개)
// ------------------------------------------------------------

const RELATIONSHIP_CYCLE = ["solo", "dating", "married", undefined] as const;
const OCCUPATION_CYCLE = [
  "employed",
  "student",
  "job_seeker",
  "self_employed",
  "employed",
  "homemaker",
] as const;

const pad = (n: number): string => String(n).padStart(2, "0");

/**
 * 연도·월·일·시를 서로소 보폭으로 돌려 명궁 지지·오행국·생년간이 고르게 섞이게 한다.
 * (분포는 --list-charts 로 확인)
 */
export const FIXED_CHART_INPUTS: ZiweiInput[] = Array.from(
  { length: 48 },
  (_, i) => ({
    name: `qa-${pad(i)}`,
    birthDate: `${1966 + ((i * 7) % 39)}-${pad(1 + ((i * 5) % 12))}-${pad(1 + ((i * 11) % 28))}`,
    birthTime: `${pad((i * 5) % 24)}:${pad((i * 17) % 60)}`,
    gender: i % 2 === 0 ? "female" : "male",
    calendarType: "solar",
    relationshipStatus: RELATIONSHIP_CYCLE[i % RELATIONSHIP_CYCLE.length],
    occupationStatus: OCCUPATION_CYCLE[i % OCCUPATION_CYCLE.length],
  })
);

const listCharts = (): void => {
  const counts = new Map<string, number>();
  for (const input of FIXED_CHART_INPUTS) {
    const chart = generateZiweiChart(input);
    const key = `${EARTHLY_BRANCHES[chart.mingGong]} / ${
      chart.palaces
        .find((p) => p.name === "명궁")
        ?.mainStars.map((s) => s.name)
        .join("+") || "공궁"
    }`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const branches = new Set(
    FIXED_CHART_INPUTS.map(
      (input) => EARTHLY_BRANCHES[generateZiweiChart(input).mingGong]
    )
  );
  console.log(`명궁 지지 커버리지: ${branches.size}/12`);
  console.log(`명궁 지지/주성 조합 ${counts.size}종`);
  for (const [key, count] of Array.from(counts.entries()).sort()) {
    console.log(`- ${key}: ${count}`);
  }
};

// ------------------------------------------------------------
// 생성
// ------------------------------------------------------------

const generateSample = async (
  input: ZiweiInput
): Promise<LifetimeQualitySample> => {
  // LLM 클라이언트는 env 검증을 동반하므로 --generate 일 때만 불러온다.
  const { generateFullInterpretation } = await import("@/libs/services/ai");
  const {
    buildRequestFactSheet,
    calculateAge,
    convertChartToRequest,
    convertToDayunData,
  } = await import("@/libs/services/ai/lifetime-request");
  const { calculateAllDayunScores, calculateDayun } =
    await import("@/libs/zi-wei-dou-shu/calculators");
  const { calculateLifetimeCategoryScores } =
    await import("@/libs/zi-wei-dou-shu/calculators/lifetime-score");

  const chart = generateZiweiChart(input);
  const dayunResult = calculateAllDayunScores(
    calculateDayun(chart, 100, LANGUAGE)
  );
  const request = {
    ...convertChartToRequest(chart, {
      currentAge: calculateAge(input.birthDate, REFERENCE_DATE),
      dayunPeriods: convertToDayunData(dayunResult, chart.palaces, LANGUAGE),
      categoryScores: calculateLifetimeCategoryScores(chart),
      factSheet: buildRequestFactSheet(chart, dayunResult, REFERENCE_DATE),
    }),
    language: LANGUAGE,
  };

  const interpretation = await generateFullInterpretation(request, {
    includeDetails: true,
  });
  return { chartId: input.name, language: LANGUAGE, interpretation };
};

const generateAll = async (count: number): Promise<LifetimeQualitySample[]> => {
  const inputs = FIXED_CHART_INPUTS.slice(0, count);
  const results: LifetimeQualitySample[] = [];
  for (let i = 0; i < inputs.length; i += CONCURRENCY) {
    const batch = inputs.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(batch.map(generateSample));
    settled.forEach((outcome, index) => {
      if (outcome.status === "fulfilled") {
        results.push(outcome.value);
        return;
      }
      console.error(`생성 실패 (${batch[index].name}):`, outcome.reason);
    });
    console.error(
      `진행: ${Math.min(i + CONCURRENCY, inputs.length)}/${inputs.length}`
    );
  }
  return results;
};

// ------------------------------------------------------------
// 파일 읽기
// ------------------------------------------------------------

interface FortuneRowLike {
  result: {
    language?: Locale;
    chart?: unknown;
    interpretation: FortuneInterpretation;
  };
}

const isFortuneRow = (value: unknown): value is FortuneRowLike =>
  typeof value === "object" &&
  value !== null &&
  "result" in value &&
  typeof (value as FortuneRowLike).result === "object";

const readSamples = (file: string): LifetimeQualitySample[] => {
  const raw: unknown = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(raw)) {
    throw new Error(`${file}: JSON 배열이어야 합니다.`);
  }
  return raw.map((item, index): LifetimeQualitySample => {
    if (isFortuneRow(item)) {
      return {
        chartId: JSON.stringify(item.result.chart ?? index),
        language: item.result.language ?? "ko",
        interpretation: item.result.interpretation,
      };
    }
    return item as LifetimeQualitySample;
  });
};

// ------------------------------------------------------------
// 실행
// ------------------------------------------------------------

const main = async (): Promise<void> => {
  if (hasFlag("--list-charts")) {
    listCharts();
    return;
  }

  let samples: LifetimeQualitySample[];
  if (FROM_FILE) {
    samples = readSamples(FROM_FILE);
  } else if (hasFlag("--generate")) {
    const count = Math.min(Number(readOption("--count") ?? 48), 48);
    samples = await generateAll(count);
    if (OUT_FILE) {
      writeFileSync(OUT_FILE, JSON.stringify(samples, null, 2));
      console.error(`저장: ${OUT_FILE}`);
    }
  } else {
    console.error(
      "--generate, --from FILE, --list-charts 중 하나가 필요합니다."
    );
    process.exitCode = 1;
    return;
  }

  const report = calculateLifetimeQualityReport(samples);
  console.log(JSON.stringify(report, null, 2));
};

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
