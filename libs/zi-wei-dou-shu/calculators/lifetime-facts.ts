/**
 * 인생 운세 사실 시트 (Phase 2)
 *
 * 명반에서 해석에 쓸 "주장"을 결정적으로 뽑아 섹션별로 배정한다.
 * LLM은 자기 섹션에 배정된 주장만 받아 문장으로 옮기고, 시트에 없는
 * 시기·직업명·상대 묘사는 쓸 수 없다.
 * 설계: docs/lifetime-fortune-quality-2026-11.md §4-1
 *
 * 주장 출처 (강도 가중 순):
 * 1) 생년 사화가 앉은 궁 (SIHUA_PALACE_RULES)
 * 2) 궁간 비행사화·자화 (FLYING_SIHUA_RULES)
 * 3) 핵심 궁의 동궁 쌍성 (STAR_PAIR_RULES)
 * 시간축(타이밍·지난 시기 확인)은 대운 궁간 사화와 유년 사화로 계산한다.
 */

import {
  DECADE_STAGE,
  FLYING_SIHUA_RULES,
  PARTNER_RULES,
  SIHUA_PALACE_RULES,
  STAR_CAREER,
  STAR_PAIR_RULES,
} from "../constants/lifetime-facts";
import type {
  FactDirection,
  FactRule,
  FactSection,
  FactStrength,
  PartnerEntry,
} from "../constants/lifetime-facts/types";
import { STAR_IN_PALACE } from "../constants/explanations";
import type { LocalizedText } from "../constants/explanations/types";
import type { PalaceName } from "../constants/palaces";
import type { MainStarName } from "../constants/stars";
import type { Palace, Sihua, SihuaResult, ZiweiChart } from "../types";

import type { DayunResult } from "./dayun";
import { getEffectiveMainStars } from "./empty-palace";
import { calculateSihua } from "./sihua";
import { getYearStemBranch } from "./yearly";

// ============================================================
// 타입
// ============================================================

export type FactCategory = "wealth" | "career" | "relationship" | "health";

export interface FortuneClaim {
  /** 출처 키. 섹션 간 중복 배정 방지·디버깅용 (예: "birth:화록@재백궁") */
  id: string;
  section: FactSection;
  topic: string;
  direction: FactDirection;
  strength: FactStrength;
  sceneSeeds: string[];
  /**
   * 이 주장의 근거 문구를 "영역 근거 한 줄"로 써도 되는 영역.
   * - 생년 사화: 그 영역의 궁(재백·관록·부처·질액)에 걸렸을 때만
   * - 비행사화: 규칙이 지정한 영역
   * - 쌍성·별×궁 보충: 없음 (성격 설명이라 영역 근거로 쓰면 어긋난다)
   */
  evidenceFor?: FactCategory;
  /** 보충 주장(별×궁 설명 표)에는 근거 문구가 없다 */
  evidence?: LocalizedText;
  /** 시기 주장일 때 나이 구간 (예: "23-32") */
  period?: string;
}

export type TimingTopic = "love" | "career" | "move";

export interface TimingYear {
  year: number;
  /** 엔진 점수 (클수록 유리) */
  score: number;
  /** LLM에 넘기는 쉬운 말 이유 재료 (KO) */
  reasons: string[];
}

export interface TimingEntry {
  topic: TimingTopic;
  likely: TimingYear[];
  caution?: TimingYear;
}

/** 대운(10년) 한 구간의 사실. 나이별 시나리오·핵심 시나리오의 시기 재료 */
export interface DecadeFacts {
  startAge: number;
  endAge: number;
  /** 그 10년의 생활 무대 (쉬운 말 한 줄) */
  stage: string;
  /** 생애 단계. 장면 씨앗은 성인기 생활 기준이라 성인기에만 싣는다 */
  lifeStage: LifeStage;
  /** 대운 사화가 떨어진 자리의 주장. 화기·화록·화권·화과 순 */
  claims: FortuneClaim[];
  /** 대운 사화 가감 합 (클수록 순탄). 하이라이트·고비 선택용 */
  score: number;
  /** 대운 화기가 생활 중심 궁(명·재·관·부·질·천이)에 떨어지는지 */
  hasCoreHuaji: boolean;
}

export type DecadeTone = "highlight" | "hard";

export type LifeStage = "youth" | "adult" | "senior";

export interface LifetimeFactSheet {
  claims: Record<FactSection, FortuneClaim[]>;
  /** 대운 구간 순서 그대로 (DayunResult.periods 와 같은 순서·개수) */
  decades: DecadeFacts[];
  /** 하이라이트·고비로 고른 대운의 인덱스 (decades 기준) */
  decadeTones: Partial<Record<DecadeTone, number>>;
  /** 영역별 화면 노출용 근거 한 줄 */
  evidence: Partial<Record<FactCategory, LocalizedText>>;
  careerFields: string[];
  partner?: PartnerEntry;
  timing: TimingEntry[];
}

// ============================================================
// 상수
// ============================================================

const SIHUA_TYPES: Sihua[] = ["화록", "화권", "화과", "화기"];

/** 궁 → 주장이 배정되는 섹션 */
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

/** 쌍성 조합을 주장으로 쓰는 궁 (나머지 궁의 동궁은 신호가 약함) */
const PAIR_PALACES: PalaceName[] = [
  "명궁",
  "재백궁",
  "관록궁",
  "부처궁",
  "질액궁",
  "복덕궁",
];

/** 섹션별 최대 주장 수 */
const SECTION_LIMIT: Record<FactSection, number> = {
  core: 5,
  wealth: 4,
  career: 4,
  relationship: 4,
  health: 4,
  timing: 4,
};

const CATEGORY_SECTIONS: FactCategory[] = [
  "wealth",
  "career",
  "relationship",
  "health",
];

/** 영역 근거 한 줄을 낼 수 있는 궁 (영역 본궁) */
const PALACE_CATEGORY: Partial<Record<PalaceName, FactCategory>> = {
  재백궁: "wealth",
  관록궁: "career",
  부처궁: "relationship",
  질액궁: "health",
};

const isCategory = (section: FactSection): section is FactCategory =>
  (CATEGORY_SECTIONS as FactSection[]).includes(section);

/** 타이밍 주제 → 대상 궁 */
const TIMING_PALACE: Record<TimingTopic, PalaceName> = {
  love: "부처궁",
  career: "관록궁",
  move: "천이궁",
};

export const TIMING_TOPIC_LABELS: Record<TimingTopic, string> = {
  love: "연애·결혼",
  career: "일·이직",
  move: "이사·이동",
};

/** 유년 사화가 대상 궁에 들어올 때의 가감 (lifetime-score 의 SIHUA_SCORE 와 같은 비율) */
const TIMING_SIHUA_SCORE: Record<Sihua, number> = {
  화록: 3,
  화권: 2,
  화과: 1.5,
  화기: -3.5,
};

const TIMING_SIHUA_REASON: Record<Sihua, string> = {
  화록: "그해 기운이 이 영역에 기회와 풍요로 들어와요",
  화권: "그해 기운이 이 영역에 주도권으로 들어와요",
  화과: "그해 기운이 이 영역에 인정과 평판으로 들어와요",
  화기: "그해 기운이 이 영역에 막힘과 부담으로 들어와요",
};

/** 대운(10년) 사화는 유년보다 넓게 깔리는 배경이라 절반만 반영 */
const DAYUN_TIMING_FACTOR = 0.5;
/** 유년 명궁이 대상 궁 자리에 오는 해 */
const YEAR_BRANCH_HIT_SCORE = 2;
/** 앞으로 몇 년을 타이밍 후보로 볼지 */
const TIMING_HORIZON_YEARS = 10;

// ============================================================
// 유틸
// ============================================================

const clampStrength = (value: number): FactStrength =>
  Math.max(1, Math.min(5, Math.round(value))) as FactStrength;

const SIHUA_KEY: Record<Sihua, keyof SihuaResult> = {
  화록: "hualu",
  화권: "huaquan",
  화과: "huake",
  화기: "huaji",
};

/** 별 이름 → 그 별이 앉은 궁 (주성·보성 모두) */
export const buildStarPalaceMap = (
  palaces: Palace[]
): Map<string, PalaceName> => {
  const map = new Map<string, PalaceName>();
  for (const palace of palaces) {
    for (const star of [...palace.mainStars, ...palace.minorStars]) {
      map.set(star.name, palace.name as PalaceName);
    }
  }
  return map;
};

const toClaim = (
  id: string,
  section: FactSection,
  rule: FactRule,
  evidenceFor: FactCategory | undefined,
  strengthDelta = 0,
  period?: string
): FortuneClaim => ({
  id,
  section,
  ...(evidenceFor ? { evidenceFor } : {}),
  topic: rule.topic,
  direction: rule.direction,
  strength: clampStrength(rule.strength + strengthDelta),
  sceneSeeds: rule.sceneSeeds,
  evidence: rule.evidence,
  ...(period ? { period } : {}),
});

/** 사화 결과에서 각 사화가 떨어지는 궁 목록 */
const landSihua = (
  sihua: SihuaResult,
  starPalace: Map<string, PalaceName>
): { sihua: Sihua; palace: PalaceName }[] =>
  SIHUA_TYPES.flatMap((type) => {
    const palace = starPalace.get(sihua[SIHUA_KEY[type]]);
    return palace ? [{ sihua: type, palace }] : [];
  });

// ============================================================
// 원국 주장
// ============================================================

/** 생년 사화가 앉은 궁. 원국의 중심축이라 강도 +1 */
const collectBirthSihuaClaims = (
  chart: ZiweiChart,
  starPalace: Map<string, PalaceName>
): FortuneClaim[] =>
  landSihua(chart.sihua, starPalace).map(({ sihua, palace }) =>
    toClaim(
      `birth:${sihua}@${palace}`,
      PALACE_SECTION[palace],
      SIHUA_PALACE_RULES[sihua][palace],
      PALACE_CATEGORY[palace],
      1
    )
  );

/** 궁간 비행사화 (from 궁의 천간 사화가 to 궁으로) 와 자화 */
export const calculateFlyingSihua = (
  chart: ZiweiChart,
  starPalace: Map<string, PalaceName> = buildStarPalaceMap(chart.palaces)
): { from: PalaceName; sihua: Sihua; to: PalaceName | "self" }[] =>
  chart.palaces.flatMap((palace) =>
    landSihua(calculateSihua(palace.stem), starPalace).map(
      ({ sihua, palace: target }) => ({
        from: palace.name as PalaceName,
        sihua,
        to: target === palace.name ? ("self" as const) : target,
      })
    )
  );

const collectFlyingClaims = (
  chart: ZiweiChart,
  starPalace: Map<string, PalaceName>
): FortuneClaim[] => {
  const flights = calculateFlyingSihua(chart, starPalace);
  return FLYING_SIHUA_RULES.filter((rule) =>
    flights.some(
      (f) => f.from === rule.from && f.sihua === rule.sihua && f.to === rule.to
    )
  ).map((rule) =>
    toClaim(
      `fly:${rule.from}-${rule.sihua}->${rule.to}`,
      rule.section,
      rule.rule,
      isCategory(rule.section) ? rule.section : undefined
    )
  );
};

const collectPairClaims = (chart: ZiweiChart): FortuneClaim[] =>
  chart.palaces.flatMap((palace) => {
    const name = palace.name as PalaceName;
    if (!PAIR_PALACES.includes(name)) return [];
    const stars = palace.mainStars.map((s) => s.name);
    return STAR_PAIR_RULES.filter(
      ({ stars: [a, b] }) => stars.includes(a) && stars.includes(b)
    ).map(({ stars: [a, b], rule }) =>
      toClaim(`pair:${a}+${b}@${name}`, PALACE_SECTION[name], rule, undefined)
    );
  });

const isMainStar = (name: string): name is MainStarName => name in STAR_CAREER;

const findPalace = (chart: ZiweiChart, name: PalaceName): Palace | undefined =>
  chart.palaces.find((p) => p.name === name);

const effectiveMainStarNames = (palace: Palace | undefined): MainStarName[] =>
  palace
    ? getEffectiveMainStars(palace)
        .map((s) => s.name)
        .filter(isMainStar)
    : [];

/** 섹션 → 보충 주장을 뽑을 궁 */
const SECTION_PALACE: Partial<Record<FactSection, PalaceName>> = {
  core: "명궁",
  wealth: "재백궁",
  career: "관록궁",
  relationship: "부처궁",
  health: "질액궁",
};

/** 섹션당 최소 주장 수. 모자라면 별×궁 설명 표에서 보충한다 */
const SECTION_MIN = 2;

/**
 * 사화·비화·쌍성 신호가 없는 섹션은 해당 궁 주성의 별×궁 설명으로 보충한다.
 * 강도 2(약한 신호)로 두어 실제 신호가 있으면 그쪽이 먼저 배정된다.
 */
const collectFallbackClaims = (chart: ZiweiChart): FortuneClaim[] =>
  (Object.entries(SECTION_PALACE) as [FactSection, PalaceName][]).flatMap(
    ([section, palaceName]) =>
      effectiveMainStarNames(findPalace(chart, palaceName)).flatMap((star) => {
        const entry = STAR_IN_PALACE[palaceName][star];
        return [
          {
            id: `base:${star}@${palaceName}:energy`,
            section,
            topic: entry.energy.ko,
            direction: "positive" as const,
            strength: 2 as const,
            sceneSeeds: [],
          },
          {
            id: `base:${star}@${palaceName}:caution`,
            section,
            topic: entry.caution.ko,
            direction: "negative" as const,
            strength: 1 as const,
            sceneSeeds: [],
          },
        ];
      })
  );

// ============================================================
// 배정
// ============================================================

/** 강도 내림차순, 같은 강도면 부정·혼합을 먼저(약점을 빼먹지 않도록) */
const DIRECTION_ORDER: Record<FactDirection, number> = {
  negative: 0,
  mixed: 1,
  positive: 2,
};

const rankClaims = (claims: FortuneClaim[]): FortuneClaim[] =>
  [...claims].sort(
    (a, b) =>
      b.strength - a.strength ||
      DIRECTION_ORDER[a.direction] - DIRECTION_ORDER[b.direction] ||
      a.id.localeCompare(b.id)
  );

const assignClaims = (
  claims: FortuneClaim[],
  fallback: FortuneClaim[]
): Record<FactSection, FortuneClaim[]> => {
  const result: Record<FactSection, FortuneClaim[]> = {
    core: [],
    wealth: [],
    career: [],
    relationship: [],
    health: [],
    timing: [],
  };
  const seen = new Set<string>();
  for (const claim of rankClaims(claims)) {
    if (seen.has(claim.id)) continue;
    const bucket = result[claim.section];
    if (bucket.length >= SECTION_LIMIT[claim.section]) continue;
    seen.add(claim.id);
    bucket.push(claim);
  }
  for (const claim of fallback) {
    const bucket = result[claim.section];
    if (bucket.length >= SECTION_MIN) continue;
    bucket.push(claim);
  }
  return result;
};

// ============================================================
// 직업 분야·상대
// ============================================================

const MAX_CAREER_FIELDS = 5;

/** 관록궁 주성 → 명궁 주성 순으로 직업군 후보를 모은다 */
const collectCareerFields = (chart: ZiweiChart): string[] => {
  const stars = [
    ...effectiveMainStarNames(findPalace(chart, "관록궁")),
    ...effectiveMainStarNames(findPalace(chart, "명궁")),
  ];
  const fields: string[] = [];
  for (const star of stars) {
    for (const field of STAR_CAREER[star].fields) {
      if (!fields.includes(field)) fields.push(field);
    }
  }
  return fields.slice(0, MAX_CAREER_FIELDS);
};

const pickPartner = (chart: ZiweiChart): PartnerEntry | undefined => {
  const [star] = effectiveMainStarNames(findPalace(chart, "부처궁"));
  return star ? PARTNER_RULES[star] : undefined;
};

const pickEvidence = (
  chart: ZiweiChart,
  claims: Record<FactSection, FortuneClaim[]>
): Partial<Record<FactCategory, LocalizedText>> => {
  const evidence: Partial<Record<FactCategory, LocalizedText>> = {};
  for (const category of CATEGORY_SECTIONS) {
    const top = claims[category].find(
      (c) => c.evidence && c.evidenceFor === category
    );
    if (top?.evidence) evidence[category] = top.evidence;
  }
  if (!evidence.career) {
    const [star] = effectiveMainStarNames(findPalace(chart, "관록궁"));
    if (star) evidence.career = STAR_CAREER[star].evidence;
  }
  if (!evidence.relationship) {
    const partner = pickPartner(chart);
    if (partner) evidence.relationship = partner.evidence;
  }
  return evidence;
};

// ============================================================
// 시간축
// ============================================================

const findDayunAt = (dayun: DayunResult, age: number) =>
  dayun.periods.find((p) => age >= p.startAge && age <= p.endAge);

const scoreTimingYear = (
  dayun: DayunResult,
  starPalace: Map<string, PalaceName>,
  birthYear: number,
  year: number,
  target: Palace
): TimingYear => {
  let score = 0;
  const reasons: string[] = [];
  const { stem, branch } = getYearStemBranch(year);

  for (const land of landSihua(calculateSihua(stem), starPalace)) {
    if (land.palace !== target.name) continue;
    score += TIMING_SIHUA_SCORE[land.sihua];
    reasons.push(TIMING_SIHUA_REASON[land.sihua]);
  }
  if (branch === target.branch) {
    score += YEAR_BRANCH_HIT_SCORE;
    reasons.push("그해의 중심이 이 영역 자리로 옮겨 와요");
  }

  const period = findDayunAt(dayun, year - birthYear + 1);
  if (period) {
    for (const land of landSihua(
      calculateSihua(period.stemIndex),
      starPalace
    )) {
      if (land.palace !== target.name) continue;
      score += TIMING_SIHUA_SCORE[land.sihua] * DAYUN_TIMING_FACTOR;
      reasons.push(
        land.sihua === "화기"
          ? "10년 단위 흐름이 이 영역에 부담을 깔아 두는 시기예요"
          : "10년 단위 흐름이 이 영역을 받쳐 주는 시기예요"
      );
    }
  }
  return { year, score, reasons };
};

const MAX_LIKELY_YEARS = 3;

export const calculateTiming = (
  chart: ZiweiChart,
  dayun: DayunResult,
  birthYear: number,
  currentYear: number,
  starPalace: Map<string, PalaceName> = buildStarPalaceMap(chart.palaces)
): TimingEntry[] =>
  (Object.keys(TIMING_PALACE) as TimingTopic[]).flatMap((topic) => {
    const target = findPalace(chart, TIMING_PALACE[topic]);
    if (!target) return [];
    const years = Array.from({ length: TIMING_HORIZON_YEARS }, (_, i) =>
      scoreTimingYear(dayun, starPalace, birthYear, currentYear + 1 + i, target)
    );
    const likely = years
      .filter((y) => y.score > 0)
      .sort((a, b) => b.score - a.score || a.year - b.year)
      .slice(0, MAX_LIKELY_YEARS)
      .sort((a, b) => a.year - b.year);
    const [worst] = [...years].sort(
      (a, b) => a.score - b.score || a.year - b.year
    );
    return [
      {
        topic,
        likely,
        ...(worst && worst.score < 0 ? { caution: worst } : {}),
      },
    ];
  });

// ============================================================
// 대운(10년) 사실
// ============================================================

/** 대운 사화를 읽는 순서: 막힘을 빼먹지 않도록 화기 먼저 */
const DECADE_SIHUA_ORDER: Sihua[] = ["화기", "화록", "화권", "화과"];

/** 하이라이트·고비 점수에서 생활 중심 궁은 온전히, 나머지는 절반만 */
const DECADE_CORE_PALACES: PalaceName[] = [
  "명궁",
  "재백궁",
  "관록궁",
  "부처궁",
  "질액궁",
  "천이궁",
];
const DECADE_SIDE_WEIGHT = 0.5;

/**
 * 하이라이트·고비는 20세 이후~70대 시작 구간에서만 고른다
 * (유년기 고비나 90대 하이라이트는 인생 서사의 중심으로 쓰기 어렵다)
 */
const DECADE_TONE_MIN_END_AGE = 20;
const DECADE_TONE_MAX_START_AGE = 70;
/** 장면 씨앗(직장·연애·살림)은 이 나이 이후에 시작하는 성인기 구간에만 싣는다 */
const SCENE_MIN_START_AGE = 20;

/** 구간 끝 나이가 이보다 어리면 유년기, 시작 나이가 이 이상이면 노년기 */
const YOUTH_END_AGE = 20;
const SENIOR_START_AGE = 65;

/** 유년기에는 연애·결혼·자녀 주장을 싣지 않는다 (그 나이에 맞는 장면으로 옮길 수 없다) */
const YOUTH_EXCLUDED_PALACES: PalaceName[] = ["부처궁", "자녀궁"];

const toLifeStage = (startAge: number, endAge: number): LifeStage =>
  endAge < YOUTH_END_AGE
    ? "youth"
    : startAge >= SENIOR_START_AGE
      ? "senior"
      : "adult";

export const calculateDecadeFacts = (
  dayun: DayunResult,
  starPalace: Map<string, PalaceName>
): DecadeFacts[] =>
  dayun.periods.map((period) => {
    const ageRange = `${period.startAge}-${period.endAge}`;
    const lifeStage = toLifeStage(period.startAge, period.endAge);
    const lands = landSihua(calculateSihua(period.stemIndex), starPalace).sort(
      (a, b) =>
        DECADE_SIHUA_ORDER.indexOf(a.sihua) -
        DECADE_SIHUA_ORDER.indexOf(b.sihua)
    );
    const claims = lands
      .filter(
        ({ palace }) =>
          lifeStage !== "youth" || !YOUTH_EXCLUDED_PALACES.includes(palace)
      )
      .map(({ sihua, palace }) => {
        const claim = toClaim(
          `dayun${period.index}:${sihua}@${palace}`,
          "timing",
          SIHUA_PALACE_RULES[sihua][palace],
          undefined,
          0,
          ageRange
        );
        // 장면 씨앗(직장·연애·살림)은 성인기 장면이라 다른 생애 단계에는 주제만 넘긴다
        return lifeStage === "adult" && period.startAge >= SCENE_MIN_START_AGE
          ? claim
          : { ...claim, sceneSeeds: [] };
      });
    const score = lands.reduce(
      (sum, { sihua, palace }) =>
        sum +
        TIMING_SIHUA_SCORE[sihua] *
          (DECADE_CORE_PALACES.includes(palace) ? 1 : DECADE_SIDE_WEIGHT),
      0
    );
    return {
      startAge: period.startAge,
      endAge: period.endAge,
      stage: DECADE_STAGE[period.palace.name as PalaceName],
      lifeStage,
      claims,
      hasCoreHuaji: lands.some(
        ({ sihua, palace }) =>
          sihua === "화기" && DECADE_CORE_PALACES.includes(palace)
      ),
      score,
    };
  });

/**
 * 고비 = 대운 화기가 생활 중심 궁에 떨어지는 성인 구간 중 점수가 가장 낮은 곳.
 * (사화 4개를 합치면 화기 하나가 나머지에 상쇄돼 음수가 드물어서, 합계 부호로는 고르지 않는다)
 * 하이라이트 = 고비를 뺀 성인 구간 중 점수가 가장 높은(양수) 곳.
 */
export const pickDecadeTones = (
  decades: DecadeFacts[]
): Partial<Record<DecadeTone, number>> => {
  const adult = decades
    .map((d, index) => ({ d, index }))
    .filter(
      ({ d }) =>
        d.endAge >= DECADE_TONE_MIN_END_AGE &&
        d.startAge <= DECADE_TONE_MAX_START_AGE
    );
  const [hard] = adult
    .filter(({ d }) => d.hasCoreHuaji)
    .sort((a, b) => a.d.score - b.d.score || a.index - b.index);
  const [best] = adult
    .filter(({ index }) => index !== hard?.index)
    .sort((a, b) => b.d.score - a.d.score || a.index - b.index);
  return {
    ...(best && best.d.score > 0 ? { highlight: best.index } : {}),
    ...(hard ? { hard: hard.index } : {}),
  };
};

// ============================================================
// 메인
// ============================================================

export interface LifetimeFactSheetOptions {
  /** 음력 출생년 (대운 나이 → 연도 변환 기준) */
  birthYear: number;
  currentYear: number;
}

export const buildLifetimeFactSheet = (
  chart: ZiweiChart,
  dayun: DayunResult,
  { birthYear, currentYear }: LifetimeFactSheetOptions
): LifetimeFactSheet => {
  const starPalace = buildStarPalaceMap(chart.palaces);
  const claims = assignClaims(
    [
      ...collectBirthSihuaClaims(chart, starPalace),
      ...collectFlyingClaims(chart, starPalace),
      ...collectPairClaims(chart),
    ],
    collectFallbackClaims(chart)
  );

  const decades = calculateDecadeFacts(dayun, starPalace);

  return {
    claims,
    decades,
    decadeTones: pickDecadeTones(decades),
    evidence: pickEvidence(chart, claims),
    careerFields: collectCareerFields(chart),
    partner: pickPartner(chart),
    timing: calculateTiming(chart, dayun, birthYear, currentYear, starPalace),
  };
};
