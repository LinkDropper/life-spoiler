import {
  LOVE_PARTNER_FACTS,
  LOVE_SELF_FACTS,
  PEACH_BLOSSOM_FACTS,
} from "../constants/lifetime-facts";
import type { LoveFact } from "../constants/lifetime-facts/types";
import { MAIN_STAR_NAMES } from "../constants/stars";

const FORBIDDEN =
  /(명궁|부처궁|복덕궁|자미|천기|태양|무곡|천동|염정|천부|태음|탐랑|거문|천상|천량|칠살|파군|홍란|천희|화록|화권|화과|화기|운명|대박)/;

const allFacts = (): [string, LoveFact][] => [
  ...MAIN_STAR_NAMES.flatMap((star) => [
    [`self ${star} energy`, LOVE_SELF_FACTS[star].energy] as [string, LoveFact],
    [`self ${star} caution`, LOVE_SELF_FACTS[star].caution] as [
      string,
      LoveFact,
    ],
    [`partner ${star} energy`, LOVE_PARTNER_FACTS[star].energy] as [
      string,
      LoveFact,
    ],
    [`partner ${star} caution`, LOVE_PARTNER_FACTS[star].caution] as [
      string,
      LoveFact,
    ],
  ]),
  ...Object.entries(PEACH_BLOSSOM_FACTS).flatMap(([star, byPalace]) =>
    Object.entries(byPalace).map(
      ([palace, fact]) =>
        [`peach ${star} ${palace}`, fact] as [string, LoveFact]
    )
  ),
];

describe("연애 재료 표", () => {
  it.each(allFacts())("%s: 필드 형식을 지킨다", (_, fact) => {
    expect(fact.judgment.length).toBeLessThanOrEqual(40);
    expect(fact.judgment).not.toMatch(FORBIDDEN);
    expect(fact.cues.length).toBeGreaterThanOrEqual(3);
    expect(fact.cues.length).toBeLessThanOrEqual(4);
    for (const cue of fact.cues) {
      expect(cue.length).toBeLessThanOrEqual(15);
      expect(cue).not.toMatch(/(요|다)\.?$/);
    }
    expect(fact.voice.length).toBeLessThanOrEqual(25);
    expect(fact.voice).not.toMatch(/["“”]/);
    expect(fact.avoid.length).toBeGreaterThan(0);
  });

  it("한 별의 강점과 주의는 서로 다른 관점을 맡는다", () => {
    for (const star of MAIN_STAR_NAMES) {
      for (const table of [LOVE_SELF_FACTS, LOVE_PARTNER_FACTS]) {
        expect(table[star].energy.lens).not.toBe(table[star].caution.lens);
      }
    }
  });
});
