import { findOutputViolations } from "@/libs/services/ai/output-validator";

import { STAR_PALACE_FACTS } from "../constants/lifetime-facts";
import type {
  FallbackFact,
  FallbackPalace,
} from "../constants/lifetime-facts/types";
import { MAIN_STAR_NAMES } from "../constants/stars";

const PALACES: FallbackPalace[] = [
  "명궁",
  "재백궁",
  "관록궁",
  "부처궁",
  "질액궁",
];

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

const allFacts = (): { label: string; fact: FallbackFact }[] =>
  PALACES.flatMap((palace) =>
    MAIN_STAR_NAMES.flatMap((star) => {
      const entry = STAR_PALACE_FACTS[palace][star];
      return [
        { label: `${palace}/${star}/energy`, fact: entry.energy },
        { label: `${palace}/${star}/caution`, fact: entry.caution },
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
    expect(allFacts()).toHaveLength(140);
  });

  it.each(allFacts())("$label: 길이와 장면 개수가 기준 안이다", ({ fact }) => {
    expect(fact.topic.length).toBeLessThanOrEqual(MAX_LENGTH);
    expect(fact.sceneSeeds.length).toBeGreaterThanOrEqual(2);
    expect(fact.sceneSeeds.length).toBeLessThanOrEqual(3);
    fact.sceneSeeds.forEach((scene) => {
      expect(scene.length).toBeLessThanOrEqual(MAX_LENGTH);
      expect(scene).toMatch(/요\.?$/);
    });
  });

  it.each(allFacts())("$label: 전문 용어·추상어가 없다", ({ fact }) => {
    const texts = [fact.topic, ...fact.sceneSeeds];
    expect(findOutputViolations({ texts }, "ko")).toEqual([]);
    texts.forEach((text) => {
      expect(text).not.toMatch(EXTRA_KO_FORBIDDEN);
      ABSTRACT_WORDS.forEach((word) => {
        expect(text).not.toContain(word);
      });
    });
  });

  it("같은 영역 안에서 장면 문장이 겹치지 않는다", () => {
    PALACES.forEach((palace) => {
      const scenes = MAIN_STAR_NAMES.flatMap((star) => [
        ...STAR_PALACE_FACTS[palace][star].energy.sceneSeeds,
        ...STAR_PALACE_FACTS[palace][star].caution.sceneSeeds,
      ]);
      expect(new Set(scenes).size).toBe(scenes.length);
    });
  });
});
