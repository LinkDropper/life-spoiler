/**
 * 동물상 코드 결정적 분류기.
 *
 * 기존 `animal-classifier.ts`는 LLM(Gemini)에 사진+측정값을 함께 보내
 * 분류·설명을 한 번에 시켰지만, 모델이 시각 인상에 끌려 대부분 고양이상으로
 * 회귀하는 편향이 발생했다. 본 스코어러는 분류를 코드로 옮겨 결정성·재현성·
 * 튜닝 가능성을 확보한다. LLM은 분류가 끝난 뒤 rationale·matchedRegions
 * 작성에만 관여한다.
 *
 * 구조:
 * 1. 각 동물의 `scoringRules.must / supporting / never`를 순회하며
 *    매칭 여부에 따라 가중치 합산
 * 2. 1·2위 점수 gap으로 confidence 산정
 * 3. 1위가 must를 하나도 매칭 못 했으면 confidence 강제 low
 */

import {
  ANIMAL_CATALOG,
  ANIMAL_TYPE_LIST,
  readScoringMetric,
} from "./constants/animals";
import type {
  AnimalType,
  ScoringRule,
  ScoringOperator,
} from "./constants/animals";

import type { FaceMetrics } from "./face-shape-analyzer";
import type { MatchConfidence } from "./types";

export interface AnimalScore {
  id: AnimalType;
  score: number;
  /** 매칭된 must 룰 개수 */
  mustMatched: number;
  /** 매칭된 supporting 룰 개수 */
  supportingMatched: number;
  /** 매칭된 never 룰 개수 (음수 가점이 적용된 횟수) */
  neverMatched: number;
  /** 디버깅용 — 어떤 룰이 매칭됐는지 사람이 읽을 수 있는 요약 */
  matchedRuleSummary: string[];
}

export interface ScoringResult {
  primary: AnimalType;
  confidence: MatchConfidence;
  /** 12종 전체 점수 (점수 내림차순) */
  allScores: AnimalScore[];
}

/**
 * 단일 룰을 평가하여 가중 점수를 반환.
 * - softness 미지정: 하드 컷 (매칭=weight, 불매칭=0)
 * - softness 지정: sigmoid 기반 부분 매칭 (경계 근처 부드럽게)
 *
 * 매칭 강도는 0~1 범위로 산출 후 weight를 곱해 반환한다.
 */
const evaluateRule = (metrics: FaceMetrics, rule: ScoringRule): number => {
  const value = readScoringMetric(metrics, rule.metric);
  const intensity = computeMatchIntensity(
    value,
    rule.op,
    rule.value,
    rule.softness
  );
  return intensity * rule.weight;
};

/** sigmoid (logistic). softness가 작을수록 가파른 컷, 클수록 완만한 매칭 */
const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));

const computeMatchIntensity = (
  value: number,
  op: ScoringOperator,
  threshold: number | [number, number],
  softness?: number
): number => {
  // 하드 컷
  if (softness === undefined || softness <= 0) {
    return matchesHard(value, op, threshold) ? 1 : 0;
  }

  // 소프트 매칭 (sigmoid)
  switch (op) {
    case "gt":
    case "gte":
      return sigmoid((value - (threshold as number)) / softness);
    case "lt":
    case "lte":
      return sigmoid(((threshold as number) - value) / softness);
    case "between": {
      const [min, max] = threshold as [number, number];
      const lower = sigmoid((value - min) / softness);
      const upper = sigmoid((max - value) / softness);
      return Math.min(lower, upper);
    }
    case "outside": {
      const [min, max] = threshold as [number, number];
      const lower = sigmoid((min - value) / softness);
      const upper = sigmoid((value - max) / softness);
      return Math.max(lower, upper);
    }
  }
};

const matchesHard = (
  value: number,
  op: ScoringOperator,
  threshold: number | [number, number]
): boolean => {
  switch (op) {
    case "gt":
      return value > (threshold as number);
    case "gte":
      return value >= (threshold as number);
    case "lt":
      return value < (threshold as number);
    case "lte":
      return value <= (threshold as number);
    case "between": {
      const [min, max] = threshold as [number, number];
      return value >= min && value <= max;
    }
    case "outside": {
      const [min, max] = threshold as [number, number];
      return value < min || value > max;
    }
  }
};

/** 하드 매칭 카운트용 — confidence 산정 시 must/supporting 충족 개수 파악 */
const hardMatches = (metrics: FaceMetrics, rule: ScoringRule): boolean => {
  const value = readScoringMetric(metrics, rule.metric);
  return matchesHard(value, rule.op, rule.value);
};

const formatRule = (rule: ScoringRule): string => {
  const v = Array.isArray(rule.value)
    ? `[${rule.value[0]}, ${rule.value[1]}]`
    : `${rule.value}`;
  return `${rule.metric} ${rule.op} ${v} (w=${rule.weight})`;
};

const scoreAnimal = (
  metrics: FaceMetrics,
  animalId: AnimalType
): AnimalScore => {
  const def = ANIMAL_CATALOG[animalId];
  const { must, supporting, never } = def.scoringRules;
  let total = 0;
  let mustMatched = 0;
  let supportingMatched = 0;
  let neverMatched = 0;
  const matchedRuleSummary: string[] = [];

  for (const rule of must) {
    const contribution = evaluateRule(metrics, rule);
    total += contribution;
    if (hardMatches(metrics, rule)) {
      mustMatched += 1;
      matchedRuleSummary.push(`MUST ${formatRule(rule)}`);
    }
  }

  // must를 하나도 하드 매칭 못 한 동물에게는 큰 페널티 (사실상 후보 배제).
  // 소프트 가점만으로 1위가 되는 사고를 막는다.
  if (mustMatched === 0 && must.length > 0) {
    total -= 8;
  }

  for (const rule of supporting) {
    const contribution = evaluateRule(metrics, rule);
    total += contribution;
    if (hardMatches(metrics, rule)) {
      supportingMatched += 1;
      matchedRuleSummary.push(`SUP ${formatRule(rule)}`);
    }
  }

  for (const rule of never) {
    // never는 weight가 음수. 매칭 시 큰 감점.
    const contribution = evaluateRule(metrics, rule);
    total += contribution;
    if (hardMatches(metrics, rule)) {
      neverMatched += 1;
      matchedRuleSummary.push(`NEVER ${formatRule(rule)}`);
    }
  }

  return {
    id: animalId,
    score: Math.round(total * 100) / 100,
    mustMatched,
    supportingMatched,
    neverMatched,
    matchedRuleSummary,
  };
};

const decideConfidence = (
  scores: AnimalScore[]
): { primary: AnimalType; confidence: MatchConfidence } => {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const [first, second] = sorted;
  const gap = first.score - second.score;

  let confidence: MatchConfidence;
  if (gap >= 5) {
    confidence = "high";
  } else if (gap >= 2) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  // 1위가 must를 하나도 하드 매칭 못 했으면 confidence 강제 low.
  // 음의 가점만으로 상대적 우위를 점한 케이스 방어.
  if (first.mustMatched === 0) {
    confidence = "low";
  }

  return { primary: first.id, confidence };
};

/**
 * 12종 전체 점수를 계산하고 1위·confidence를 반환.
 *
 * 스코어링은 결정적이며, 같은 metrics 입력에 대해 항상 동일한 결과를 낸다.
 */
export const scoreAnimals = (metrics: FaceMetrics): ScoringResult => {
  const allScores = ANIMAL_TYPE_LIST.map((id) => scoreAnimal(metrics, id)).sort(
    (a, b) => b.score - a.score
  );

  const { primary, confidence } = decideConfidence(allScores);

  return { primary, confidence, allScores };
};
