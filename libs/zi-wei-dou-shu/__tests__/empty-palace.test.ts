import { generateZiweiChart } from "../core";
import {
  getEffectiveMainStars,
  resolveEmptyPalaces,
} from "../calculators/empty-palace";
import type { BranchIndex, Palace, StarInfo } from "../types";

const PALACE_NAMES = [
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

const star = (name: string, brightness: StarInfo["brightness"]): StarInfo => ({
  name,
  brightness,
});

/**
 * branch(0-11) → mainStars 맵으로 12궁 픽스처 생성
 */
const buildPalaces = (
  starsByBranch: Partial<Record<number, StarInfo[]>>
): Palace[] =>
  PALACE_NAMES.map((name, branch) => ({
    name,
    branch: branch as BranchIndex,
    stem: 0,
    mainStars: starsByBranch[branch] ?? [],
    minorStars: [],
    isShenGong: false,
  }));

describe("resolveEmptyPalaces", () => {
  it("주성이 있는 궁은 isEmptyPalace=false로 표시하고 그대로 둔다", () => {
    const palaces = buildPalaces({ 0: [star("자미", "묘")] });
    const resolved = resolveEmptyPalaces(palaces);

    const target = resolved.find((p) => p.branch === 0)!;
    expect(target.isEmptyPalace).toBe(false);
    expect(target.mainStars).toEqual([star("자미", "묘")]);
    expect(target.borrowedMainStars).toBeUndefined();
  });

  it("대궁(본궁+6)에 주성이 있으면 대궁에서 차용한다", () => {
    const palaces = buildPalaces({ 6: [star("태양", "왕")] });
    const resolved = resolveEmptyPalaces(palaces);

    const target = resolved.find((p) => p.branch === 0)!;
    expect(target.isEmptyPalace).toBe(true);
    expect(target.mainStars).toEqual([]); // 원본 mainStars는 덮어쓰지 않는다
    expect(target.borrowedMainStars).toEqual([star("태양", "왕")]);
    expect(target.borrowedFromPalace).toBe(resolved[6].name);
  });

  it("대궁도 空宮이면 삼합궁(본궁+4/+8) 중 주성이 있는 쪽에서 차용한다", () => {
    // branch 0 본궁, branch 6 대궁(空), branch 4 삼합1에만 주성
    const palaces = buildPalaces({ 4: [star("천기", "리")] });
    const resolved = resolveEmptyPalaces(palaces);

    const target = resolved.find((p) => p.branch === 0)!;
    expect(target.isEmptyPalace).toBe(true);
    expect(target.borrowedMainStars).toEqual([star("천기", "리")]);
    expect(target.borrowedFromPalace).toBe(resolved[4].name);
  });

  it("삼합궁 둘 다 주성이 있으면 주성 개수가 더 많은 쪽을 차용한다", () => {
    const palaces = buildPalaces({
      4: [star("천기", "함")], // 1개
      8: [star("칠살", "묘"), star("파군", "왕")], // 2개
    });
    const resolved = resolveEmptyPalaces(palaces);

    const target = resolved.find((p) => p.branch === 0)!;
    expect(target.borrowedFromPalace).toBe(resolved[8].name);
    expect(target.borrowedMainStars?.length).toBe(2);
  });

  it("본궁·대궁·삼합궁 전체가 空宮이면 차용 없이 isEmptyPalace만 true다", () => {
    const palaces = buildPalaces({});
    const resolved = resolveEmptyPalaces(palaces);

    const target = resolved.find((p) => p.branch === 0)!;
    expect(target.isEmptyPalace).toBe(true);
    expect(target.borrowedMainStars).toBeUndefined();
    expect(target.borrowedFromPalace).toBeUndefined();
  });
});

describe("getEffectiveMainStars", () => {
  it("주성이 있으면 원래 주성을 반환한다", () => {
    const palace: Palace = {
      name: "명궁",
      branch: 0,
      stem: 0,
      mainStars: [star("자미", "묘")],
      minorStars: [],
      isShenGong: false,
    };
    expect(getEffectiveMainStars(palace)).toEqual([star("자미", "묘")]);
  });

  it("空宮이면 차용 주성을 반환한다", () => {
    const palace: Palace = {
      name: "명궁",
      branch: 0,
      stem: 0,
      mainStars: [],
      minorStars: [],
      isShenGong: false,
      isEmptyPalace: true,
      borrowedMainStars: [star("태양", "왕")],
      borrowedFromPalace: "천이궁",
    };
    expect(getEffectiveMainStars(palace)).toEqual([star("태양", "왕")]);
  });

  it("차용 주성도 없으면 빈 배열을 반환한다", () => {
    const palace: Palace = {
      name: "명궁",
      branch: 0,
      stem: 0,
      mainStars: [],
      minorStars: [],
      isShenGong: false,
      isEmptyPalace: true,
    };
    expect(getEffectiveMainStars(palace)).toEqual([]);
  });
});

describe("generateZiweiChart 통합: 空宮 차용이 실제 명반에 반영된다", () => {
  it("1990-05-01 12:00 남성(양력) 명반에서 관록궁은 空宮이며 부처궁(대궁)에서 차용한다", () => {
    const chart = generateZiweiChart({
      name: "test",
      birthDate: "1990-05-01",
      birthTime: "12:00",
      gender: "male",
      calendarType: "solar",
    });

    const gwanlok = chart.palaces.find((p) => p.name === "관록궁")!;
    expect(gwanlok.mainStars).toEqual([]);
    expect(gwanlok.isEmptyPalace).toBe(true);
    expect(gwanlok.borrowedFromPalace).toBe("부처궁");
    expect(gwanlok.borrowedMainStars?.map((s) => s.name)).toEqual([
      "태양",
      "천량",
    ]);
  });
});
