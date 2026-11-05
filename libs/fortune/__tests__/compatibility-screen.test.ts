import {
  COMPATIBILITY_STORY_KEYS,
  getStoryScore,
  pickNextAfterCompatibility,
  toCompatibilityGenre,
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
