import { buildChartSnapshot } from "../chart-snapshot";
import {
  LANDING_PROTAGONIST,
  buildLandingCinemaData,
} from "../landing-cinema-data";

describe("buildChartSnapshot", () => {
  const input = {
    name: "landing",
    ...LANDING_PROTAGONIST,
    calendarType: "solar" as const,
  };

  it("12궁을 빠짐없이 담고 명궁 지지를 그 안에서 가리킨다", () => {
    const snapshot = buildChartSnapshot(input, "ko");

    expect(snapshot.cells).toHaveLength(12);
    expect(new Set(snapshot.cells.map((cell) => cell.branch)).size).toBe(12);
    expect(
      snapshot.cells.find((cell) => cell.branch === snapshot.mingBranch)
        ?.palaceKey
    ).toBe("명궁");
  });

  it("나 → 돈 → 일 → 연애 순서로 네 궁의 해석을 만든다", () => {
    const snapshot = buildChartSnapshot(input, "ko");

    expect(snapshot.focuses.map((focus) => focus.palaceKey)).toEqual([
      "명궁",
      "재백궁",
      "관록궁",
      "부처궁",
    ]);
    snapshot.focuses.forEach((focus) => {
      expect(focus.title).not.toBe("");
      expect(focus.reading).not.toBe("");
    });
  });

  it("해석은 첫 문장만 남긴다 (공백 없는 일본어 마침표 포함)", () => {
    const ja = buildChartSnapshot(input, "ja");

    ja.focuses.forEach((focus) => {
      const periods = focus.reading.match(/。/g) ?? [];
      expect(periods.length).toBeLessThanOrEqual(1);
    });
  });

  it("대운 장면은 겹치지 않고 나이순으로 이어진다", () => {
    const { frames } = buildChartSnapshot(input, "ko");

    frames.slice(1).forEach((frame, index) => {
      expect(frame.startAge).toBe(frames[index].endAge + 1);
    });
  });
});

describe("buildLandingCinemaData", () => {
  it("12시진 모두 같은 생일로 계산하고, 시간이 바뀌면 명궁 자리가 옮겨간다", () => {
    const { hours } = buildLandingCinemaData("ko");

    expect(hours.map((hour) => hour.branch)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
    expect(new Set(hours.map((hour) => hour.mingBranch)).size).toBe(12);
  });

  it("시진 범위는 자시 23~1시부터 2시간씩 이어진다", () => {
    const { hours } = buildLandingCinemaData("ko");

    expect(hours[0]).toMatchObject({ label: "자", fromHour: 23, toHour: 1 });
    expect(hours[11]).toMatchObject({ label: "해", fromHour: 21, toHour: 23 });
  });
});
