import { buildMenuLineup, summarizeCoupons } from "../menu-lineup";

import type { ProfileWithFortunes } from "@/libs/stores/profile/types";
import type { FortuneRow } from "@/libs/supabase/types";

const createProfile = (
  overrides: Partial<ProfileWithFortunes> = {}
): ProfileWithFortunes => ({
  id: "profile-1",
  user_id: "user-1",
  name: "지수",
  birth_date: "1995-06-15",
  birth_time: "21:30:00",
  birth_time_unknown: false,
  calendar_type: "solar",
  gender: "female",
  relationship_status: null,
  relationship_status_custom: null,
  occupation_status: null,
  occupation_status_custom: null,
  relationship_to_user: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  fortunes: [],
  profile_free_access: [],
  ...overrides,
});

const paidFortune = (fortuneType: FortuneRow["fortune_type"]): FortuneRow => ({
  id: `fortune-${fortuneType}`,
  profile_id: "profile-1",
  fortune_type: fortuneType,
  year: 0,
  result: {},
  paid_at: "2026-02-01T00:00:00Z",
  created_at: "2026-02-01T00:00:00Z",
  updated_at: "2026-02-01T00:00:00Z",
});

describe("buildMenuLineup", () => {
  it("오늘의 운세를 맨 위에, 본 운세를 맨 아래에 둔다", () => {
    const profile = createProfile({ fortunes: [paidFortune("lifetime")] });
    const lineup = buildMenuLineup({
      profile,
      isLoggedIn: true,
      showUniverse: true,
    });

    expect(lineup[0]).toEqual({
      key: "daily",
      href: "/fortune/daily/profile-1",
      status: null,
    });
    expect(lineup.at(-1)).toEqual({
      key: "lifetime",
      href: "/fortune/lifetime/profile-1",
      status: "owned",
    });
    expect(lineup.map((show) => show.key)).toEqual([
      "daily",
      "yearly",
      "compatibility",
      "faceReading",
      "pastLife",
      "yearly2027",
      "universe",
      "lifetime",
    ]);
  });

  it("안 본 운세는 미리보기로 보낸다", () => {
    const lineup = buildMenuLineup({
      profile: createProfile(),
      isLoggedIn: true,
      showUniverse: false,
    });

    expect(lineup.find((show) => show.key === "yearly")?.href).toBe(
      "/fortune/yearly/preview/profile-1"
    );
  });

  it("비로그인이면 프로필 운세는 로그인으로 보내고 인생 운세에 예고편 무료를 단다", () => {
    const lineup = buildMenuLineup({
      profile: null,
      isLoggedIn: false,
      showUniverse: true,
    });

    expect(lineup.find((show) => show.key === "daily")?.href).toBe("/login");
    expect(lineup.find((show) => show.key === "lifetime")).toEqual({
      key: "lifetime",
      href: "/login",
      status: "trailer",
    });
    expect(lineup.find((show) => show.key === "compatibility")?.href).toBe(
      "/compatibility"
    );
    expect(lineup.find((show) => show.key === "universe")?.status).toBe("free");
  });

  it("로그인했지만 프로필이 없으면 오늘의 운세는 프로필 입력으로 보낸다", () => {
    const lineup = buildMenuLineup({
      profile: null,
      isLoggedIn: true,
      showUniverse: false,
    });

    expect(lineup[0].href).toBe("/profile/setup");
  });

  it("KO가 아니면 친구 별자리를 빼낸다", () => {
    const lineup = buildMenuLineup({
      profile: null,
      isLoggedIn: false,
      showUniverse: false,
    });

    expect(lineup.some((show) => show.key === "universe")).toBe(false);
  });
});

describe("summarizeCoupons", () => {
  it("사용 가능한 쿠폰 수와 가장 빠른 기한을 돌려준다", () => {
    expect(
      summarizeCoupons([
        { status: "active", validUntil: "2026-12-31T00:00:00Z" },
        { status: "active", validUntil: "2026-11-30T00:00:00Z" },
        { status: "active", validUntil: null },
        { status: "used", validUntil: "2026-11-10T00:00:00Z" },
      ])
    ).toEqual({ count: 3, earliestExpiry: "2026-11-30T00:00:00Z" });
  });

  it("쿠폰이 없으면 0장, 기한 없음", () => {
    expect(summarizeCoupons([])).toEqual({ count: 0, earliestExpiry: null });
  });
});
