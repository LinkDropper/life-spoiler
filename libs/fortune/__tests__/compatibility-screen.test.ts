import {
  COMPATIBILITY_STORY_KEYS,
  getStoryScore,
  pickNextAfterCompatibility,
  toCompatibilityGenre,
  toCompatibilityLineupItem,
} from "../compatibility-screen";

import type { ProfileWithFortunes } from "@/libs/stores/profile/types";
import type { FortuneRow } from "@/libs/supabase/types";

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

describe("toCompatibilityGenre", () => {
  it("관계 유형을 장르로 바꾼다", () => {
    expect(toCompatibilityGenre("lover")).toBe("romance");
    expect(toCompatibilityGenre("friend")).toBe("buddy");
    expect(toCompatibilityGenre("ex_spouse")).toBe("reunion");
    expect(toCompatibilityGenre("dog_owner")).toBe("pet");
  });

  it("관계 유형이 없거나 직접 입력이면 드라마", () => {
    expect(toCompatibilityGenre(null)).toBe("drama");
    expect(toCompatibilityGenre("custom")).toBe("drama");
  });
});

describe("getStoryScore", () => {
  it("이야기 키마다 짝이 되는 서브 점수를 돌려준다", () => {
    const subScores = {
      communication: 76,
      growthSynergy: 84,
      trustIndex: 88,
      crisisResilience: 71,
    };
    expect(
      COMPATIBILITY_STORY_KEYS.map((key) => getStoryScore(subScores, key))
    ).toEqual([76, 84, 88, 71]);
  });
});

describe("pickNextAfterCompatibility", () => {
  it("첫 번째 사람이 인생 운세가 없으면 인생 운세", () => {
    expect(pickNextAfterCompatibility(profileOwning([]))).toBe("lifetime");
  });

  it("인생·올해가 있으면 전생", () => {
    expect(
      pickNextAfterCompatibility(profileOwning(["lifetime", "yearly"]))
    ).toBe("pastLife");
  });

  it("프로필을 모르면 인생 운세", () => {
    expect(pickNextAfterCompatibility(null)).toBe("lifetime");
  });
});

describe("toCompatibilityLineupItem", () => {
  const base = {
    id: "pair-1",
    relationship_type: "friend" as const,
    relationship_type_custom: null,
    score: null,
    paid_at: null,
    result: null,
    profile_a: { name: "지수" },
    profile_b: { name: "서연" },
  };

  it("예고편 전이면 점수·한 줄 없이 예고편으로 보낸다", () => {
    expect(toCompatibilityLineupItem(base)).toMatchObject({
      nameA: "지수",
      nameB: "서연",
      genre: "buddy",
      isOwned: false,
      score: null,
      headline: null,
      starKeyA: null,
      href: "/compatibility/pair-1/fortune/preview",
    });
  });

  it("소장한 궁합은 본편으로, 해석의 한 줄을 쓴다", () => {
    const item = toCompatibilityLineupItem({
      ...base,
      score: 82,
      paid_at: "2026-11-01T00:00:00Z",
      result: {
        interpretation: { headline: "말보다 박자가 먼저 맞는 두 사람" },
      },
    });
    expect(item).toMatchObject({
      isOwned: true,
      score: 82,
      headline: "말보다 박자가 먼저 맞는 두 사람",
      href: "/compatibility/pair-1/fortune/result",
    });
  });
});
