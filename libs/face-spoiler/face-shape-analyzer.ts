import type { NormalizedLandmark } from "./face-detector";

/**
 * MediaPipe Face Landmarker 468개 랜드마크에서 관상학 핵심 지표를 수치로 측정.
 *
 * 관상학 오관(五官) + 삼정(三停) 기반 물리적 관찰 지표:
 * - 얼굴형: 높이/너비 비율, 턱 너비 비율, 턱선 각도
 * - 눈: 가로세로 비율(세장안/원안), 눈꼬리 각도, 눈 간격
 * - 코: 코 길이 비율, 콧대 높이
 * - 입: 입 너비 비율, (입술 두께는 랜드마크로 제한적)
 * - 삼정: 상정/중정/하정 비율
 * - 인중: 인중 길이 비율
 */

/** 얼굴형 분류 결과 */
export type FaceShapeCategory =
  | "round"
  | "angular"
  | "long"
  | "invertedTriangle"
  | "oval"
  | "polygonal";

/** 종합 얼굴 측정 결과 */
export interface FaceMetrics {
  /** 얼굴형 분류 */
  faceShape: {
    category: FaceShapeCategory;
    label: string;
    confidence: "high" | "medium" | "low";
  };
  /** 얼굴 높이/너비 비율 (1.0=정사각, >1.4=장형) */
  faceRatio: number;
  /** 턱 너비/광대 너비 비율 (낮을수록 역삼각) */
  jawWidthRatio: number;
  /** 턱선 각진 정도 (0=둥근, 1=각진) */
  jawAngularity: number;
  /** 이마 너비/광대 너비 비율 */
  foreheadWidthRatio: number;
  /** 눈 가로/세로 비율 — 평균. >2.5=세장안(좁고 긴), <2.0=원안(둥근 큰 눈) */
  eyeAspectRatio: number;
  /** 눈꼬리 각도 (degree). 양수=올라감, 0=수평, 음수=처짐 */
  eyeCornerAngle: number;
  /** 눈 사이 거리/얼굴 너비 비율. >0.38=넓은 편, <0.32=좁은 편 */
  eyeSpacingRatio: number;
  /** 눈 크기/얼굴 높이 비율. >0.08=큰 편, <0.05=작은 편 */
  eyeSizeRatio: number;
  /** 코 길이/얼굴 높이 비율. >0.32=긴 편, <0.26=짧은 편 */
  noseLengthRatio: number;
  /** 입 너비/광대 너비 비율. >0.45=넓은 편, <0.35=좁은 편 */
  mouthWidthRatio: number;
  /** 인중 길이/코 길이 비율. >0.4=긴 편, <0.28=짧은 편 */
  philtrumRatio: number;
  /** 삼정(三停) 비율 — 상정:중정:하정 (합=1.0) */
  samjeong: {
    upper: number;
    middle: number;
    lower: number;
  };
}

const FACE_SHAPE_LABELS: Record<FaceShapeCategory, string> = {
  round: "둥근 편",
  angular: "각진 편",
  long: "세로로 긴 편",
  invertedTriangle: "하관이 좁은 편 (역삼각)",
  oval: "계란형",
  polygonal: "다각형",
};

/**
 * MediaPipe Face Mesh 468 랜드마크 인덱스 (정면 기준)
 * 관상학 전문가 검증 완료 (2024-04)
 */
const LM = {
  foreheadTop: 10,
  chinBottom: 152,
  // 광대 최외곽 (관상학 전문가 권고: 93/323)
  cheekLeft: 93,
  cheekRight: 323,
  // 하악각 gonion (관상학 전문가 권고: 132/361)
  jawLeft: 132,
  jawRight: 361,
  jawMidLeft: 136,
  jawMidRight: 365,
  foreheadLeft: 71,
  foreheadRight: 301,
  // 눈 — 좌우 내외곽
  eyeLeftInner: 133,
  eyeLeftOuter: 33,
  eyeLeftTop: 159,
  eyeLeftBottom: 145,
  eyeRightInner: 362,
  eyeRightOuter: 263,
  eyeRightTop: 386,
  eyeRightBottom: 374,
  // 코
  noseRoot: 6,
  noseTip: 1,
  noseBottom: 2,
  // 입
  upperLipTop: 0,
  lowerLipBottom: 17,
  mouthLeft: 61,
  mouthRight: 291,
  // 눈썹
  browLeftInner: 107,
  browRightInner: 336,
} as const;

const dist = (a: NormalizedLandmark, b: NormalizedLandmark): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const round2 = (n: number): number => Math.round(n * 100) / 100;

const angleDeg = (
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark
): number => {
  const ba = { x: a.x - b.x, y: a.y - b.y };
  const bc = { x: c.x - b.x, y: c.y - b.y };
  const dot = ba.x * bc.x + ba.y * bc.y;
  const magBA = Math.sqrt(ba.x * ba.x + ba.y * ba.y);
  const magBC = Math.sqrt(bc.x * bc.x + bc.y * bc.y);
  const cosAngle = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  return (Math.acos(cosAngle) * 180) / Math.PI;
};

export const analyzeFaceMetrics = (
  landmarks: NormalizedLandmark[]
): FaceMetrics | null => {
  if (landmarks.length < 468) {
    return null;
  }

  const lm = (idx: number) => landmarks[idx];

  // ── 얼굴형 기본 측정 ──
  const faceHeight = dist(lm(LM.foreheadTop), lm(LM.chinBottom));
  const cheekWidth = dist(lm(LM.cheekLeft), lm(LM.cheekRight));
  const jawWidth = dist(lm(LM.jawLeft), lm(LM.jawRight));
  const foreheadWidth = dist(lm(LM.foreheadLeft), lm(LM.foreheadRight));

  const faceRatio = faceHeight / cheekWidth;
  const jawWidthRatio = jawWidth / cheekWidth;
  const foreheadWidthRatio = foreheadWidth / cheekWidth;

  // 턱선 각도
  const jawAngleLeft = angleDeg(
    lm(LM.cheekLeft),
    lm(LM.jawMidLeft),
    lm(LM.chinBottom)
  );
  const jawAngleRight = angleDeg(
    lm(LM.cheekRight),
    lm(LM.jawMidRight),
    lm(LM.chinBottom)
  );
  const avgJawAngle = (jawAngleLeft + jawAngleRight) / 2;
  const jawAngularity = Math.max(0, Math.min(1, (120 - avgJawAngle) / 30));

  // ── 눈 측정 ──
  // 눈 가로세로 비율 (좌우 평균)
  const eyeLeftW = dist(lm(LM.eyeLeftInner), lm(LM.eyeLeftOuter));
  const eyeLeftH = dist(lm(LM.eyeLeftTop), lm(LM.eyeLeftBottom));
  const eyeRightW = dist(lm(LM.eyeRightInner), lm(LM.eyeRightOuter));
  const eyeRightH = dist(lm(LM.eyeRightTop), lm(LM.eyeRightBottom));
  const eyeAspectRatio = (eyeLeftW / eyeLeftH + eyeRightW / eyeRightH) / 2;

  // 눈꼬리 각도 (외곽이 내곽보다 높으면 양수=올라감)
  const leftCornerDy = lm(LM.eyeLeftOuter).y - lm(LM.eyeLeftInner).y;
  const leftCornerDx = lm(LM.eyeLeftInner).x - lm(LM.eyeLeftOuter).x;
  const rightCornerDy = lm(LM.eyeRightOuter).y - lm(LM.eyeRightInner).y;
  const rightCornerDx = lm(LM.eyeRightOuter).x - lm(LM.eyeRightInner).x;
  const leftAngle = Math.atan2(-leftCornerDy, leftCornerDx) * (180 / Math.PI);
  const rightAngle =
    Math.atan2(-rightCornerDy, rightCornerDx) * (180 / Math.PI);
  const eyeCornerAngle = (leftAngle + rightAngle) / 2;

  // 눈 사이 거리 / 얼굴 너비
  const eyeSpacing = dist(lm(LM.eyeLeftInner), lm(LM.eyeRightInner));
  const eyeSpacingRatio = eyeSpacing / cheekWidth;

  // 눈 크기 / 얼굴 높이 (좌우 평균 높이)
  const avgEyeH = (eyeLeftH + eyeRightH) / 2;
  const eyeSizeRatio = avgEyeH / faceHeight;

  // ── 코 측정 ──
  const noseLength = dist(lm(LM.noseRoot), lm(LM.noseTip));
  const noseLengthRatio = noseLength / faceHeight;

  // ── 입 측정 ──
  const mouthWidth = dist(lm(LM.mouthLeft), lm(LM.mouthRight));
  const mouthWidthRatio = mouthWidth / cheekWidth;

  // ── 인중 측정 ──
  const philtrumLength = dist(lm(LM.noseBottom), lm(LM.upperLipTop));
  const philtrumRatio = philtrumLength / noseLength;

  // ── 삼정(三停) 측정 ──
  const browCenter = {
    x: (lm(LM.browLeftInner).x + lm(LM.browRightInner).x) / 2,
    y: (lm(LM.browLeftInner).y + lm(LM.browRightInner).y) / 2,
    z: 0,
  };
  const upperDist = dist(lm(LM.foreheadTop), browCenter);
  const middleDist = dist(browCenter, lm(LM.noseTip));
  const lowerDist = dist(lm(LM.noseTip), lm(LM.chinBottom));
  const totalSamjeong = upperDist + middleDist + lowerDist;

  // ── 얼굴형 분류 ──
  const faceShape = classifyShape(
    faceRatio,
    jawWidthRatio,
    jawAngularity,
    foreheadWidthRatio
  );

  return {
    faceShape: {
      ...faceShape,
      label: FACE_SHAPE_LABELS[faceShape.category],
    },
    faceRatio: round2(faceRatio),
    jawWidthRatio: round2(jawWidthRatio),
    jawAngularity: round2(jawAngularity),
    foreheadWidthRatio: round2(foreheadWidthRatio),
    eyeAspectRatio: round2(eyeAspectRatio),
    eyeCornerAngle: round2(eyeCornerAngle),
    eyeSpacingRatio: round2(eyeSpacingRatio),
    eyeSizeRatio: round2(eyeSizeRatio),
    noseLengthRatio: round2(noseLengthRatio),
    mouthWidthRatio: round2(mouthWidthRatio),
    philtrumRatio: round2(philtrumRatio),
    samjeong: {
      upper: round2(upperDist / totalSamjeong),
      middle: round2(middleDist / totalSamjeong),
      lower: round2(lowerDist / totalSamjeong),
    },
  };
};

const classifyShape = (
  faceRatio: number,
  jawWidthRatio: number,
  jawAngularity: number,
  foreheadWidthRatio: number
): { category: FaceShapeCategory; confidence: "high" | "medium" | "low" } => {
  const scores: Record<FaceShapeCategory, number> = {
    round: 0,
    angular: 0,
    long: 0,
    invertedTriangle: 0,
    oval: 0,
    polygonal: 0,
  };

  if (faceRatio < 1.15) {
    scores.round += 3;
  } else if (faceRatio < 1.3) {
    scores.oval += 2;
    scores.round += 1;
  } else if (faceRatio < 1.45) {
    scores.oval += 3;
  } else {
    scores.long += 3;
  }

  if (jawWidthRatio > 0.85) {
    scores.angular += 2;
    scores.round += 1;
  } else if (jawWidthRatio >= 0.7) {
    scores.oval += 2;
  } else {
    scores.invertedTriangle += 3;
  }

  if (jawAngularity > 0.7) {
    scores.angular += 3;
  } else if (jawAngularity >= 0.4) {
    scores.polygonal += 1;
    scores.oval += 1;
  } else {
    scores.round += 2;
  }

  if (foreheadWidthRatio > 0.95) {
    scores.round += 1;
    scores.angular += 1;
  } else if (foreheadWidthRatio < 0.8) {
    scores.invertedTriangle -= 1;
    scores.polygonal += 1;
  }

  const jawDiff = Math.abs(jawWidthRatio - foreheadWidthRatio);
  if (jawDiff > 0.15 && scores.polygonal >= 0) {
    scores.polygonal += 1;
  }

  const sorted = (Object.entries(scores) as [FaceShapeCategory, number][]).sort(
    (a, b) => b[1] - a[1]
  );
  const [[bestCategory, bestScore], [, secondScore]] = sorted;
  const gap = bestScore - secondScore;
  const confidence = gap >= 3 ? "high" : gap >= 1 ? "medium" : ("low" as const);

  return { category: bestCategory, confidence };
};

/**
 * Gemini 프롬프트에 주입할 종합 얼굴 측정 힌트.
 * 동물상 분류 + 텍스트 리포트 모두에서 사용.
 */
export const buildFaceMetricsHint = (m: FaceMetrics): string => {
  const eyeCornerDesc =
    m.eyeCornerAngle > 3 ? "올라감" : m.eyeCornerAngle < -3 ? "처짐" : "수평";
  const eyeShapeDesc =
    m.eyeAspectRatio > 2.5
      ? "좁고 긴 눈(세장안)"
      : m.eyeAspectRatio < 2.0
        ? "크고 둥근 눈(원안)"
        : "보통 비율 눈";
  const philtrumDesc =
    m.philtrumRatio > 0.4
      ? "긴 편"
      : m.philtrumRatio < 0.28
        ? "짧은 편"
        : "보통";

  return `[얼굴 측정 데이터 — MediaPipe 468 랜드마크 기반]

## 얼굴형
- 분류: ${m.faceShape.label} (신뢰도: ${m.faceShape.confidence})
- 얼굴 높이/너비 비율: ${m.faceRatio} (1.0=정사각, >1.4=세로 장형)
- 턱 너비/광대 너비: ${m.jawWidthRatio} (<0.7=역삼각)
- 턱선 각진 정도: ${m.jawAngularity} (0=둥근, 1=각진)

## 눈 (동물상 판별 핵심)
- 눈 가로/세로 비율: ${m.eyeAspectRatio} → ${eyeShapeDesc}
- 눈꼬리 각도: ${m.eyeCornerAngle}° → ${eyeCornerDesc}
- 눈 사이 거리/얼굴 너비: ${m.eyeSpacingRatio}
- 눈 크기/얼굴 높이: ${m.eyeSizeRatio}

## 코·입·인중
- 코 길이/얼굴 높이: ${m.noseLengthRatio}
- 입 너비/광대 너비: ${m.mouthWidthRatio}
- 인중 길이/코 길이: ${m.philtrumRatio} → ${philtrumDesc}

## 삼정(三停) 비율
- 상정(이마): ${m.samjeong.upper}
- 중정(눈~코): ${m.samjeong.middle}
- 하정(코~턱): ${m.samjeong.lower}

※ 이 수치는 랜드마크 좌표 기반 객관적 측정입니다. 사진 각도·조명에 의한 오차를 감안하되, 분류 시 이 수치를 우선 참고하세요.`;
};

// ── 레거시 호환용 ──

export type FaceShapeAnalysis = FaceMetrics["faceShape"] & {
  metrics: {
    faceRatio: number;
    jawWidthRatio: number;
    jawAngularity: number;
    foreheadWidthRatio: number;
  };
};

/** @deprecated analyzeFaceMetrics 사용 권장 */
export const analyzeFaceShape = (
  landmarks: NormalizedLandmark[]
): FaceShapeAnalysis | null => {
  const metrics = analyzeFaceMetrics(landmarks);
  if (!metrics) return null;
  return {
    ...metrics.faceShape,
    metrics: {
      faceRatio: metrics.faceRatio,
      jawWidthRatio: metrics.jawWidthRatio,
      jawAngularity: metrics.jawAngularity,
      foreheadWidthRatio: metrics.foreheadWidthRatio,
    },
  };
};

/** @deprecated buildFaceMetricsHint 사용 권장 */
export const buildFaceShapeHint = (analysis: FaceShapeAnalysis): string => {
  const confidenceLabel =
    analysis.confidence === "high"
      ? "높음"
      : analysis.confidence === "medium"
        ? "보통"
        : "낮음";
  return `[얼굴형 사전 분석 힌트 — 랜드마크 기반 수치 측정]
- 분류: ${analysis.label} (신뢰도: ${confidenceLabel})
- 얼굴 높이/너비 비율: ${analysis.metrics.faceRatio}
- 턱 너비/광대 너비 비율: ${analysis.metrics.jawWidthRatio}
- 턱선 각진 정도: ${analysis.metrics.jawAngularity} (0=둥근, 1=각진)
- 이마 너비/광대 너비 비율: ${analysis.metrics.foreheadWidthRatio}`;
};
