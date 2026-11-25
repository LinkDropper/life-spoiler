/**
 * 연애 운세 고정 평가 세트 (명반 6개 × 연애 상태 섞음)
 *
 * 실행 (저장소 루트에서, .env.local의 OpenAI 키 사용, 1회 약 $0.15 + 판정 비용):
 *   set -a && source .env.local && set +a
 *   pnpm exec ts-node -r tsconfig-paths/register \
 *     -O '{"module":"commonjs","moduleResolution":"node"}' --transpile-only \
 *     scripts/fortune-quality/run-love-eval.ts <이름> [판정 모델, 기본 gpt-5.4]
 *
 * 결과: OS 임시 폴더의 love-eval/<이름>/ 에 사례별 JSON과 summary.json.
 *
 * 지표
 * - 코드 검사: 첫 시도 위반 수, 재생성 횟수, 최종 위반, 섹션 사이 반복, 직업 가정 단어, 시즌 밖 연도
 * - 독자 판정: judgeLoveReadability를 생성 모델과 다른 모델로 돌린 참고치.
 *   같은 프롬프트로 세 번 돌렸을 때 평균 4.2~7.7개로 흔들렸다(docs/love-fortune-quality-2026-11.md).
 *   명반 6개 1회로는 이 폭보다 작은 차이를 가릴 수 없다.
 */

import { mkdirSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

import type { LoveGuest } from "@/libs/services/ai/love-fact-format";
import {
  generateLoveInterpretation,
  judgeLoveReadability,
  loveValidatorFor,
} from "@/libs/services/ai/love-interpreter";
import { findOutputViolations } from "@/libs/services/ai/output-validator";
import { generateZiweiChart } from "@/libs/zi-wei-dou-shu/core";
import type { ZiweiInput } from "@/libs/zi-wei-dou-shu/types";

const OPENAI_URL = "https://api.openai.com/";
const [, , variant = "run", judgeModel = "gpt-5.4"] = process.argv;
const OUT_DIR = join(tmpdir(), "love-eval", variant);

interface EvalCase {
  id: string;
  input: ZiweiInput;
  guest: LoveGuest;
}

const caseOf = (
  id: string,
  birthDate: string,
  birthTime: string,
  gender: "male" | "female",
  relationshipStatus: LoveGuest["relationshipStatus"],
  age: number
): EvalCase => ({
  id,
  input: { name: id, birthDate, birthTime, gender, calendarType: "solar" },
  guest: { gender, age, relationshipStatus, currentYear: 2026 },
});

/** 명궁 주성 5종, 좌표 칸 3종, 솔로·연애 중·기혼, 시즌 0~2개가 섞이게 고른 명반 */
const CASES: EvalCase[] = [
  caseOf("a", "2003-08-08", "16:40", "male", "solo", 23),
  caseOf("b", "1998-03-21", "07:10", "female", "solo", 28),
  caseOf("c", "1995-11-02", "22:30", "male", "dating", 31),
  caseOf("d", "1992-04-11", "09:00", "female", "dating", 34),
  caseOf("e", "1990-10-30", "11:40", "female", "married", 35),
  caseOf("f", "1994-08-22", "16:00", "male", "solo", 32),
];

const JOB_WORDS = /학교|캠퍼스|강의|수업|회사|직장|퇴근|출근|동아리|회식|야근/g;
const YEAR = /20\d\d년/g;

interface CallUsage {
  prompt: number;
  cached: number;
  completion: number;
  retry: boolean;
  first?: string;
}

let calls: CallUsage[] = [];
let judging = false;

/** OpenAI 호출을 가로채 사용량을 세고, 판정 호출만 판정 모델로 바꾼다 */
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  if (!String(input).startsWith(OPENAI_URL) || !init?.body) {
    return realFetch(input, init);
  }
  const body = JSON.parse(String(init.body)) as {
    model: string;
    messages: unknown[];
    reasoning_effort?: string;
  };
  const request = judging
    ? {
        ...init,
        body: JSON.stringify({
          ...body,
          model: judgeModel,
          reasoning_effort: undefined,
        }),
      }
    : init;
  const res = await realFetch(input, request);
  if (judging) return res;
  const data = (await res
    .clone()
    .json()
    .catch(() => ({}))) as {
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      prompt_tokens_details?: { cached_tokens?: number };
    };
    choices?: { message?: { content?: string } }[];
  };
  const retry = body.messages.length > 2;
  calls.push({
    prompt: data.usage?.prompt_tokens ?? 0,
    cached: data.usage?.prompt_tokens_details?.cached_tokens ?? 0,
    completion: data.usage?.completion_tokens ?? 0,
    retry,
    first: retry ? undefined : data.choices?.[0]?.message?.content,
  });
  return res;
}) as typeof fetch;

/** gpt-5.4-mini 단가 (1M 토큰당 USD) */
const costOf = (usage: CallUsage[]): number => {
  const sum = (pick: (u: CallUsage) => number) =>
    usage.reduce((total, u) => total + pick(u), 0);
  const cached = sum((u) => u.cached);
  const prompt = sum((u) => u.prompt);
  const completion = sum((u) => u.completion);
  return ((prompt - cached) * 0.75 + cached * 0.075 + completion * 4.5) / 1e6;
};

const firstViolationCount = (usage: CallUsage[]): number =>
  usage
    .filter((u) => u.first)
    .reduce((total, u) => {
      try {
        const parsed: unknown = JSON.parse(u.first ?? "");
        return (
          total + findOutputViolations(parsed, "ko", loveValidatorFor()).length
        );
      } catch {
        return total + 1;
      }
    }, 0);

const countOf = (text: string, pattern: RegExp): number =>
  (text.match(pattern) ?? []).length;

const runCase = async (c: EvalCase) => {
  calls = [];
  const chart = generateZiweiChart(c.input);
  const started = Date.now();
  const result = await generateLoveInterpretation(chart, c.guest);
  const seconds = (Date.now() - started) / 1000;
  const usage = calls;

  const all = { love_preview: result.preview, ...result.sections };
  const finalViolations = Object.values(all).flatMap((section) =>
    findOutputViolations(section, "ko", loveValidatorFor()).map(
      (v) => `${v.code}:${v.match}`
    )
  );
  judging = true;
  const reader = await judgeLoveReadability(all);
  judging = false;

  const text = JSON.stringify(all);
  const outsideSeasons = JSON.stringify({ ...all, love_seasons: undefined });
  const row = {
    id: c.id,
    label: result.sheet.label,
    status: c.guest.relationshipStatus,
    calls: usage.length,
    retries: usage.filter((u) => u.retry).length,
    cost: +costOf(usage).toFixed(4),
    seconds: +seconds.toFixed(1),
    firstViolations: firstViolationCount(usage),
    finalViolations,
    repeatsLeft: Object.keys(result.repeats.remaining).length,
    reader: reader.length,
    readerNoContext: reader.filter((r) => r.verdict === "no_context").length,
    jobWords: countOf(text, JOB_WORDS),
    yearsOutsideSeasons: countOf(outsideSeasons, YEAR),
  };
  writeFileSync(
    join(OUT_DIR, `${c.id}.json`),
    JSON.stringify({ row, reader, result }, null, 2)
  );
  return row;
};

const main = async () => {
  mkdirSync(OUT_DIR, { recursive: true });
  const rows = [];
  // 사례는 차례대로 돈다 (사용량을 사례별로 나눠 세기 위해)
  for (const c of CASES) {
    const row = await runCase(c);
    rows.push(row);
    console.log(JSON.stringify(row));
  }
  const mean = (pick: (r: (typeof rows)[number]) => number) =>
    +(rows.reduce((total, r) => total + pick(r), 0) / rows.length).toFixed(3);
  const total = (pick: (r: (typeof rows)[number]) => number) =>
    rows.reduce((sum, r) => sum + pick(r), 0);
  const summary = {
    variant,
    judgeModel,
    cases: rows.length,
    retries: mean((r) => r.retries),
    cost: mean((r) => r.cost),
    seconds: mean((r) => r.seconds),
    firstViolations: mean((r) => r.firstViolations),
    finalViolations: total((r) => r.finalViolations.length),
    repeatsLeft: total((r) => r.repeatsLeft),
    reader: mean((r) => r.reader),
    readerNoContext: total((r) => r.readerNoContext),
    jobWords: total((r) => r.jobWords),
    yearsOutsideSeasons: total((r) => r.yearsOutsideSeasons),
  };
  writeFileSync(
    join(OUT_DIR, "summary.json"),
    JSON.stringify({ summary, rows }, null, 2)
  );
  console.log("SUMMARY", JSON.stringify(summary));
  console.log(`결과: ${OUT_DIR}`);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
