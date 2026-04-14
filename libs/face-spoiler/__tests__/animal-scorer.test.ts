import { scoreAnimals } from "../animal-scorer";
import type { FaceMetrics } from "../face-shape-analyzer";

/**
 * 테스트 헬퍼: FaceMetrics 기본값을 한국인 중앙값으로 채우고
 * 각 케이스에서 필요한 필드만 override 한다.
 */
const buildMetrics = (overrides: Partial<FaceMetrics>): FaceMetrics => ({
  faceShape: { category: "oval", label: "계란형", confidence: "medium" },
  faceRatio: 0.95,
  jawWidthRatio: 0.95,
  jawAngularity: 0.3,
  foreheadWidthRatio: 0.9,
  eyeAspectRatio: 4.0,
  eyeCornerAngle: 5,
  eyeSpacingRatio: 0.35,
  eyeSizeRatio: 0.06,
  noseLengthRatio: 0.25,
  mouthWidthRatio: 0.4,
  philtrumRatio: 0.35,
  samjeong: { upper: 0.33, middle: 0.33, lower: 0.34 },
  ...overrides,
});

describe("scoreAnimals", () => {
  it("한국인 평균 대역(P25~P75) 케이스를 강아지상으로 분류한다", () => {
    // 실측 P25~P75 중앙 — faceRatio 0.95 (P25~P75 안),
    // eyeAspectRatio 3.5 (P50 근방), eyeCornerAngle 5 (P50 이하),
    // eyeSizeRatio 0.06, mouthWidthRatio 0.37, philtrumRatio 0.42
    const metrics = buildMetrics({
      faceRatio: 0.95,
      eyeAspectRatio: 3.5,
      eyeCornerAngle: 5,
      jawAngularity: 0,
      jawWidthRatio: 0.96,
      eyeSizeRatio: 0.06,
      noseLengthRatio: 0.22,
      mouthWidthRatio: 0.37,
      philtrumRatio: 0.42,
    });

    const result = scoreAnimals(metrics);
    expect(result.primary).toBe("dog");
  });

  it("세장안 + 갸름한 얼굴은 고양이상으로 분류한다", () => {
    const metrics = buildMetrics({
      faceRatio: 1.05,
      eyeAspectRatio: 4.8,
      eyeCornerAngle: 8,
      jawAngularity: 0.3,
      jawWidthRatio: 0.82,
    });

    const result = scoreAnimals(metrics);
    expect(result.primary).toBe("cat");
  });

  it("급격한 눈꼬리 상승 + 좁은 V 라인은 여우상으로 분류한다", () => {
    const metrics = buildMetrics({
      faceRatio: 1.0,
      eyeCornerAngle: 11,
      jawWidthRatio: 0.85,
      eyeAspectRatio: 4.4,
      noseLengthRatio: 0.28,
    });

    const result = scoreAnimals(metrics);
    expect(result.primary).toBe("fox");
  });

  it("가로로 넓은 얼굴 + 큰 이목구비는 곰상으로 분류한다", () => {
    const metrics = buildMetrics({
      faceRatio: 0.82,
      jawWidthRatio: 1.0,
      eyeSizeRatio: 0.075,
      mouthWidthRatio: 0.48,
      jawAngularity: 0.25,
      eyeCornerAngle: 3,
    });

    const result = scoreAnimals(metrics);
    expect(result.primary).toBe("bear");
  });

  it("세로로 긴 얼굴 + 크고 둥근 눈은 사슴상으로 분류한다", () => {
    // 실측 P75+ 세로 갸름 (faceRatio > 1.28) + 원안 (eyeAspectRatio < 3.32)
    const metrics = buildMetrics({
      faceRatio: 1.35,
      eyeAspectRatio: 2.8,
      eyeCornerAngle: 3,
      eyeSizeRatio: 0.065,
      jawWidthRatio: 0.95,
      philtrumRatio: 0.42,
      mouthWidthRatio: 0.35,
    });

    const result = scoreAnimals(metrics);
    expect(result.primary).toBe("deer");
  });

  it("매우 작은 얼굴비 + 평범한 눈은 너구리상으로 분류한다", () => {
    // 실측 P25- 가로 넓은 얼굴 (faceRatio < 0.9) — jawAngularity/jawWidthRatio는
    // 변별력이 없어 scoringRules에서 제외됨. faceRatio + eyeSizeRatio 대역으로 판별.
    const metrics = buildMetrics({
      faceRatio: 0.82,
      eyeAspectRatio: 3.4,
      eyeCornerAngle: 2,
      eyeSizeRatio: 0.06,
      jawWidthRatio: 1.0,
      jawAngularity: 0,
      noseLengthRatio: 0.22,
      mouthWidthRatio: 0.35,
      philtrumRatio: 0.42,
    });

    const result = scoreAnimals(metrics);
    expect(result.primary).toBe("raccoon");
  });

  it("항상 12종 전체 점수를 정렬해서 반환한다", () => {
    const metrics = buildMetrics({});
    const result = scoreAnimals(metrics);
    expect(result.allScores).toHaveLength(12);
    for (let i = 0; i < result.allScores.length - 1; i++) {
      expect(result.allScores[i].score).toBeGreaterThanOrEqual(
        result.allScores[i + 1].score
      );
    }
  });
});
