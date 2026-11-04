import {
  getFortuneHref,
  getTimetableKeys,
  orderHomeProfiles,
  selectHomeProfile,
  pickNextFortune,
  pickOwnProfile,
  readLifeSpoiler,
  resolveHomeState,
} from "../home-profile";

import type { ProfileWithFortunes } from "@/libs/stores/profile/types";
import type { FortuneRow, ProfileFreeAccessRow } from "@/libs/supabase/types";

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

const createFortune = (overrides: Partial<FortuneRow>): FortuneRow => ({
  id: "fortune-1",
  profile_id: "profile-1",
  fortune_type: "lifetime",
  year: 0,
  result: {},
  paid_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

const spoilerResult = (lifeSpoiler: Record<string, string>) => ({
  interpretation: { lifeSpoiler },
});

describe("pickOwnProfile", () => {
  it("프로필이 없으면 null을 돌려준다", () => {
    expect(pickOwnProfile([])).toBeNull();
  });

  it("목록 순서와 상관없이 가장 먼저 만든 프로필을 고른다", () => {
    const own = createProfile({
      id: "own",
      created_at: "2025-03-01T00:00:00Z",
    });
    const friend = createProfile({
      id: "friend",
      created_at: "2026-02-01T00:00:00Z",
    });

    expect(pickOwnProfile([friend, own])?.id).toBe("own");
    expect(pickOwnProfile([own, friend])?.id).toBe("own");
  });
});

describe("selectHomeProfile", () => {
  const own = createProfile({ id: "own", created_at: "2025-03-01T00:00:00Z" });
  const friend = createProfile({
    id: "friend",
    created_at: "2026-02-01T00:00:00Z",
  });

  it("고른 게 없으면 처음 만든 프로필", () => {
    expect(selectHomeProfile([friend, own], null)?.id).toBe("own");
  });

  it("고른 프로필이 있으면 그 프로필", () => {
    expect(selectHomeProfile([friend, own], "friend")?.id).toBe("friend");
  });

  it("고른 프로필이 사라졌으면 처음 만든 프로필로 돌아간다", () => {
    expect(selectHomeProfile([own], "friend")?.id).toBe("own");
  });

  it("셀렉트 순서는 본인 먼저, 만든 순서", () => {
    expect(orderHomeProfiles([friend, own]).map((p) => p.id)).toEqual([
      "own",
      "friend",
    ]);
  });
});

describe("readLifeSpoiler", () => {
  it("headline과 description을 꺼낸다", () => {
    expect(
      readLifeSpoiler(
        spoilerResult({
          headline: "🌙 늦게 피는 설계자",
          description: "이유 한 문장",
          oneLiner: "한 줄",
        })
      )
    ).toEqual({ headline: "🌙 늦게 피는 설계자", subline: "이유 한 문장" });
  });

  it("description이 없으면 oneLiner를 보조 문구로 쓴다", () => {
    expect(
      readLifeSpoiler(spoilerResult({ headline: "h", oneLiner: "한 줄" }))
        .subline
    ).toBe("한 줄");
  });

  it("형식이 다르면 둘 다 null이다", () => {
    expect(readLifeSpoiler(null)).toEqual({ headline: null, subline: null });
    expect(readLifeSpoiler({ interpretation: "x" })).toEqual({
      headline: null,
      subline: null,
    });
  });
});

describe("resolveHomeState", () => {
  it("프로필이 없으면 noProfile", () => {
    expect(resolveHomeState(null).kind).toBe("noProfile");
  });

  it("인생 운세 행이 없으면 fresh", () => {
    expect(resolveHomeState(createProfile()).kind).toBe("fresh");
  });

  it("미결제 인생 운세 행이 있으면 preview", () => {
    const profile = createProfile({
      fortunes: [createFortune({ result: spoilerResult({ headline: "h" }) })],
    });

    expect(resolveHomeState(profile)).toMatchObject({
      kind: "preview",
      headline: "h",
    });
  });

  it("결제한 인생 운세가 있으면 owned와 headline", () => {
    const profile = createProfile({
      fortunes: [
        createFortune({
          paid_at: "2026-05-01",
          result: spoilerResult({ headline: "h", description: "d" }),
        }),
      ],
    });

    expect(resolveHomeState(profile)).toMatchObject({
      kind: "owned",
      headline: "h",
      subline: "d",
    });
  });

  it("무료 이용권만 있어도 owned (결과 행이 없으면 headline null)", () => {
    const access: ProfileFreeAccessRow = {
      id: "a",
      profile_id: "profile-1",
      fortune_type: "lifetime",
      expires_at: null,
    } as ProfileFreeAccessRow;
    const profile = createProfile({ profile_free_access: [access] });

    expect(resolveHomeState(profile)).toMatchObject({
      kind: "owned",
      headline: null,
    });
  });
});

describe("pickNextFortune", () => {
  const owned = (types: FortuneRow["fortune_type"][]) =>
    resolveHomeState(
      createProfile({
        fortunes: types.map((fortune_type) =>
          createFortune({ fortune_type, paid_at: "2026-05-01" })
        ),
      })
    );

  it("인생 운세 소장자에게는 올해 운세", () => {
    expect(pickNextFortune(owned(["lifetime"]))).toBe("yearly");
  });

  it("인생·올해 모두 소장하면 다음 순서인 궁합", () => {
    expect(pickNextFortune(owned(["lifetime", "yearly"]))).toBe(
      "compatibility"
    );
  });

  it("인생 운세 미소장이면 다음 편을 두지 않는다", () => {
    expect(pickNextFortune(resolveHomeState(createProfile()))).toBeNull();
  });
});

describe("getFortuneHref", () => {
  it("소장했으면 결과, 아니면 미리보기로 보낸다", () => {
    const profile = createProfile({
      fortunes: [createFortune({ paid_at: "2026-05-01" })],
    });

    expect(getFortuneHref(profile, "lifetime")).toBe(
      "/fortune/lifetime/profile-1"
    );
    expect(getFortuneHref(profile, "pastLife")).toBe(
      "/fortune/past-life/preview/profile-1"
    );
  });

  it("프로필과 무관한 운세는 고정 경로", () => {
    expect(getFortuneHref(null, "compatibility")).toBe("/compatibility");
  });
});

describe("getTimetableKeys", () => {
  it("다음 상영작은 빼고 소장한 것은 아래로", () => {
    const profile = createProfile({
      fortunes: [createFortune({ paid_at: "2026-05-01" })],
    });

    expect(getTimetableKeys(profile, "yearly")).toEqual({
      open: ["compatibility", "faceReading", "pastLife", "yearly2027"],
      owned: ["lifetime"],
    });
  });

  it("인생 운세를 아직 안 샀으면 히어로가 권하므로 뺀다", () => {
    expect(getTimetableKeys(createProfile(), null).open).toEqual([
      "yearly",
      "compatibility",
      "faceReading",
      "pastLife",
      "yearly2027",
    ]);
  });

  it("프로필이 없으면 전부 보여 준다", () => {
    expect(getTimetableKeys(null, null).open).toHaveLength(6);
  });
});
