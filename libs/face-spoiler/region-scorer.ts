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
  /**
   * Phase 16.2 (2026-04-22) — 원시 수치 요약.
   *
   * `rationaleHint`가 완성된 문장이라 LLM이 재포장만 하는 경향이 있어,
   * 해석 동질화 원인이 됨. 원시 수치만 전달해 해석은 이미지 관찰로 유도.
   *
   * Stage A(종합인상·균형감)는 이 필드를 hint 블록에 사용.
   * Stage B/C는 기존 `rationaleHint` 사용 (부위별은 방향성 유도가 필요).
   *
   * 예: "상부 폭 비율 0.89 · 상삼정 0.34"
   */
  numericHint: string;
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
 * 0~1 적합도 → 7.0~9.7 구간의 점수.
 *
 * Phase 17 (2026-04-22) — 비선형 확장 매핑.
 * Phase 17.3 (2026-04-22) — 확장 계수 2.5 → 3.0.
 * result-report5에서 편차 0.4 → 0.9 개선됐지만 목표 1.5+에 미달.
 * 평균대 fit이 더 극단으로 튀도록 3.0으로 강화.
 *
 * 매핑 예 (계수 3.0):
 *  - fit=0.5 → 8.35 (그대로)
 *  - fit=0.4 → 7.27 (더 낮게)
 *  - fit=0.6 → 9.43 (더 높게)
 *  - fit≤0.333 → 7.0 (클램프)
 *  - fit≥0.667 → 9.7 (클램프)
 *
 * 결과: 기존 점수 편차 0.9 → 1.3~1.7 확장 기대.
 */
const fitToBaseScore = (fit: number): number => {
  const centered = clamp(fit, 0, 1) - 0.5;
  const expanded = clamp(centered * 3.0 + 0.5, 0, 1);
  return 7.0 + expanded * 2.7;
};

// ============================================================
// 부위별 점수 + hint
// ============================================================

/** 소수점 2자리 포맷 (numericHint용). */
const n2 = (v: number): string => v.toFixed(2);

/** 각도 포맷 (소수점 1자리). */
const deg = (v: number): string => `${v.toFixed(1)}°`;

const scoreForehead = (m: FaceMetrics): { score: number; hint: string } => {
  // Phase 14: width 축소, Phase 15: hint 6구간 세분화.
  // Phase 17.3: gaussian width 추가 20% 축소 → 평균대 fit 편차 확대.
  const widthFit = gaussianFit(m.foreheadWidthRatio, 0.9, 0.048);
  const samjeongFit = gaussianFit(m.samjeong.upper, 0.33, 0.02);
  const fit = (widthFit + samjeongFit) / 2;

  let hint: string;
  if (m.foreheadWidthRatio > 1.0) {
    hint = "이마가 광대보다 넓어 시야와 통찰이 앞서는 상부형 인상";
  } else if (m.foreheadWidthRatio > 0.95) {
    hint = "이마가 넓직해 기획·구조화의 기운이 또렷한 편";
  } else if (m.foreheadWidthRatio > 0.88) {
    hint = "이마가 평균보다 살짝 넓어 균형감 있는 사고를 보이는 쪽";
  } else if (m.foreheadWidthRatio > 0.82) {
    hint = "이마 폭이 중간대로 정돈되어 사고가 체계적인 편";
  } else if (m.foreheadWidthRatio > 0.75) {
    hint = "이마가 좁은 편이라 한 가지에 몰입하는 집중형";
  } else {
    hint = "이마가 좁고 기운이 응축된 장인 기질 쪽";
  }
  return { score: fitToBaseScore(fit), hint };
};

const scoreEye = (m: FaceMetrics): { score: number; hint: string } => {
  // 눈은 인상의 핵심축이라 기본 점수를 한 단계 올린다.
  // Phase 14: aspect width 1.2→0.7.
  // Phase 17.3: aspect width 0.7 → 0.56 (20% 축소).
  const aspectFit = gaussianFit(m.eyeAspectRatio, 3.8, 0.56);
  const sizeFit = clamp((m.eyeSizeRatio - 0.04) / 0.04, 0, 1);
  const cornerDistinctness = clamp(Math.abs(m.eyeCornerAngle - 3) / 8, 0, 1);
  const fit =
    aspectFit * 0.4 + sizeFit * 0.3 + (0.6 + cornerDistinctness * 0.4) * 0.3;

  let hint: string;
  // Phase 15: 눈 hint 8구간 세분화 (각도 + 비율 조합으로 다양화)
  if (m.eyeCornerAngle > 10) {
    hint = "눈꼬리가 크게 치켜올라가 강한 의지와 승부욕이 앞서는 눈매";
  } else if (m.eyeCornerAngle > 6) {
    hint = "눈꼬리가 또렷이 올라간 추진과 경쟁의 기운이 선명한 쪽";
  } else if (m.eyeCornerAngle > 2) {
    hint = "눈꼬리가 살짝 올라간 은근한 경쟁심과 집중력";
  } else if (m.eyeCornerAngle < -3) {
    hint = "눈꼬리가 처져 포용과 따뜻함이 감도는 눈매";
  } else if (m.eyeCornerAngle < 0) {
    hint = "눈꼬리가 살짝 내려와 부드럽고 받아주는 인상";
  } else if (m.eyeAspectRatio > 4.0) {
    hint = "눈이 가로로 길게 뻗어 관찰력과 침착함이 우선";
  } else if (m.eyeAspectRatio < 2.8) {
    hint = "크고 둥근 눈이라 표현과 개방성이 열리는 쪽";
  } else {
    hint = "눈매가 수평에 가까우면서 상황을 먼저 읽는 관찰자 결";
  }
  // Phase 14: 7.9+1.5 → 7.3+2.2 (폭 47% 확장)
  // Phase 17: 공용 fitToBaseScore로 통합해 비선형 확장 효과 공유.
  return { score: fitToBaseScore(fit), hint };
};

const scoreBrow = (m: FaceMetrics): { score: number; hint: string } => {
  // 눈썹 농도·모양은 랜드마크로 직접 측정 불가. samjeong upper + 눈 모양 조합으로 proxy.
  // Phase 17.3: gaussian width 20% 축소.
  const samjeongFit = gaussianFit(m.samjeong.upper, 0.33, 0.02);
  const eyeFit = gaussianFit(m.eyeAspectRatio, 3.8, 0.56);
  const fit = samjeongFit * 0.6 + eyeFit * 0.4;

  // Phase 15: 고정 hint → 5구간 분기 (삼정 상부 비율과 눈 형태 조합)
  let hint: string;
  if (m.samjeong.upper > 0.38) {
    hint = "눈썹과 이마 사이가 넉넉해 여유롭고 시원한 기운";
  } else if (m.samjeong.upper > 0.34) {
    hint = "눈썹 결이 고르게 자리 잡아 자기 원칙이 또렷한 쪽";
  } else if (m.samjeong.upper > 0.3) {
    hint = "눈썹이 눈에 가까워 집중과 몰입이 배어나는 결";
  } else if (m.eyeAspectRatio > 3.5) {
    hint = "눈썹이 긴 눈매와 어우러져 판단력과 침착함 강조";
  } else {
    hint = "눈썹선이 짧고 단정해 압축된 추진력이 느껴지는 쪽";
  }
  return { score: fitToBaseScore(fit), hint };
};

const scoreNose = (m: FaceMetrics): { score: number; hint: string } => {
  // Phase 14: width 0.06→0.035, 0.08→0.05.
  // Phase 17.3: 추가 20% 축소.
  const lengthFit = gaussianFit(m.noseLengthRatio, 0.28, 0.028);
  const philtrumFit = gaussianFit(m.philtrumRatio, 0.35, 0.04);
  const fit = (lengthFit + philtrumFit) / 2;

  // Phase 15: 6구간 세분화 (noseLengthRatio + philtrumRatio 조합)
  let hint: string;
  if (m.noseLengthRatio > 0.35) {
    hint = "코가 유독 길어 깊은 탐구와 집요함이 읽히는 쪽";
  } else if (m.noseLengthRatio > 0.32) {
    hint = "코가 긴 편이라 신중과 완벽주의의 결";
  } else if (m.noseLengthRatio > 0.28) {
    hint = "코가 적당히 길어 현실적 판단력과 균형";
  } else if (m.noseLengthRatio > 0.24) {
    hint = "코가 보통 길이로 자리 잡아 현실 감각이 또렷";
  } else if (m.noseLengthRatio > 0.2) {
    hint = "코가 짧은 편이라 즉흥과 행동의 기운이 빠른 쪽";
  } else {
    hint = "코가 아주 짧아 직관과 순발력으로 움직이는 타입";
  }
  return { score: fitToBaseScore(fit), hint };
};

const scoreMouth = (m: FaceMetrics): { score: number; hint: string } => {
  // Phase 14: width 0.07→0.04, 0.1→0.06.
  // Phase 17.3: 추가 20% 축소.
  const widthFit = gaussianFit(m.mouthWidthRatio, 0.4, 0.032);
  const philtrumFit = gaussianFit(m.philtrumRatio, 0.35, 0.048);
  const fit = widthFit * 0.7 + philtrumFit * 0.3;

  // Phase 15: 6구간 세분화 (mouthWidthRatio)
  let hint: string;
  if (m.mouthWidthRatio > 0.5) {
    hint = "입이 아주 넓어 대담한 표현과 강한 존재감";
  } else if (m.mouthWidthRatio > 0.44) {
    hint = "입이 넓은 편이라 표현과 담대함이 열리는 쪽";
  } else if (m.mouthWidthRatio > 0.4) {
    hint = "입매가 살짝 커서 활달한 소통력이 보이는 쪽";
  } else if (m.mouthWidthRatio > 0.36) {
    hint = "입매가 적당한 폭으로 자리 잡아 말의 무게를 지키는 편";
  } else if (m.mouthWidthRatio > 0.32) {
    hint = "입이 작고 단정해 신중하고 절제된 언행";
  } else {
    hint = "입이 아주 작아 말 한마디에 무게를 싣는 진중한 결";
  }
  return { score: fitToBaseScore(fit), hint };
};

const scoreChin = (m: FaceMetrics): { score: number; hint: string } => {
  // Phase 14: width 0.15→0.08, 0.3→0.18.
  // Phase 17.3: 추가 20% 축소.
  const widthFit = gaussianFit(m.jawWidthRatio, 0.9, 0.064);
  const angularityFit = gaussianFit(m.jawAngularity, 0.45, 0.144);
  const fit = (widthFit + angularityFit) / 2;

  // Phase 15: 6구간 세분화 (angularity + width 조합)
  let hint: string;
  if (m.jawAngularity > 0.75) {
    hint = "턱이 매우 각져 강한 돌파력과 결단이 선명한 쪽";
  } else if (m.jawAngularity > 0.55) {
    hint = "턱선이 각진 편이라 의지와 지속력이 또렷한 결";
  } else if (m.jawAngularity > 0.35) {
    hint = "턱선이 균형있게 자리 잡아 안정감 있는 추진력";
  } else if (m.jawWidthRatio > 0.88 && m.jawAngularity < 0.3) {
    hint = "턱이 넓고 둥글어 넉넉한 포용과 안정의 기운";
  } else if (m.jawAngularity < 0.2) {
    hint = "턱이 아주 둥글어 온화와 친화력이 앞서는 쪽";
  } else {
    hint = "턱선이 부드럽게 마무리되어 편안한 인상을 주는 결";
  }
  return { score: fitToBaseScore(fit), hint };
};

const scoreCheekbone = (m: FaceMetrics): { score: number; hint: string } => {
  // 광대 돌출은 랜드마크로 직접 측정 불가. samjeong middle + jawWidthRatio로 proxy.
  // Phase 17.3: 20% 축소.
  const samjeongFit = gaussianFit(m.samjeong.middle, 0.34, 0.02);
  const widthBalance = gaussianFit(m.jawWidthRatio, 0.92, 0.064);
  const fit = samjeongFit * 0.6 + widthBalance * 0.4;

  // Phase 15: 고정 hint → 5구간 분기 (중안 비율·턱 폭 조합)
  let hint: string;
  if (m.samjeong.middle > 0.38) {
    hint = "중안이 넉넉해 사회적 존재감이 또렷이 드러나는 광대";
  } else if (m.samjeong.middle > 0.34) {
    hint = "광대가 자연스럽게 자리 잡아 무리 없는 사회성이 느껴지는";
  } else if (m.samjeong.middle > 0.3) {
    hint = "광대가 은근히 잡혀 있어 차분한 영향력이 배어나는";
  } else if (m.jawWidthRatio > 0.9) {
    hint = "광대와 턱이 어우러져 안정적인 너비의 인상";
  } else {
    hint = "광대가 튀지 않아 부드럽고 여유로운 인상을 주는 쪽";
  }
  return { score: fitToBaseScore(fit), hint };
};

const scoreBalance = (m: FaceMetrics): { score: number; hint: string } => {
  // 전체 균형감 — 삼정 분포가 고를수록, 얼굴 비율이 극단에서 멀수록 높음.
  //
  // Phase 20.4 (2026-04-23) — fit 계산 다변화.
  // 기존: `balanceFit * 0.6 + faceBalanceFit * 0.4` 2요소만 반영 →
  //       세 얼굴 모두 fit 0.4 근처로 수렴 → 점수 7.0 한 점 고착 (result-gpt-1).
  // 해결: 3개 요소 가중 평균으로 확장하고, 각각을 비선형적으로 매핑해
  //       뚜렷한 특성(세로·둥근 극단, 상하 편향)은 점수가 올라가게, 밋밋한
  //       평균대는 내려가게 분산시킨다.
  const samjeongVariance =
    Math.abs(m.samjeong.upper - 1 / 3) +
    Math.abs(m.samjeong.middle - 1 / 3) +
    Math.abs(m.samjeong.lower - 1 / 3);
  const balanceFit = clamp(1 - samjeongVariance * 5, 0, 1);

  // Phase 20.4: 얼굴형 극단에서 오히려 점수가 올라가도록 재설계.
  // 기존 gaussian(1.05 중심)은 평균형만 유리하게 평가했는데, "세로가 길어 응축된
  // 인상"이나 "둥글어 친화가 뚜렷한 인상"도 관상적으로 뚜렷한 강점이라 가점 대상.
  // 중심에서 멀어질수록 완만하게 점수가 증가하되, 극단(>1.35 또는 <0.85)은 클램프.
  const faceRatioDeviation = Math.abs(m.faceRatio - 1.05);
  const faceShapeFit = clamp(0.4 + faceRatioDeviation * 2.5, 0.4, 0.95);

  // Phase 20.4: 상/하 편향이 뚜렷할수록 fit 상승 (특성이 분명한 얼굴).
  // |upperLowerDiff|가 0.03 이상이면 개성이 강한 것으로 간주.
  const upperLowerDiff = m.samjeong.upper - m.samjeong.lower;
  const biasFit = clamp(Math.abs(upperLowerDiff) * 15, 0, 1);

  // 3개 요소 가중 평균 (기존 2요소 → 3요소)
  const fit =
    balanceFit * 0.45 + faceShapeFit * 0.35 + biasFit * 0.2;

  // Phase 17.4 (2026-04-22) — 우선순위 재설계.
  //
  // 기존(Phase 16) 문제: middle > 0.385 분기가 1순위라 한국인 평균대 얼굴 2/3이
  // 여기로 흡수(result-report5.md 2/3 "중안이 긴 편" 수렴).
  //
  // 해결: 개성 특징이 뚜렷한 순서로 재배치.
  // 1. 얼굴형(세로/둥근) — 외곽 윤곽이 가장 먼저 눈에 띔
  // 2. 상/하 상대차(상부 우세 / 하부 우세) — 명확한 편향
  // 3. 중안 우세 — threshold 0.385 → 0.40으로 추가 상향 (catchment 축소)
  // 4. 미세 편향 / 고른 / 독립
  //
  // 기대 효과: 중안 catchment 2/3 → 0~1/3.
  const { upper, middle, lower } = m.samjeong;
  // upperLowerDiff는 위 fit 계산에서 이미 선언됨 (Phase 20.4).

  let hint: string;
  // 1. 얼굴형(세로) — 가장 눈에 띄는 외형
  if (m.faceRatio > 1.22) {
    hint = "세로로 길게 떨어지는 얼굴선이 내면을 응축하는 결의 균형";
  }
  // 2. 얼굴형(둥근)
  else if (m.faceRatio < 0.97) {
    hint = "가로로 둥글게 감싸는 윤곽이 친화와 온기로 수렴하는 균형";
  }
  // 3. 상부가 하부보다 뚜렷이 우세
  else if (upperLowerDiff > 0.03 && upper > 0.35) {
    hint = "이마와 눈썹 쪽이 도드라져 사고·기획이 앞서 움직이는 균형";
  }
  // 4. 하부가 상부보다 뚜렷이 우세
  else if (upperLowerDiff < -0.03 && lower > 0.35) {
    hint = "턱과 입매 쪽 선이 더 뚜렷해 결정이 곧장 행동으로 이어지는 균형";
  }
  // 5. 중안 뚜렷 (Phase 17.4: 0.385 → 0.40 상향, catchment 축소)
  else if (middle > 0.4) {
    hint = "중안(눈~코)이 긴 편이라 관찰과 판단이 얼굴 중심에 놓인 균형";
  }
  // 6. 미세 상 우세
  else if (upperLowerDiff > 0.012) {
    hint = "상부가 은근히 앞서서 생각이 한 박자 먼저 움직이는 균형";
  }
  // 7. 미세 하 우세
  else if (upperLowerDiff < -0.012) {
    hint = "하부가 은근히 받쳐주며 결정의 무게가 실리는 쪽의 균형";
  }
  // 8. 삼정 거의 동등
  else if (Math.abs(upperLowerDiff) < 0.008) {
    hint = "삼정이 거의 같은 폭으로 맞물려 어느 한쪽으로도 기울지 않는 균형";
  }
  // 9. 기본 — 각 부위 독립
  else {
    hint = "각 부위가 각자 자리를 지키며 서로를 조용히 받쳐주는 균형";
  }
  // Phase 17: 7.8+1.7 (폭 1.7) → fitToBaseScore 공유 (폭 2.7).
  // balance가 총점을 중앙값으로 끌어당기던 자석 효과를 약화시킴.
  return { score: fitToBaseScore(fit), hint };
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
 * Phase 16.2 — 부위별 원시 수치 요약 생성기.
 *
 * Stage A 프롬프트가 이 문자열을 hint 블록으로 사용한다. LLM은 수치 자체를
 * 출력하지 말고, 이미지를 직접 관찰한 결과로 해석 문장을 작성해야 한다.
 */
const buildNumericHint = (key: RegionScoreKey, m: FaceMetrics): string => {
  const { upper, middle, lower } = m.samjeong;
  switch (key) {
    case "forehead":
      return `상부 폭 비율 ${n2(m.foreheadWidthRatio)} · 상삼정 ${n2(upper)}`;
    case "eye":
      return `눈 가로세로비 ${n2(m.eyeAspectRatio)} · 눈꼬리 각도 ${deg(m.eyeCornerAngle)} · 눈 크기 비율 ${n2(m.eyeSizeRatio)}`;
    case "brow":
      return `상삼정 ${n2(upper)} · 눈 가로세로비 ${n2(m.eyeAspectRatio)}`;
    case "nose":
      return `코 길이 비율 ${n2(m.noseLengthRatio)} · 인중 비율 ${n2(m.philtrumRatio)}`;
    case "mouth":
      return `입 폭 비율 ${n2(m.mouthWidthRatio)} · 인중 비율 ${n2(m.philtrumRatio)}`;
    case "chin":
      return `턱 폭 비율 ${n2(m.jawWidthRatio)} · 턱 각 비율 ${n2(m.jawAngularity)}`;
    case "cheekbone":
      return `중삼정 ${n2(middle)} · 턱 폭 비율 ${n2(m.jawWidthRatio)}`;
    case "balance":
      return `삼정 상 ${n2(upper)} / 중 ${n2(middle)} / 하 ${n2(lower)} · 얼굴 비율 ${n2(m.faceRatio)}`;
    default:
      return "";
  }
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
      numericHint: buildNumericHint(key, metrics),
    };
  });

/**
 * 종합 점수 산출. 8개 부위 평균 → 클램프·반올림.
 * 종합은 균형감 쪽으로 살짝 가중. (reference score.md도 종합이 개별 평균보다 높게 보이도록 설계)
 *
 * Phase 17 (2026-04-22): balance 가중치 0.35 → 0.15.
 * balance가 총점을 중앙값(8.3~8.5)으로 끌어당기던 자석 효과를 약화.
 * 이제 나머지 7개 부위의 편차가 총점에 더 민감하게 반영된다.
 */
export const deriveTotalScore = (regionScores: RegionRawScore[]): number => {
  if (regionScores.length === 0) return 8.0;
  const balance = regionScores.find((r) => r.region === "balance");
  const others = regionScores.filter((r) => r.region !== "balance");
  const othersAvg =
    others.reduce((acc, r) => acc + r.score, 0) / Math.max(1, others.length);
  const balanceWeight = 0.15;
  const raw = balance
    ? othersAvg * (1 - balanceWeight) + balance.score * balanceWeight
    : othersAvg;
  return finalizeScore(raw);
};
