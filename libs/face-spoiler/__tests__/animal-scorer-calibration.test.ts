import { scoreAnimals } from "../animal-scorer";
import type { FaceMetrics } from "../face-shape-analyzer";
import type { AnimalType } from "../constants/animals";

/**
 * 실측 캘리브레이션 테스트.
 *
 * 한국인 12장(포즈 게이트 통과분)의 실측 measurements를 입력해
 * 분류 결과 분포가 다양화되는지 검증한다.
 * - 단일 동물이 70% 이상 차지하면 실패
 * - dog 비율은 50% 이하
 * - 최소 4종 이상의 primary 등장
 *
 * 출처: `a.md` (2026-04 캘리브레이션 세션 15장 중 pose 초과 3장 제외).
 */

interface SamplePhoto {
  filename: string;
  metrics: FaceMetrics;
}

const build = (overrides: Partial<FaceMetrics>): FaceMetrics => ({
  faceShape: { category: "round", label: "둥근 편", confidence: "high" },
  faceRatio: 0.95,
  jawWidthRatio: 0.96,
  jawAngularity: 0,
  foreheadWidthRatio: 0.9,
  eyeAspectRatio: 3.3,
  eyeCornerAngle: 6,
  eyeSpacingRatio: 0.27,
  eyeSizeRatio: 0.06,
  noseLengthRatio: 0.22,
  mouthWidthRatio: 0.37,
  philtrumRatio: 0.4,
  samjeong: { upper: 0.18, middle: 0.4, lower: 0.42 },
  ...overrides,
});

const SAMPLES: SamplePhoto[] = [
  {
    filename: "KakaoTalk_2026-04-10-15-29-16-1",
    metrics: build({
      faceRatio: 0.91,
      eyeAspectRatio: 4.45,
      eyeCornerAngle: 5.46,
      eyeSpacingRatio: 0.28,
      eyeSizeRatio: 0.05,
      noseLengthRatio: 0.24,
      mouthWidthRatio: 0.38,
      philtrumRatio: 0.42,
      samjeong: { upper: 0.18, middle: 0.43, lower: 0.39 },
    }),
  },
  {
    filename: "KakaoTalk_2026-04-14-21-49-43_003",
    metrics: build({
      faceRatio: 1.19,
      jawWidthRatio: 0.96,
      eyeAspectRatio: 2.77,
      eyeCornerAngle: 8.5,
      eyeSpacingRatio: 0.27,
      eyeSizeRatio: 0.06,
      noseLengthRatio: 0.24,
      mouthWidthRatio: 0.35,
      philtrumRatio: 0.35,
      samjeong: { upper: 0.2, middle: 0.4, lower: 0.39 },
    }),
  },
  {
    filename: "KakaoTalk_2026-04-14-21-49-43_004",
    metrics: build({
      faceRatio: 0.92,
      eyeAspectRatio: 3.52,
      eyeCornerAngle: 4.9,
      eyeSpacingRatio: 0.25,
      eyeSizeRatio: 0.06,
      noseLengthRatio: 0.22,
      mouthWidthRatio: 0.37,
      philtrumRatio: 0.44,
      samjeong: { upper: 0.18, middle: 0.4, lower: 0.42 },
    }),
  },
  {
    filename: "KakaoTalk_2026-04-14-21-49-43_005",
    metrics: build({
      faceRatio: 0.87,
      eyeAspectRatio: 3.86,
      eyeCornerAngle: 7.38,
      eyeSpacingRatio: 0.27,
      eyeSizeRatio: 0.06,
      noseLengthRatio: 0.2,
      mouthWidthRatio: 0.39,
      philtrumRatio: 0.43,
      samjeong: { upper: 0.18, middle: 0.37, lower: 0.45 },
    }),
  },
  {
    filename: "download",
    metrics: build({
      faceRatio: 1.48,
      eyeAspectRatio: 2.33,
      eyeCornerAngle: 9.55,
      eyeSpacingRatio: 0.25,
      eyeSizeRatio: 0.06,
      noseLengthRatio: 0.22,
      mouthWidthRatio: 0.38,
      philtrumRatio: 0.32,
      samjeong: { upper: 0.19, middle: 0.39, lower: 0.42 },
    }),
  },
  {
    filename: "download_1",
    metrics: build({
      faceRatio: 1.22,
      jawWidthRatio: 0.95,
      eyeAspectRatio: 2.52,
      eyeCornerAngle: 8.73,
      eyeSpacingRatio: 0.29,
      eyeSizeRatio: 0.07,
      noseLengthRatio: 0.21,
      mouthWidthRatio: 0.37,
      philtrumRatio: 0.38,
      samjeong: { upper: 0.18, middle: 0.41, lower: 0.41 },
    }),
  },
  {
    filename: "download_2",
    metrics: build({
      faceRatio: 0.89,
      eyeAspectRatio: 3.94,
      eyeCornerAngle: 4.55,
      eyeSpacingRatio: 0.24,
      eyeSizeRatio: 0.05,
      noseLengthRatio: 0.23,
      mouthWidthRatio: 0.36,
      philtrumRatio: 0.42,
      samjeong: { upper: 0.16, middle: 0.4, lower: 0.43 },
    }),
  },
  {
    filename: "download_3",
    metrics: build({
      faceRatio: 1.41,
      jawWidthRatio: 0.95,
      eyeAspectRatio: 2.31,
      eyeCornerAngle: 7.03,
      eyeSpacingRatio: 0.26,
      eyeSizeRatio: 0.06,
      noseLengthRatio: 0.21,
      mouthWidthRatio: 0.34,
      philtrumRatio: 0.42,
      samjeong: { upper: 0.18, middle: 0.38, lower: 0.44 },
    }),
  },
  {
    filename: "download_4",
    metrics: build({
      faceRatio: 1.68,
      jawWidthRatio: 0.95,
      eyeAspectRatio: 2.83,
      eyeCornerAngle: 4.8,
      eyeSpacingRatio: 0.27,
      eyeSizeRatio: 0.04,
      noseLengthRatio: 0.21,
      mouthWidthRatio: 0.38,
      philtrumRatio: 0.4,
      samjeong: { upper: 0.18, middle: 0.38, lower: 0.44 },
    }),
  },
  {
    filename: "download_5",
    metrics: build({
      faceRatio: 1.11,
      jawWidthRatio: 0.94,
      eyeAspectRatio: 2.63,
      eyeCornerAngle: 9.3,
      eyeSpacingRatio: 0.28,
      eyeSizeRatio: 0.07,
      noseLengthRatio: 0.22,
      mouthWidthRatio: 0.34,
      philtrumRatio: 0.35,
      samjeong: { upper: 0.19, middle: 0.4, lower: 0.41 },
    }),
  },
  {
    filename: "download_6",
    metrics: build({
      faceRatio: 0.79,
      jawWidthRatio: 0.95,
      eyeAspectRatio: 4.32,
      eyeCornerAngle: 4.84,
      eyeSpacingRatio: 0.27,
      eyeSizeRatio: 0.06,
      noseLengthRatio: 0.21,
      mouthWidthRatio: 0.32,
      philtrumRatio: 0.44,
      samjeong: { upper: 0.18, middle: 0.37, lower: 0.45 },
    }),
  },
];

describe("scoreAnimals — 실측 캘리브레이션 분포", () => {
  it("12장을 분류했을 때 분포가 다양하고 dog 편향이 해소된다", () => {
    const counts = new Map<AnimalType, number>();
    const results: Array<{ filename: string; primary: AnimalType }> = [];

    for (const sample of SAMPLES) {
      const { primary } = scoreAnimals(sample.metrics);
      counts.set(primary, (counts.get(primary) ?? 0) + 1);
      results.push({ filename: sample.filename, primary });
    }

    // 디버그 — 어떤 동물로 분류됐는지 확인용
    console.log("[calibration] distribution", Object.fromEntries(counts));
    console.log("[calibration] per-photo", results);

    const total = SAMPLES.length;
    const dogCount = counts.get("dog") ?? 0;
    const maxCount = Math.max(...counts.values());
    const uniqueAnimals = counts.size;

    expect(dogCount / total).toBeLessThanOrEqual(0.5);
    expect(maxCount / total).toBeLessThan(0.7);
    expect(uniqueAnimals).toBeGreaterThanOrEqual(4);
  });
});
