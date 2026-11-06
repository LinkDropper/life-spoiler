import { toRosterFortuneType, toRosterItem } from "../cast-roster";

import type { ProfileWithFortunes } from "@/libs/stores/profile/types";
import type { FortuneRow } from "@/libs/supabase/types";

const fortune = (fortune_type: FortuneRow["fortune_type"]): FortuneRow => ({
  id: `fortune-${fortune_type}`,
  profile_id: "p-1",
  fortune_type,
  year: 0,
  result: {},
  paid_at: "2026-05-01T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
});

const profile = (
  types: FortuneRow["fortune_type"][] = []
): ProfileWithFortunes =>
  ({
    id: "p-1",
    name: "지수",
    fortunes: types.map(fortune),
    profile_free_access: [],
  }) as unknown as ProfileWithFortunes;

describe("toRosterFortuneType", () => {
  it("아는 운세만 받는다", () => {
    expect(toRosterFortuneType("past-life")).toBe("past-life");
    expect(toRosterFortuneType("compatibility")).toBeNull();
    expect(toRosterFortuneType(null)).toBeNull();
  });
});

describe("toRosterItem", () => {
  it("소장한 운세로 들어오면 본편으로", () => {
    expect(
      toRosterItem(profile(["lifetime"]), "lifetime", "p-1")
    ).toMatchObject({
      isOwn: true,
      state: "owned",
      href: "/fortune/lifetime/p-1",
      filmography: {
        lifetime: true,
        yearly: false,
        pastLife: false,
        yearly2027: false,
      },
    });
  });

  it("없는 운세면 예고편으로", () => {
    expect(
      toRosterItem(profile(["lifetime"]), "past-life", null)
    ).toMatchObject({
      isOwn: false,
      state: "trailer",
      href: "/fortune/past-life/preview/p-1",
    });
  });

  it("오늘의 운세는 결과로 바로", () => {
    expect(toRosterItem(profile(), "daily", null)).toMatchObject({
      state: "daily",
      href: "/fortune/daily/p-1",
    });
  });

  it("운세 없이 들어오면 그 배우의 홈 상영관으로", () => {
    expect(toRosterItem(profile(), null, null)).toMatchObject({
      state: "home",
      href: "/home?profile=p-1",
    });
  });
});
