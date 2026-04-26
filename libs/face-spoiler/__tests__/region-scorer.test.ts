import type { FaceMetrics } from "../face-shape-analyzer";
import { deriveTotalScore, scoreRegions } from "../region-scorer";
import { REGION_SCORE_KEYS } from "../types.v3";

const buildMetrics = (overrides: Partial<FaceMetrics> = {}): FaceMetrics => ({
  faceShape: { category: "oval", label: "계란형", confidence: "medium" },
  faceRatio: 1.05,
  jawWidthRatio: 0.9,
  jawAngularity: 0.45,
  foreheadWidthRatio: 0.9,
  eyeAspectRatio: 3.8,
  eyeCornerAngle: 4,
  eyeSpacingRatio: 0.35,
  eyeSizeRatio: 0.06,
  noseLengthRatio: 0.28,
  mouthWidthRatio: 0.4,
  philtrumRatio: 0.35,
  samjeong: { upper: 0.33, middle: 0.34, lower: 0.33 },
  ...overrides,
});

describe("scoreRegions", () => {
  it("8개 부위 점수를 REGION_SCORE_KEYS 순서로 반환한다", () => {
    const result = scoreRegions(buildMetrics());
    expect(result).toHaveLength(8);
    result.forEach((r, i) => {
      expect(r.region).toBe(REGION_SCORE_KEYS[i]);
    });
  });

  it("모든 점수가 7.0~9.7 구간 안에 있다 (Phase 14 확장)", () => {
    const extremes: FaceMetrics[] = [
      buildMetrics({
        faceRatio: 1.45,
        jawAngularity: 0.95,
        eyeCornerAngle: 15,
        eyeAspectRatio: 5,
        noseLengthRatio: 0.4,
        mouthWidthRatio: 0.5,
        philtrumRatio: 0.5,
        samjeong: { upper: 0.5, middle: 0.3, lower: 0.2 },
      }),
      buildMetrics({
        faceRatio: 0.75,
        jawAngularity: 0.1,
        eyeCornerAngle: -5,
        eyeAspectRatio: 2,
        noseLengthRatio: 0.18,
        mouthWidthRatio: 0.28,
        philtrumRatio: 0.2,
        samjeong: { upper: 0.2, middle: 0.25, lower: 0.55 },
      }),
      buildMetrics(),
    ];
    extremes.forEach((m) => {
      const scores = scoreRegions(m);
      scores.forEach((r) => {
        expect(r.score).toBeGreaterThanOrEqual(7.0);
        expect(r.score).toBeLessThanOrEqual(9.7);
      });
    });
  });

  it("점수는 소수점 1자리 정밀도", () => {
    const scores = scoreRegions(buildMetrics());
    scores.forEach((r) => {
      expect(r.score * 10).toBeCloseTo(Math.round(r.score * 10), 5);
    });
  });

  it("같은 입력에 항상 같은 점수·hint (결정성)", () => {
    const metrics = buildMetrics();
    const a = scoreRegions(metrics);
    const b = scoreRegions(metrics);
    expect(a).toEqual(b);
  });

  it("label은 한국어 라벨이 채워져 있다", () => {
    const scores = scoreRegions(buildMetrics());
    const labels = scores.map((r) => r.label);
    expect(labels).toEqual([
      "이마",
      "눈",
      "눈썹",
      "코",
      "입",
      "턱 / 하관",
      "광대",
      "전체 균형감",
    ]);
  });

  it("rationaleHint는 측정 수치나 코드 변수명을 노출하지 않는다", () => {
    const scores = scoreRegions(buildMetrics({ eyeCornerAngle: 12 }));
    const bannedPatterns = [
      /\d+\.\d+/, // 소수
      /\d+\s*[°%]/, // 각도/퍼센트
      /eyeAspectRatio|faceRatio|samjeongUpper|jawWidthRatio/i, // 변수명
      /印堂|山根|臥蠶|準頭/, // 한자
    ];
    scores.forEach((r) => {
      bannedPatterns.forEach((p) => {
        expect(r.rationaleHint).not.toMatch(p);
      });
    });
  });

  it("균형감(balance) 점수는 삼정이 고를 때 가장 높은 대역에 위치", () => {
    const balanced = buildMetrics({
      samjeong: { upper: 0.33, middle: 0.34, lower: 0.33 },
      faceRatio: 1.05,
    });
    const unbalanced = buildMetrics({
      samjeong: { upper: 0.5, middle: 0.25, lower: 0.25 },
      faceRatio: 1.5,
    });
    const balancedScore = scoreRegions(balanced).find(
      (r) => r.region === "balance"
    )!.score;
    const unbalancedScore = scoreRegions(unbalanced).find(
      (r) => r.region === "balance"
    )!.score;
    expect(balancedScore).toBeGreaterThan(unbalancedScore);
  });

  it("눈꼬리 각도에 따라 eye hint가 달라진다", () => {
    const upturned = scoreRegions(buildMetrics({ eyeCornerAngle: 10 })).find(
      (r) => r.region === "eye"
    )!;
    const flat = scoreRegions(buildMetrics({ eyeCornerAngle: 0 })).find(
      (r) => r.region === "eye"
    )!;
    expect(upturned.rationaleHint).not.toBe(flat.rationaleHint);
    expect(upturned.rationaleHint).toContain("올라간");
    expect(flat.rationaleHint).toContain("수평");
  });
});

describe("deriveTotalScore", () => {
  it("총점은 7.0~9.7 구간 안에 있다 (Phase 14 확장)", () => {
    const scores = scoreRegions(buildMetrics());
    const total = deriveTotalScore(scores);
    expect(total).toBeGreaterThanOrEqual(7.0);
    expect(total).toBeLessThanOrEqual(9.7);
  });

  it("균형감 점수에 가중치가 걸려서, 균형감이 높으면 총점이 높아진다", () => {
    const lowBalance = scoreRegions(
      buildMetrics({ samjeong: { upper: 0.5, middle: 0.3, lower: 0.2 } })
    );
    const highBalance = scoreRegions(
      buildMetrics({ samjeong: { upper: 0.33, middle: 0.34, lower: 0.33 } })
    );
    expect(deriveTotalScore(highBalance)).toBeGreaterThanOrEqual(
      deriveTotalScore(lowBalance)
    );
  });

  it("소수점 1자리 정밀도", () => {
    const total = deriveTotalScore(scoreRegions(buildMetrics()));
    expect(total * 10).toBeCloseTo(Math.round(total * 10), 5);
  });

  it("빈 배열 입력에 안전한 기본값 반환", () => {
    expect(deriveTotalScore([])).toBe(8.0);
  });
});
