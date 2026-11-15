import type { Locale } from "@/i18n/config";

import { findOutputViolations } from "./output-validator";
import type { FortuneInterpretation } from "./types";

/**
 * 인생 운세 출력 품질 지표 (결정적 계산).
 * 기준선과 목표는 docs/lifetime-fortune-quality-2026-11.md §5 참고.
 * 같은 지표를 운영 DB 표본과 고정 명반 회귀 세트에 똑같이 적용해 비교한다.
 */

export interface LifetimeQualitySample {
  /** 명반 식별자 — 서로 다른 명반끼리의 유사도 계산에 쓴다 */
  chartId: string;
  language: Locale;
  interpretation: FortuneInterpretation;
}

export interface ScoreStats {
  mean: number;
  sd: number;
  distinct: number;
  min: number;
  max: number;
}

export interface LifetimeQualityReport {
  sampleCount: number;
  /** 감시 어휘별 문서 빈도(해석 전체 텍스트에 1회 이상 등장한 표본 비율) */
  watchTermDocShare: Record<string, number>;
  /** 스포일러 headline이 대비·양면 템플릿인 비율 */
  headlineContrastShare: number;
  /** 스포일러 oneLiner가 "~하되 / 길·멀리·오래" 템플릿인 비율 */
  oneLinerHedgeShare: number;
  /** 문서 빈도 상위 어휘 (조사 미분리, 2자 이상 한글/영문 토큰) */
  topTokens: { token: string; docShare: number }[];
  /** 서로 다른 명반 쌍의 전체 텍스트 문자 3-gram 자카드 유사도 평균 */
  crossChartSimilarity: number;
  /** 금지 용어·메타 문구가 1건 이상 있는 표본 비율 */
  violationShare: number;
  scores: Record<"wealth" | "career" | "relationship" | "health", ScoreStats>;
}

/** 운영 실측에서 과다 반복된 어휘 (2026-11 기준선) */
export const DEFAULT_WATCH_TERMS = [
  "흔들",
  "기록",
  "분리",
  "정산",
  "기준",
  "속도",
  "길이 열",
  "멀리",
];

const HEADLINE_CONTRAST_PATTERN =
  /(속에서|속의|속 |속으로|되 |되,|와 [^ ]+의 균형|과 [^ ]+의 균형|균형)/;
const ONE_LINER_HEDGE_PATTERN = /(되,|되 |길이|멀리|오래)/;

const collectText = (value: unknown, out: string[]): void => {
  if (typeof value === "string") {
    out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectText(item, out));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      // 메타·엔진 값은 LLM 문장이 아니므로 제외
      if (key === "meta" || key === "period" || key === "score") continue;
      collectText(child, out);
    }
  }
};

export const extractInterpretationText = (
  interpretation: FortuneInterpretation
): string => {
  const parts: string[] = [];
  collectText(interpretation, parts);
  return parts.join("\n");
};

const share = (count: number, total: number): number =>
  total === 0 ? 0 : Math.round((count / total) * 1000) / 1000;

const toTrigrams = (text: string): Set<string> => {
  const compact = text.replace(/\s+/g, " ");
  const grams = new Set<string>();
  for (let i = 0; i + 3 <= compact.length; i++) {
    grams.add(compact.slice(i, i + 3));
  }
  return grams;
};

const jaccard = (a: Set<string>, b: Set<string>): number => {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const gram of a) {
    if (b.has(gram)) intersection++;
  }
  return intersection / (a.size + b.size - intersection);
};

const calculateScoreStats = (values: number[]): ScoreStats => {
  if (values.length === 0) {
    return { mean: 0, sd: 0, distinct: 0, min: 0, max: 0 };
  }
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return {
    mean: Math.round(mean * 10) / 10,
    sd: Math.round(Math.sqrt(variance) * 10) / 10,
    distinct: new Set(values).size,
    min: Math.min(...values),
    max: Math.max(...values),
  };
};

const TOKEN_PATTERN = /[가-힣A-Za-z]{2,}/g;

/**
 * 표본 집합의 품질 지표를 계산한다.
 */
export const calculateLifetimeQualityReport = (
  samples: LifetimeQualitySample[],
  watchTerms: string[] = DEFAULT_WATCH_TERMS
): LifetimeQualityReport => {
  const total = samples.length;
  const texts = samples.map((s) => extractInterpretationText(s.interpretation));

  const watchTermDocShare = Object.fromEntries(
    watchTerms.map((term) => [
      term,
      share(texts.filter((t) => t.includes(term)).length, total),
    ])
  );

  const headlines = samples.map((s) => s.interpretation.lifeSpoiler.headline);
  const oneLiners = samples.map((s) => s.interpretation.lifeSpoiler.oneLiner);

  const tokenDocCount = new Map<string, number>();
  for (const text of texts) {
    for (const token of new Set(text.match(TOKEN_PATTERN) ?? [])) {
      tokenDocCount.set(token, (tokenDocCount.get(token) ?? 0) + 1);
    }
  }
  const topTokens = Array.from(tokenDocCount.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 20)
    .map(([token, count]) => ({ token, docShare: share(count, total) }));

  const trigramSets = texts.map(toTrigrams);
  let pairSum = 0;
  let pairCount = 0;
  for (let i = 0; i < samples.length; i++) {
    for (let j = i + 1; j < samples.length; j++) {
      if (samples[i].chartId === samples[j].chartId) continue;
      pairSum += jaccard(trigramSets[i], trigramSets[j]);
      pairCount++;
    }
  }

  const violationCount = samples.filter(
    (s) => findOutputViolations(s.interpretation, s.language).length > 0
  ).length;

  const scoreOf = (key: keyof FortuneInterpretation["categories"]): number[] =>
    samples.map((s) => s.interpretation.categories[key].score);

  return {
    sampleCount: total,
    watchTermDocShare,
    headlineContrastShare: share(
      headlines.filter((h) => HEADLINE_CONTRAST_PATTERN.test(h)).length,
      total
    ),
    oneLinerHedgeShare: share(
      oneLiners.filter((o) => ONE_LINER_HEDGE_PATTERN.test(o)).length,
      total
    ),
    topTokens,
    crossChartSimilarity:
      pairCount === 0 ? 0 : Math.round((pairSum / pairCount) * 1000) / 1000,
    violationShare: share(violationCount, total),
    scores: {
      wealth: calculateScoreStats(scoreOf("wealth")),
      career: calculateScoreStats(scoreOf("career")),
      relationship: calculateScoreStats(scoreOf("relationship")),
      health: calculateScoreStats(scoreOf("health")),
    },
  };
};
