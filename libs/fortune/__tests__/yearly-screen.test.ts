import {
  buildMonthLens,
  formatYearGanji,
  pickNextAfterYearly,
  rankMonths,
  toYearFlow,
} from "../yearly-screen";

import type { ProfileWithFortunes } from "@/libs/stores/profile/types";
import type { FortuneRow } from "@/libs/supabase/types";

const SCORES = [58, 62, 70, 74, 66, 61, 55, 68, 72, 64, 77, 60];

const profileOwning = (
  types: FortuneRow["fortune_type"][]
): ProfileWithFortunes =>
  ({
    id: "profile-1",
    fortunes: types.map((fortune_type) => ({
      id: `fortune-${fortune_type}`,
      profile_id: "profile-1",
      fortune_type,
      year: 0,
      result: {},
      paid_at: "2026-05-01",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    })),
    profile_free_access: [],
  }) as unknown as ProfileWithFortunes;

describe("rankMonths / toYearFlow", () => {
  it("점수 높은 순, 같은 점수는 앞선 달 먼저", () => {
    expect(rankMonths([60, 70, 70, 50])).toEqual([2, 3, 1, 4]);
  });

  it("최고의 달 3개와 조심할 달 3개(낮은 순)", () => {
    expect(toYearFlow(SCORES)).toMatchObject({
      bestMonths: [11, 4, 9],
      cautionMonths: [7, 1, 12],
    });
  });
});

describe("formatYearGanji", () => {
  it("언어별 연도 간지", () => {
    expect(formatYearGanji(2026, "ko")).toBe("병오년");
    expect(formatYearGanji(2026, "ja")).toBe("丙午年");
    expect(formatYearGanji(2027, "en")).toBe("Ding-Wei year");
  });
});

describe("buildMonthLens", () => {
  it("그해를 지나는 중이면 이번 달을 펼치고 달 안 진행률을 준다", () => {
    expect(buildMonthLens(2026, new Date(2026, 10, 5))).toEqual({
      focusMonth: 11,
      mode: "current",
      nextMonth: 12,
      progress: 4 / 30,
      today: 5,
      monthsLeft: 1,
    });
  });

  it("12월이면 다음 달이 없다", () => {
    expect(buildMonthLens(2026, new Date(2026, 11, 20)).nextMonth).toBeNull();
  });

  it("아직 오지 않은 해는 1월, 지난해는 12월을 펼친다", () => {
    const now = new Date(2026, 10, 5);
    expect(buildMonthLens(2027, now)).toMatchObject({
      focusMonth: 1,
      mode: "upcoming",
      progress: null,
    });
    expect(buildMonthLens(2025, now)).toMatchObject({
      focusMonth: 12,
      mode: "past",
      nextMonth: null,
    });
  });
});

describe("pickNextAfterYearly", () => {
  it("인생 운세가 없으면 인생 운세", () => {
    expect(pickNextAfterYearly(profileOwning(["yearly"]), "yearly")).toBe(
      "lifetime"
    );
  });

  it("인생 운세가 있으면 아직 안 본 다음 운세, 지금 보는 운세는 빼고", () => {
    expect(
      pickNextAfterYearly(profileOwning(["lifetime", "yearly"]), "yearly")
    ).toBe("yearly2027");
    expect(
      pickNextAfterYearly(
        profileOwning(["lifetime", "yearly_2027"]),
        "yearly_2027"
      )
    ).toBe("yearly");
  });
});
