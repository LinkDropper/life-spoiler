import {
  calculateLifetimeCategoryScores,
  calculateLifetimeRawScores,
  scorePalace,
  toLifetimeDisplayScore,
} from "../calculators/lifetime-score";
import { resolveEmptyPalaces } from "../calculators/empty-palace";
import { generateZiweiChart } from "../core";
import type { BranchIndex, Palace, StarInfo, ZiweiChart } from "../types";

const NAMES = [
  "명궁",
  "형제궁",
  "부처궁",
  "자녀궁",
  "재백궁",
  "질액궁",
  "천이궁",
  "교우궁",
  "관록궁",
  "전택궁",
  "복덕궁",
  "부모궁",
] as const;

const star = (
  name: string,
  brightness: StarInfo["brightness"] = "리",
  sihua?: StarInfo["sihua"]
): StarInfo => ({ name, brightness, sihua });

/** 12궁 픽스처: 지지 = 궁 인덱스. 모든 궁에 기본 주성 1개(리)를 둔다. */
const buildChart = (
  overrides: Partial<Record<string, Partial<Palace>>> = {}
): ZiweiChart => {
  const base = generateZiweiChart({
    name: "t",
    birthDate: "1990-05-15",
    birthTime: "10:30",
    gender: "male",
    calendarType: "solar",
  });
  const palaces: Palace[] = NAMES.map((name, branch) => ({
    name,
    branch: branch as BranchIndex,
    stem: 0,
    mainStars: [star("자미")],
    minorStars: [],
    isShenGong: false,
    ...overrides[name],
  }));
  return { ...base, palaces: resolveEmptyPalaces(palaces) };
};

describe("lifetime-score", () => {
  it("같은 입력은 같은 점수를 낸다", () => {
    const input = {
      name: "t",
      birthDate: "1988-03-02",
      birthTime: "07:10",
      gender: "female" as const,
      calendarType: "solar" as const,
    };
    const a = calculateLifetimeCategoryScores(generateZiweiChart(input));
    const b = calculateLifetimeCategoryScores(generateZiweiChart(input));
    expect(a).toEqual(b);
  });

  it("표시 점수는 40~95 정수이고 극단 원점수도 범위를 벗어나지 않는다", () => {
    expect(toLifetimeDisplayScore("wealth", -1000)).toBe(40);
    expect(toLifetimeDisplayScore("wealth", 1000)).toBe(95);
    const scores = calculateLifetimeCategoryScores(buildChart());
    Object.values(scores).forEach((value) => {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(40);
      expect(value).toBeLessThanOrEqual(95);
    });
  });

  it("원점수가 높을수록 표시 점수가 줄지 않는다", () => {
    const scores = [-10, -3, 0, 2, 5, 9, 15].map((raw) =>
      toLifetimeDisplayScore("career", raw)
    );
    expect([...scores].sort((a, b) => a - b)).toEqual(scores);
  });

  it("대상 궁의 화록은 올리고 화기는 내린다", () => {
    const neutral = calculateLifetimeRawScores(buildChart()).wealth;
    const lu = calculateLifetimeRawScores(
      buildChart({ 재백궁: { mainStars: [star("자미", "리", "화록")] } })
    ).wealth;
    const ji = calculateLifetimeRawScores(
      buildChart({ 재백궁: { mainStars: [star("자미", "리", "화기")] } })
    ).wealth;
    expect(lu).toBeGreaterThan(neutral);
    expect(ji).toBeLessThan(neutral);
    expect(lu).toBeGreaterThan(ji);
  });

  it("같은 사화라도 대궁은 본궁보다 영향이 작다", () => {
    const neutral = calculateLifetimeRawScores(buildChart()).career;
    // 관록궁(8)의 대궁 = 지지 2 = 부처궁
    const self = calculateLifetimeRawScores(
      buildChart({ 관록궁: { mainStars: [star("자미", "리", "화록")] } })
    ).career;
    const opposite = calculateLifetimeRawScores(
      buildChart({ 부처궁: { mainStars: [star("자미", "리", "화록")] } })
    ).career;
    expect(self - neutral).toBeGreaterThan(opposite - neutral);
    expect(opposite).toBeGreaterThan(neutral);
  });

  it("살성이 많은 궁은 보좌성이 많은 궁보다 낮다", () => {
    const good = buildChart({
      질액궁: {
        minorStars: ["좌보", "우필", "문창", "문곡", "천괴"].map((n) =>
          star(n)
        ),
      },
    });
    const bad = buildChart({
      질액궁: {
        minorStars: ["양인", "타라", "화성", "영성", "지겁"].map((n) =>
          star(n)
        ),
      },
    });
    expect(calculateLifetimeRawScores(good).health).toBeGreaterThan(
      calculateLifetimeRawScores(bad).health
    );
    expect(calculateLifetimeCategoryScores(good).health).toBeGreaterThanOrEqual(
      calculateLifetimeCategoryScores(bad).health
    );
  });

  it("공궁은 차성(대궁 주성)을 감쇠해서 반영한다", () => {
    const strong = [star("자미", "묘"), star("천부", "묘")];
    const chart = buildChart({
      재백궁: { mainStars: [] },
      질액궁: { mainStars: [] },
      // 재백궁(4)의 대궁 = 지지 10 = 복덕궁
      복덕궁: { mainStars: strong },
    });
    const wealthPalace = chart.palaces.find((p) => p.name === "재백궁");
    expect(wealthPalace?.isEmptyPalace).toBe(true);
    expect(wealthPalace?.borrowedMainStars).toEqual(strong);

    const borrowed = scorePalace(wealthPalace as Palace, "wealth");
    const real = scorePalace(
      { ...(wealthPalace as Palace), mainStars: strong },
      "wealth"
    );
    expect(borrowed).toBeGreaterThan(0);
    expect(borrowed).toBeLessThan(real);
  });
});
