import {
  buildAgeLens,
  getMingConstellation,
  parseAgePeriod,
  rankByScore,
  toGridPoint,
  toRating,
} from "../lifetime-screen";

import type { Palace, ZiweiChart } from "@/libs/zi-wei-dou-shu/types";

const palace = (
  branch: number,
  name: string,
  star?: string,
  borrowed?: string
): Palace =>
  ({
    name,
    branch,
    mainStars: star ? [{ name: star, brightness: "旺" }] : [],
    minorStars: [],
    isShenGong: false,
    borrowedMainStars: borrowed
      ? [{ name: borrowed, brightness: "旺" }]
      : undefined,
  }) as unknown as Palace;

const chart = {
  mingGong: 5,
  palaces: Array.from({ length: 12 }, (_, branch) => {
    if (branch === 5) return palace(branch, "명궁", "천부");
    if (branch === 9) return palace(branch, "관록궁", "천상");
    if (branch === 1) return palace(branch, "재백궁", undefined, "무곡");
    if (branch === 11) return palace(branch, "천이궁", "칠살");
    return palace(branch, `궁${branch}`);
  }),
} as unknown as ZiweiChart;

describe("getMingConstellation", () => {
  it("명궁과 삼방사정 세 궁을 그리드 자리와 함께 돌려준다", () => {
    const stars = getMingConstellation(chart);

    expect(stars.map((star) => [star.role, star.palaceName])).toEqual([
      ["self", "명궁"],
      ["triangle1", "관록궁"],
      ["triangle2", "재백궁"],
      ["opposite", "천이궁"],
    ]);
    expect(stars[0]).toMatchObject({ row: 1, col: 1, starName: "천부" });
  });

  it("空宮이면 차용 주성 이름을 쓴다", () => {
    expect(getMingConstellation(chart)[2].starName).toBe("무곡");
  });
});

describe("toGridPoint", () => {
  it("칸 가운데를 비율 좌표로 준다", () => {
    expect(toGridPoint({ row: 1, col: 1 })).toEqual({ x: 0.125, y: 0.125 });
  });
});

describe("parseAgePeriod", () => {
  it("한국어·영어·끝이 열린 구간을 읽는다", () => {
    expect(parseAgePeriod("25~34세")).toEqual({ start: 25, end: 34 });
    expect(parseAgePeriod("Ages 25-34")).toEqual({ start: 25, end: 34 });
    expect(parseAgePeriod("95세~")).toEqual({ start: 95, end: null });
    expect(parseAgePeriod("시기")).toBeNull();
  });
});

describe("buildAgeLens", () => {
  const periods = ["5~14세", "15~24세", "25~34세", "35~44세"];

  it("지금 시기·다음 시기·남은 해·진행 비율을 계산한다", () => {
    expect(buildAgeLens(periods, 27)).toEqual({
      nowIndex: 2,
      isOutside: false,
      nextIndex: 3,
      yearsToNext: 8,
      progress: 0.2,
    });
  });

  it("첫 구간보다 어리면 첫 시기를 펼치고 남은 해는 숨긴다", () => {
    expect(buildAgeLens(periods, 3)).toMatchObject({
      nowIndex: 0,
      isOutside: true,
      yearsToNext: null,
    });
  });

  it("마지막 구간을 넘으면 마지막 시기를 펼친다", () => {
    expect(buildAgeLens(periods, 60)).toMatchObject({
      nowIndex: 3,
      isOutside: true,
      nextIndex: -1,
    });
  });

  it("구간 수가 10이 아니어도 같은 규칙", () => {
    expect(buildAgeLens(["4~13세", "14~23세"], 20).nowIndex).toBe(1);
  });
});

describe("toRating", () => {
  it("점수를 10점 만점과 별 개수로", () => {
    expect(toRating(82)).toEqual({ ten: "8.2", stars: 4 });
    expect(toRating(150)).toEqual({ ten: "10.0", stars: 5 });
  });
});

describe("rankByScore", () => {
  it("높은 순으로 순위를 매기고 같은 점수는 같은 순위", () => {
    expect(
      rankByScore({ wealth: 82, career: 76, relationship: 68, health: 76 })
    ).toEqual({ wealth: 1, career: 2, relationship: 4, health: 2 });
  });
});
