import type { FaceMetrics } from "./face-shape-analyzer";
import { REGION_SCORE_KEYS, REGION_SCORE_LABEL } from "./types.v3";
import type { RegionScoreKey } from "./types.v3";

/**
 * 부위별 "인상 기여도" 점수 결정적 산출기.
 *
 * 점수의 의미:
 * - 이 부위가 **인상에 얼마나 또렷하게 기여하는가**의 척도
 * - 미추(美醜) 평가가 아님. 7.0 미만은 사용하지 않는다.
 * - 구간: **7.0 ~ 9.7** (Phase 14에서 7.5~9.5에서 확장)
 * - 분포 목표: 7.5~9.0이 ~70%, 7.0~7.5 / 9.0~9.7가 ~30% (폭 확장)
 *
 * 결정성: 같은 `FaceMetrics` 입력 → 항상 같은 점수·hint.
 * LLM이 결정하지 않음 → 같은 이미지가 매번 다른 점수를 내는 신뢰도 붕괴 방지.
 *
 * Phase 14 (2026-04-21) — 민감도 개선:
 * - 모든 gaussian `width`를 40~50% 축소 → 한국인 측정값 분포(0.3~1.2) 대비
 *   더 좁은 중심 반영 → 사진별 점수 편차 확대.
 * - `fitToBaseScore` 구간 확대: 7.7+1.7 → 7.2+2.3 (폭 35% 확장).
 * - `finalizeScore` 클램프 확장: 7.5~9.5 → 7.0~9.7.
 * - `scoreBalance` 최소값 인하: 8.3+1.2 → 7.8+1.7.
 * - `samjeongVariance` 계수 강화: 3 → 5.
 */

export interface RegionRawScore {
  region: RegionScoreKey;
  label: string;
  /** 7.5 ~ 9.5 (소수점 1자리) */
  score: number;
  /**
   * LLM 프롬프트에 주입할 짧은 근거 문구.
   * 해석 방향을 유도하되 점수 자체나 측정 수치는 노출하지 않는다.
   * 예: "이마 비율이 균형적이라 안정감을 주는 편"
   */
  rationaleHint: string;
}

// ============================================================
// 보조 함수
// ============================================================

const clamp = (n: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, n));

/** 중심값에서 멀어질수록 0에 수렴하는 0~1 적합도 (가우시안). */
const gaussianFit = (x: number, center: number, width: number): number => {
  const z = (x - center) / width;
  return Math.exp(-(z * z));
};

/** 소수점 1자리 반올림 + 7.0~9.7 클램프 (Phase 14: 7.5~9.5 → 확장). */
const finalizeScore = (raw: number): number => {
  const clamped = clamp(raw, 7.0, 9.7);
  return Math.round(clamped * 10) / 10;
};

/**
 * 0~1 적합도 → 7.2~9.5 구간의 점수 (Phase 14: 폭 35% 확장).
 * 평범한 fit도 낮은 점수가 나올 수 있게 하여 "어떤 사진이든 비슷한 점수" 문제 해소.
 */
const fitToBaseScore = (fit: number): number => 7.2 + clamp(fit, 0, 1) * 2.3;

// ============================================================
// 부위별 점수 + hint
// ============================================================

const scoreForehead = (m: FaceMetrics): { score: number; hint: string } => {
  // 이마 너비/광대 비율 이상치: 0.85~0.95가 균형. samjeong upper 0.30~0.36이 이상.
  // Phase 14: width 축소 (0.1→0.06, 0.05→0.025)
  const widthFit = gaussianFit(m.foreheadWidthRatio, 0.9, 0.06);
  const samjeongFit = gaussianFit(m.samjeong.upper, 0.33, 0.025);
  const fit = (widthFit + samjeongFit) / 2;

  let hint: string;
  if (m.foreheadWidthRatio > 0.95) {
    hint = "이마가 넓은 편이라 시야와 통찰의 기운이 또렷한 쪽";
  } else if (m.foreheadWidthRatio < 0.82) {
    hint = "이마가 좁은 편이라 집중과 장인 기질이 담기는 쪽";
  } else {
    hint = "이마 비율이 안정적으로 잡혀 있어 생각의 정리력이 또렷한 쪽";
  }
  return { score: fitToBaseScore(fit), hint };
};

const scoreEye = (m: FaceMetrics): { score: number; hint: string } => {
  // 눈은 인상의 핵심축이라 기본 점수를 한 단계 올린다.
  // Phase 14: aspect width 1.2→0.7, 편차 민감도 강화
  const aspectFit = gaussianFit(m.eyeAspectRatio, 3.8, 0.7);
  const sizeFit = clamp((m.eyeSizeRatio - 0.04) / 0.04, 0, 1);
  const cornerDistinctness = clamp(Math.abs(m.eyeCornerAngle - 3) / 8, 0, 1);
  const fit =
    aspectFit * 0.4 + sizeFit * 0.3 + (0.6 + cornerDistinctness * 0.4) * 0.3;

  let hint: string;
  if (m.eyeCornerAngle > 7) {
    hint = "눈꼬리가 또렷하게 올라간 편이라 추진과 경쟁의 기운이 잡히는 쪽";
  } else if (m.eyeCornerAngle < 1) {
    hint = "눈꼬리가 수평에 가까워 차분하고 정돈된 눈매 쪽";
  } else if (m.eyeAspectRatio > 3.5) {
    hint = "눈이 좁고 긴 편이라 관찰과 침착함이 또렷한 쪽";
  } else if (m.eyeAspectRatio < 2.7) {
    hint = "크고 둥근 눈이라 표현과 개방성이 열리는 쪽";
  } else {
    hint = "눈매가 안정적으로 정돈되어 상대를 보고 판단하는 쪽";
  }
  // Phase 14: 7.9+1.5 → 7.3+2.2 (폭 47% 확장)
  return { score: 7.3 + clamp(fit, 0, 1) * 2.2, hint };
};

const scoreBrow = (m: FaceMetrics): { score: number; hint: string } => {
  // 눈썹 농도·모양은 랜드마크로 직접 측정 불가. samjeong upper + 눈 크기 조합으로 proxy.
  // Phase 14: width 0.05→0.025, 1.2→0.7
  const samjeongFit = gaussianFit(m.samjeong.upper, 0.33, 0.025);
  const eyeFit = gaussianFit(m.eyeAspectRatio, 3.8, 0.7);
  const fit = samjeongFit * 0.6 + eyeFit * 0.4;
  const hint = "눈썹 결이 정돈된 편이라 자기 기준과 매너가 읽히는 쪽";
  return { score: fitToBaseScore(fit), hint };
};

const scoreNose = (m: FaceMetrics): { score: number; hint: string } => {
  // Phase 14: width 0.06→0.035, 0.08→0.05
  const lengthFit = gaussianFit(m.noseLengthRatio, 0.28, 0.035);
  const philtrumFit = gaussianFit(m.philtrumRatio, 0.35, 0.05);
  const fit = (lengthFit + philtrumFit) / 2;

  let hint: string;
  if (m.noseLengthRatio > 0.32) {
    hint = "코가 긴 편이라 신중과 완벽주의의 결이 읽히는 쪽";
  } else if (m.noseLengthRatio < 0.24) {
    hint = "코가 짧은 편이라 즉흥과 행동의 기운이 잡히는 쪽";
  } else {
    hint = "코가 얼굴 중심에 안정적으로 자리 잡아 현실 감각이 또렷한 쪽";
  }
  return { score: fitToBaseScore(fit), hint };
};

const scoreMouth = (m: FaceMetrics): { score: number; hint: string } => {
  // Phase 14: width 0.07→0.04, 0.1→0.06
  const widthFit = gaussianFit(m.mouthWidthRatio, 0.4, 0.04);
  const philtrumFit = gaussianFit(m.philtrumRatio, 0.35, 0.06);
  const fit = widthFit * 0.7 + philtrumFit * 0.3;

  let hint: string;
  if (m.mouthWidthRatio > 0.46) {
    hint = "입이 넓은 편이라 표현과 담대함이 열리는 쪽";
  } else if (m.mouthWidthRatio < 0.34) {
    hint = "입이 작고 단정한 편이라 신중과 절제가 읽히는 쪽";
  } else {
    hint = "입매가 차분하고 정돈된 편이라 말의 무게감이 있는 쪽";
  }
  return { score: fitToBaseScore(fit), hint };
};

const scoreChin = (m: FaceMetrics): { score: number; hint: string } => {
  // Phase 14: width 0.15→0.08, 0.3→0.18
  const widthFit = gaussianFit(m.jawWidthRatio, 0.9, 0.08);
  const angularityFit = gaussianFit(m.jawAngularity, 0.45, 0.18);
  const fit = (widthFit + angularityFit) / 2;

  let hint: string;
  if (m.jawAngularity > 0.6) {
    hint = "턱이 각진 편이라 의지와 지속력이 또렷한 쪽";
  } else if (m.jawAngularity < 0.3) {
    hint = "턱이 둥근 편이라 온화와 포용의 결이 있는 쪽";
  } else {
    hint = "턱선이 안정적으로 잡혀 있어 버티는 힘이 읽히는 쪽";
  }
  return { score: fitToBaseScore(fit), hint };
};

const scoreCheekbone = (m: FaceMetrics): { score: number; hint: string } => {
  // 광대 돌출은 랜드마크로 직접 측정 불가. samjeong middle + jawWidthRatio로 proxy.
  // Phase 14: width 0.05→0.025, 0.15→0.08
  const samjeongFit = gaussianFit(m.samjeong.middle, 0.34, 0.025);
  const widthBalance = gaussianFit(m.jawWidthRatio, 0.92, 0.08);
  const fit = samjeongFit * 0.6 + widthBalance * 0.4;
  const hint =
    "광대가 과하지 않게 자리 잡혀 있어 사회적 존재감이 무리 없이 드러나는 쪽";
  return { score: fitToBaseScore(fit), hint };
};

const scoreBalance = (m: FaceMetrics): { score: number; hint: string } => {
  // 전체 균형감 — 삼정 분포가 고를수록, 얼굴 비율이 극단에서 멀수록 높음.
  // Phase 14: samjeongVariance 계수 3→5 (더 엄격), faceRatio width 0.18→0.1,
  //           최종 점수 8.3+1.2 → 7.8+1.7 (최저 대역 확장).
  const samjeongVariance =
    Math.abs(m.samjeong.upper - 1 / 3) +
    Math.abs(m.samjeong.middle - 1 / 3) +
    Math.abs(m.samjeong.lower - 1 / 3);
  const balanceFit = clamp(1 - samjeongVariance * 5, 0, 1);
  const faceBalanceFit = gaussianFit(m.faceRatio, 1.05, 0.1);
  const fit = balanceFit * 0.6 + faceBalanceFit * 0.4;

  const hint =
    "한 군데가 튀기보다 전체가 조화롭게 잡혀 있어 안정감이 묵직한 쪽";
  return { score: 7.8 + clamp(fit, 0, 1) * 1.7, hint };
};

// ============================================================
// 엔트리 포인트
// ============================================================

type Scorer = (m: FaceMetrics) => { score: number; hint: string };

const SCORERS: Record<RegionScoreKey, Scorer> = {
  forehead: scoreForehead,
  eye: scoreEye,
  brow: scoreBrow,
  nose: scoreNose,
  mouth: scoreMouth,
  chin: scoreChin,
  cheekbone: scoreCheekbone,
  balance: scoreBalance,
};

/**
 * 8개 부위 점수 + hint 산출. 순서는 `REGION_SCORE_KEYS`와 일치.
 */
export const scoreRegions = (metrics: FaceMetrics): RegionRawScore[] =>
  REGION_SCORE_KEYS.map((key) => {
    const { score, hint } = SCORERS[key](metrics);
    return {
      region: key,
      label: REGION_SCORE_LABEL[key],
      score: finalizeScore(score),
      rationaleHint: hint,
    };
  });

/**
 * 종합 점수 산출. 8개 부위 평균 → 클램프·반올림.
 * 종합은 균형감 쪽으로 살짝 가중. (reference score.md도 종합이 개별 평균보다 높게 보이도록 설계)
 */
export const deriveTotalScore = (regionScores: RegionRawScore[]): number => {
  if (regionScores.length === 0) return 8.0;
  const balance = regionScores.find((r) => r.region === "balance");
  const others = regionScores.filter((r) => r.region !== "balance");
  const othersAvg =
    others.reduce((acc, r) => acc + r.score, 0) / Math.max(1, others.length);
  const balanceWeight = 0.35;
  const raw = balance
    ? othersAvg * (1 - balanceWeight) + balance.score * balanceWeight
    : othersAvg;
  return finalizeScore(raw);
};
