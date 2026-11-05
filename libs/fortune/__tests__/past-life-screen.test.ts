import { pickNextAfterPastLife, toPastLifeTraits } from "../past-life-screen";

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

describe("pickNextAfterPastLife", () => {
  it("인생 운세가 없으면 인생 운세", () => {
    expect(pickNextAfterPastLife(profileOwning(["past_life"]))).toBe(
      "lifetime"
    );
  });

  it("인생·올해가 있으면 다음 해", () => {
    expect(
      pickNextAfterPastLife(profileOwning(["past_life", "lifetime", "yearly"]))
    ).toBe("yearly2027");
  });
});

describe("toPastLifeTraits", () => {
  it("score는 오른쪽 단어 쪽 비율, 기운 쪽 단어와 비율을 돌려준다", () => {
    expect(
      toPastLifeTraits([
        { label: "관계", leftLabel: "고독", rightLabel: "교감", score: 28 },
        { label: "행동", leftLabel: "본능", rightLabel: "이성", score: 70 },
      ]).map(({ word, percent }) => [word, percent])
    ).toEqual([
      ["고독", 72],
      ["이성", 70],
    ]);
  });
});
