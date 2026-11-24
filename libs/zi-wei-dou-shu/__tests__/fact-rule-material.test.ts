import {
  FLYING_SIHUA_RULES,
  SECTION_LENSES,
  SIHUA_PALACE_RULES,
  STAR_PAIR_RULES,
} from "../constants/lifetime-facts";
import type { FactRule, FactSection } from "../constants/lifetime-facts/types";
import type { PalaceName } from "../constants/palaces";

/** 궁 → 배정 섹션 (calculators/lifetime-facts.ts PALACE_SECTION과 같은 표) */
const PALACE_SECTION: Record<PalaceName, FactSection> = {
  명궁: "core",
  형제궁: "core",
  부처궁: "relationship",
  자녀궁: "relationship",
  재백궁: "wealth",
  질액궁: "health",
  천이궁: "core",
  교우궁: "career",
  관록궁: "career",
  전택궁: "wealth",
  복덕궁: "core",
  부모궁: "core",
};

const lensesFor = (section: FactSection): readonly string[] =>
  section === "timing" ? SECTION_LENSES.core : SECTION_LENSES[section];

const allRules = (): [string, FactSection, FactRule][] => [
  ...Object.entries(SIHUA_PALACE_RULES).flatMap(([sihua, byPalace]) =>
    Object.entries(byPalace).map(
      ([palace, rule]) =>
        [
          `사화 ${sihua}@${palace}`,
          PALACE_SECTION[palace as PalaceName],
          rule,
        ] as [string, FactSection, FactRule]
    )
  ),
  ...FLYING_SIHUA_RULES.map(
    (r) =>
      [`비화 ${r.from}-${r.sihua}->${r.to}`, r.section, r.rule] as [
        string,
        FactSection,
        FactRule,
      ]
  ),
  ...STAR_PAIR_RULES.map(
    (r) =>
      [`쌍성 ${r.stars.join("+")}`, "core", r.rule] as [
        string,
        FactSection,
        FactRule,
      ]
  ),
];

describe("사실 규칙 장면 재료", () => {
  it.each(allRules())(
    "%s: 완성 문장 장면 대신 장면 재료를 싣는다",
    (_, section, rule) => {
      const { material } = rule;
      expect(lensesFor(section)).toContain(material.lens);
      expect(material.cues.length).toBeGreaterThanOrEqual(3);
      expect(material.cues.length).toBeLessThanOrEqual(4);
      for (const cue of material.cues) {
        expect(cue.length).toBeLessThanOrEqual(15);
        expect(cue).not.toMatch(/(요|다)\.?$/);
      }
      expect(material.voice.length).toBeLessThanOrEqual(25);
      expect(material.voice).not.toMatch(/["“”]/);
      expect(material.avoid.length).toBeGreaterThan(0);
    }
  );
});
