import { findOutputViolations } from "@/libs/services/ai/output-validator";

import { PALACE_ORDER } from "../constants/palaces";
import { MAIN_STAR_NAMES } from "../constants/stars";
import {
  FLYING_SIHUA_RULES,
  PARTNER_RULES,
  SIHUA_PALACE_RULES,
  STAR_CAREER,
  STAR_PAIR_RULES,
} from "../constants/lifetime-facts";
import type { FactRule } from "../constants/lifetime-facts";
import type { LocalizedText } from "../constants/explanations/types";
import type { Sihua } from "../types";

const SIHUA: Sihua[] = ["화록", "화권", "화과", "화기"];
const LOCALES = ["ko", "en", "ja"] as const;

/** validator가 일부러 제외한 궁 이름 + 사화/대운 용어 (표 문장에서는 전부 금지) */
const EXTRA_KO_FORBIDDEN = /(천이|복덕|대운|유년|명반|삼합|사화|비화)/;

/** 운영 측정에서 걸린 상투어 (sceneSeeds 전용) */
const STOCK_PHRASES = [
  "흔들림",
  "길이 열",
  "멀리 간",
  "멀리 가",
  "오래 간",
  "오래 가",
  "판을 짜",
  "판을 바꾸",
  "흐름",
  "속도 조절",
  "기준을 세",
  "기록",
  "통장",
  "정산",
  "체크리스트",
];

const DIRECTION_VALUES = new Set(["positive", "negative", "mixed"]);

/** 객체 값 중 문자열만 모은다 (키는 제외). */
const collectStrings = (value: unknown): string[] => {
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectStrings);
  }
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
};

const allRules = (): FactRule[] => [
  ...SIHUA.flatMap((s) => PALACE_ORDER.map((p) => SIHUA_PALACE_RULES[s][p])),
  ...STAR_PAIR_RULES.map((p) => p.rule),
  ...FLYING_SIHUA_RULES.map((f) => f.rule),
];

const allEvidence = (): LocalizedText[] => [
  ...allRules().map((r) => r.evidence),
  ...MAIN_STAR_NAMES.map((n) => STAR_CAREER[n].evidence),
  ...MAIN_STAR_NAMES.map((n) => PARTNER_RULES[n].evidence),
];

describe("lifetime-facts 지식 룰 테이블", () => {
  it("사화 x 12궁 48셀이 전부 존재한다", () => {
    expect(Object.keys(SIHUA_PALACE_RULES)).toHaveLength(4);
    SIHUA.forEach((s) => {
      PALACE_ORDER.forEach((p) => {
        const cell = SIHUA_PALACE_RULES[s][p];
        expect(cell).toBeDefined();
        expect(cell.topic.length).toBeGreaterThan(0);
        expect(cell.sceneSeeds.length).toBeGreaterThanOrEqual(2);
      });
    });
    expect(
      SIHUA.reduce((n, s) => n + Object.keys(SIHUA_PALACE_RULES[s]).length, 0)
    ).toBe(48);
  });

  it("화기 셀은 긍정으로만 분류되지 않는다", () => {
    PALACE_ORDER.forEach((p) => {
      expect(SIHUA_PALACE_RULES.화기[p].direction).not.toBe("positive");
    });
  });

  it("주성 직업·상대 표는 14행이고 비어 있지 않다", () => {
    expect(Object.keys(STAR_CAREER)).toHaveLength(14);
    expect(Object.keys(PARTNER_RULES)).toHaveLength(14);
    MAIN_STAR_NAMES.forEach((n) => {
      expect(STAR_CAREER[n].fields.length).toBeGreaterThanOrEqual(3);
      expect(STAR_CAREER[n].fields.length).toBeLessThanOrEqual(6);
      expect(PARTNER_RULES[n].traits.length).toBeGreaterThanOrEqual(2);
      expect(PARTNER_RULES[n].meetingPaths.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("쌍성은 두 별이 서로 다르고 중복 쌍이 없다", () => {
    expect(STAR_PAIR_RULES.length).toBeGreaterThanOrEqual(24);
    const keys = STAR_PAIR_RULES.map(({ stars }) => {
      expect(stars[0]).not.toBe(stars[1]);
      return [...stars].sort().join("+");
    });
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("쌍성은 같은 계열끼리 짝지어지지 않는다 (동궁 불가능)", () => {
    const ziwei = ["자미", "천기", "태양", "무곡", "천동", "염정"];
    STAR_PAIR_RULES.forEach(({ stars: [a, b] }) => {
      expect(ziwei.includes(a)).not.toBe(ziwei.includes(b));
    });
  });

  it("자화 규칙은 to가 self이고 비자화는 from과 to가 다르다", () => {
    FLYING_SIHUA_RULES.forEach((f) => {
      if (f.to !== "self") {
        expect(f.to).not.toBe(f.from);
      }
    });
    expect(
      FLYING_SIHUA_RULES.filter((f) => f.to === "self").length
    ).toBeGreaterThan(0);
  });

  it("evidence는 3개 언어 모두 비어 있지 않고 KO는 존댓말 40자 이내다", () => {
    allEvidence().forEach((e) => {
      LOCALES.forEach((l) => expect(e[l].trim().length).toBeGreaterThan(0));
      expect(e.ko.length).toBeLessThanOrEqual(40);
      expect(e.ko).toMatch(/요$/);
    });
  });

  it("모든 표 문장에 금지 용어(별·궁·사화 이름)가 없다", () => {
    const koTexts = collectStrings({
      sihua: SIHUA_PALACE_RULES,
      pairs: STAR_PAIR_RULES.map((p) => p.rule),
      flying: FLYING_SIHUA_RULES.map((f) => f.rule),
      career: STAR_CAREER,
      partner: PARTNER_RULES,
    }).filter((t) => !DIRECTION_VALUES.has(t));

    // 키(궁·사화 이름)는 제외하고 값만 검사. 영어·일본어 evidence는 해당 언어 규칙 적용.
    expect(findOutputViolations(koTexts, "ko")).toEqual([]);
    koTexts.forEach((t) => expect(t).not.toMatch(EXTRA_KO_FORBIDDEN));
    (["en", "ja"] as const).forEach((l) => {
      const texts = allEvidence().map((e) => e[l]);
      expect(findOutputViolations(texts, l)).toEqual([]);
    });
  });

  it("sceneSeeds에 운영 측정 상투어가 없다", () => {
    allRules().forEach((r) => {
      r.sceneSeeds.forEach((seed) => {
        STOCK_PHRASES.forEach((phrase) => {
          expect(seed).not.toContain(phrase);
        });
        expect(seed).not.toMatch(/(^|\s)결(\s|$|이|을)/);
      });
    });
  });
});
