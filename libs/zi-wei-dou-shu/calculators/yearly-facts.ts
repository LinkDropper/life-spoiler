/**
 * 올해(유년) 사실 시트.
 *
 * 인생 운세 사실 시트(lifetime-facts.ts)와 같은 방식으로, 엔진이 명반에서 계산한 결론을
 * 섹션별 주장으로 넘긴다. 예전에는 유년 사화·궁 이름·별 목록을 원본 그대로 넘겨
 * 모델이 직접 해석했고, 그래서 "기운", 별 이름, 근거 없는 시기가 섞였다.
 *
 * - year: 올해 켜지는 일. 유년 사화가 떨어진 원국 궁의 사화×궁 표(SIHUA_PALACE_RULES)와
 *   유년 홍란·천희가 명궁·부처궁에 들어올 때의 연애 재료(PEACH_BLOSSOM_FACTS)
 * - natal: 타고난 바탕. 인생 운세 사실 시트의 섹션별 앞쪽 주장 (올해 일이 이 위에서 일어난다)
 * - decade: 지금 10년(대운) 구간의 주장
 */

import {
  PEACH_BLOSSOM_FACTS,
  SIHUA_PALACE_RULES,
} from "../constants/lifetime-facts";
import type {
  FactRule,
  FactSection,
  LoveFact,
  PeachBlossomPalace,
  PeachBlossomStar,
} from "../constants/lifetime-facts/types";
import { PALACE_ORDER } from "../constants/palaces";
import type { PalaceName } from "../constants/palaces";
import type { Sihua } from "../types";

import { PALACE_SECTION } from "./lifetime-facts";
import type {
  DecadeFacts,
  FortuneClaim,
  LifetimeFactSheet,
} from "./lifetime-facts";
import type { YearlyPeachBlossomInfo, YearlySihua } from "./yearly";

/** 올해 운세가 다루는 섹션 (타이밍은 없다) */
export type YearlySection = Exclude<FactSection, "timing">;

export const YEARLY_SECTIONS: YearlySection[] = [
  "core",
  "wealth",
  "career",
  "relationship",
  "health",
];

export interface YearlyFactSheet {
  /** 올해 켜지는 일. 섹션별로 화기·화록·화권·화과·도화 순 */
  year: Record<YearlySection, FortuneClaim[]>;
  /** 타고난 바탕. 섹션별 앞쪽 주장 */
  natal: Record<YearlySection, FortuneClaim[]>;
  /** 지금 10년 */
  decade?: DecadeFacts;
}

/** 타고난 바탕은 섹션당 2개(본궁 강점·주의)면 올해 일을 얹을 자리가 된다 */
const NATAL_PER_SECTION = 2;

/** 화기를 앞에 둔다. 피할 일이 올해 판정을 가장 크게 바꾼다 */
const SIHUA_ORDER: [
  keyof Pick<YearlySihua, "huaji" | "hualu" | "huaquan" | "huake">,
  Sihua,
][] = [
  ["huaji", "화기"],
  ["hualu", "화록"],
  ["huaquan", "화권"],
  ["huake", "화과"],
];

const PEACH_STARS: [PeachBlossomStar, "hongluan" | "tianxi"][] = [
  ["홍란", "hongluan"],
  ["천희", "tianxi"],
];

const isPalaceName = (name: string): name is PalaceName =>
  (PALACE_ORDER as readonly string[]).includes(name);

const isPeachPalace = (name: string): name is PeachBlossomPalace =>
  name === "명궁" || name === "부처궁";

const ruleClaim = (
  id: string,
  palace: PalaceName,
  rule: FactRule
): FortuneClaim => ({
  id,
  section: PALACE_SECTION[palace],
  palace,
  topic: rule.topic,
  direction: rule.direction,
  strength: rule.strength,
  evidence: rule.evidence,
  ...rule.material,
});

const loveClaim = (
  id: string,
  palace: PalaceName,
  fact: LoveFact
): FortuneClaim => ({
  id,
  section: "relationship",
  palace,
  topic: fact.judgment,
  direction: "positive",
  strength: 3,
  lens: fact.lens,
  cues: fact.cues,
  voice: fact.voice,
  avoid: fact.avoid,
});

const emptySections = (): Record<YearlySection, FortuneClaim[]> => ({
  core: [],
  wealth: [],
  career: [],
  relationship: [],
  health: [],
});

/** 유년 사화·도화에서 올해 켜지는 일을 모은다 */
export const collectYearClaims = (
  sihua: YearlySihua,
  peachBlossom: Pick<YearlyPeachBlossomInfo, "hongluan" | "tianxi">
): Record<YearlySection, FortuneClaim[]> => {
  const result = emptySections();
  const push = (claim: FortuneClaim) => {
    if (claim.section === "timing") return;
    result[claim.section].push(claim);
  };

  for (const [key, name] of SIHUA_ORDER) {
    const { palace } = sihua[key];
    if (!isPalaceName(palace)) continue;
    push(
      ruleClaim(
        `year:${name}@${palace}`,
        palace,
        SIHUA_PALACE_RULES[name][palace]
      )
    );
  }

  for (const [star, key] of PEACH_STARS) {
    const { palaceName } = peachBlossom[key];
    if (!isPeachPalace(palaceName)) continue;
    push(
      loveClaim(
        `year:${star}@${palaceName}`,
        palaceName,
        PEACH_BLOSSOM_FACTS[star][palaceName]
      )
    );
  }
  return result;
};

const findCurrentDecade = (
  decades: DecadeFacts[],
  currentAge: number
): DecadeFacts | undefined =>
  decades.find((d) => d.startAge <= currentAge && currentAge <= d.endAge);

export const buildYearlyFactSheet = (
  lifetime: LifetimeFactSheet,
  sihua: YearlySihua,
  peachBlossom: Pick<YearlyPeachBlossomInfo, "hongluan" | "tianxi">,
  currentAge: number
): YearlyFactSheet => {
  const natal = emptySections();
  for (const section of YEARLY_SECTIONS) {
    natal[section] = lifetime.claims[section].slice(0, NATAL_PER_SECTION);
  }
  return {
    year: collectYearClaims(sihua, peachBlossom),
    natal,
    decade: findCurrentDecade(lifetime.decades, currentAge),
  };
};
