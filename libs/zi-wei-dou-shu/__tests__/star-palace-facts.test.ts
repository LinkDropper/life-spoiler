import { findOutputViolations } from "@/libs/services/ai/output-validator";

import { SECTION_LENSES, STAR_PALACE_FACTS } from "../constants/lifetime-facts";
import type {
  FallbackFact,
  FallbackPalace,
} from "../constants/lifetime-facts/types";
import { MAIN_STAR_NAMES } from "../constants/stars";

const PALACES: FallbackPalace[] = ["명궁", "재백궁", "관록궁", "질액궁"];

const LENSES_BY_PALACE: Record<FallbackPalace, readonly string[]> = {
  명궁: SECTION_LENSES.core,
  재백궁: SECTION_LENSES.wealth,
  관록궁: SECTION_LENSES.career,
  질액궁: SECTION_LENSES.health,
};

/** validator가 일상어와 겹쳐 제외한 용어까지 표 문장에서는 금지 */
const EXTRA_KO_FORBIDDEN = /(천이|복덕|대운|유년|명반|삼합|사화|비화)/;

/** 일반 독자 판정에서 "뜻이 흐림"으로 자주 걸린 추상어·상투어 */
const ABSTRACT_WORDS = [
  "기운",
  "흐름",
  "감각이 살",
  "존재감",
  "작동",
  "온도",
  "판을",
  "의 결",
  "흔들림",
  "길이 열",
  "멀리 가",
  "오래 가",
  "기록",
  "통장",
  "정산",
];

const MAX_LENGTH = 45;

const allFacts = (): {
  label: string;
  palace: FallbackPalace;
  fact: FallbackFact;
}[] =>
  PALACES.flatMap((palace) =>
    MAIN_STAR_NAMES.flatMap((star) => {
      const entry = STAR_PALACE_FACTS[palace][star];
      return [
        { label: `${palace}/${star}/energy`, palace, fact: entry.energy },
        { label: `${palace}/${star}/caution`, palace, fact: entry.caution },
      ];
    })
  );

describe("STAR_PALACE_FACTS (LLM 전용 보충 주장)", () => {
  it("5개 영역 × 14주성 전부 강점·주의가 있다", () => {
    PALACES.forEach((palace) => {
      MAIN_STAR_NAMES.forEach((star) => {
        const entry = STAR_PALACE_FACTS[palace][star];
        expect(entry).toBeDefined();
        expect(entry.energy.topic.length).toBeGreaterThan(0);
        expect(entry.caution.topic.length).toBeGreaterThan(0);
      });
    });
    expect(allFacts()).toHaveLength(112);
  });

  it.each(allFacts())(
    "$label: 판정 길이와 장면 재료 형식이 기준 안이다",
    ({ palace, fact }) => {
      expect(fact.topic.length).toBeLessThanOrEqual(MAX_LENGTH);
      expect(LENSES_BY_PALACE[palace]).toContain(fact.lens);
      expect(fact.cues.length).toBeGreaterThanOrEqual(3);
      expect(fact.cues.length).toBeLessThanOrEqual(4);
      fact.cues.forEach((cue) => {
        expect(cue.length).toBeLessThanOrEqual(15);
        expect(cue).not.toMatch(/(요|다)\.?$/);
      });
      expect(fact.voice.length).toBeLessThanOrEqual(25);
      expect(fact.voice).not.toMatch(/["“”]/);
      expect(fact.avoid.length).toBeGreaterThan(0);
    }
  );

  it.each(allFacts())("$label: 전문 용어·추상어가 없다", ({ fact }) => {
    const texts = [fact.topic, ...fact.cues];
    expect(findOutputViolations({ texts }, "ko")).toEqual([]);
    texts.forEach((text) => {
      expect(text).not.toMatch(EXTRA_KO_FORBIDDEN);
      ABSTRACT_WORDS.forEach((word) => {
        expect(text).not.toContain(word);
      });
    });
  });

  it("한 별의 강점과 주의는 서로 다른 관점을 맡는다", () => {
    PALACES.forEach((palace) => {
      MAIN_STAR_NAMES.forEach((star) => {
        const { energy, caution } = STAR_PALACE_FACTS[palace][star];
        expect(energy.lens).not.toBe(caution.lens);
      });
    });
  });
});
