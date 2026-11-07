import type { Locale } from "@/i18n/config";
import {
  TIMING_TOPIC_LABELS,
  type DecadeFacts,
  type FactCategory,
  type FortuneClaim,
  type LifetimeFactSheet,
} from "@/libs/zi-wei-dou-shu/calculators/lifetime-facts";
import type { FactSection } from "@/libs/zi-wei-dou-shu/constants/lifetime-facts/types";

import type {
  InterpretationType,
  TimingResponse,
  TimingSection,
} from "./types";

/**
 * 사실 시트 → LLM 입력 블록.
 * 지시는 언어 무관하게 영어로 쓰고(Relative Strength 블록과 같은 방식),
 * 주장 본문(topic·scene)은 KO 원문 그대로 넘긴다. 출력 언어는 시스템 프롬프트가 정한다.
 */

const SECTION_BY_TYPE: Partial<Record<InterpretationType, FactSection>> = {
  life_spoiler: "core",
  lifetime_core: "core",
  lifetime_profile_traits: "core",
  lifetime_wealth: "wealth",
  lifetime_career: "career",
  lifetime_relationship: "relationship",
  lifetime_health: "health",
};

const CATEGORY_SECTIONS: FactCategory[] = [
  "wealth",
  "career",
  "relationship",
  "health",
];

const formatClaim = (claim: FortuneClaim, index: number): string => {
  const scenes =
    claim.sceneSeeds.length > 0
      ? `\n  scenes: ${claim.sceneSeeds.map((s) => `"${s}"`).join(" / ")}`
      : "";
  const period = claim.period ? ` | period: ${claim.period}` : "";
  return `${index + 1}. [${claim.direction}, strength ${claim.strength}${period}] ${claim.topic}${scenes}`;
};

const NARRATION_RULES = `Rules for using the fact sheet:
- Use these claims as the material for the section (their topics + at least one scene each, rewritten in your own words and in the response language). Use claims in the given order; stronger claims get more space.
- Keep exactly the number of items (subSections, bullets, paragraphs) the section's response format asks for. Do not add or drop items to match the number of claims: with fewer claims, cover different angles or scenes of the same claims; with more, merge or leave out the weakest.
- Keep each claim's direction: positive → strength, negative → weak spot said plainly, mixed → both sides.
- Do not add life events, years, ages, job names or partner details that are not in this sheet.
- The scenes are seeds, not text to copy. Change the wording; keep the concrete who/when/where.`;

const formatSectionClaims = (
  sheet: LifetimeFactSheet,
  section: FactSection
): string => {
  const claims = sheet.claims[section];
  if (claims.length === 0) {
    return "(no strong signal in this area — write briefly and modestly from Relative Strength only)";
  }
  return claims.map(formatClaim).join("\n");
};

/**
 * 대운 구간 표기. 나이별 시나리오가 period 값을 이 문자열 그대로 복사하므로
 * 요청의 dayunPeriods(로케일 표기)를 우선 쓰고, 개수가 어긋나면 숫자 범위로 둔다.
 */
export interface DecadeContext {
  periodLabels?: string[];
  currentAge?: number;
}

const decadeLabel = (
  decades: DecadeFacts[],
  index: number,
  { periodLabels }: DecadeContext
): string =>
  periodLabels && periodLabels.length === decades.length
    ? periodLabels[index]
    : `${decades[index].startAge}-${decades[index].endAge}`;

/** 현재 나이가 속한 구간 + 다음 2개 구간 */
const FOCUS_AHEAD = 2;
/** 집중 구간이 아니면 앞쪽 주장 2개만 (화기·화록 우선 정렬) */
const NON_FOCUS_CLAIMS = 2;

const focusIndexes = (
  decades: DecadeFacts[],
  currentAge: number | undefined
): Set<number> => {
  if (currentAge === undefined) return new Set();
  const current = decades.findIndex(
    (d) => currentAge >= d.startAge && currentAge <= d.endAge
  );
  if (current < 0) return new Set();
  return new Set(
    Array.from({ length: FOCUS_AHEAD + 1 }, (_, i) => current + i).filter(
      (i) => i < decades.length
    )
  );
};

const DECADE_RULES = `Rules for the decade fact sheet:
- One ageScenarios item per period line above, in the same order; copy each period string verbatim.
- Write each period ONLY from that period's stage and claims: the headline names that period's stage in plain words, and every bullet carries one claim's topic plus one concrete scene from it (rewritten, not copied).
- Keep each claim's direction: negative → name the difficulty and the situation plainly; positive → the opportunity and where it shows up. Do not soften a negative claim with generic advice.
- Do not add generic life advice that no claim of that period supports (pace, rhythm, routines, setting standards, enduring, resting, writing things down).
- Two periods may share claims; then make them differ through their stage, and do not repeat a sentence or headline structure used in another period.
- A period with no claims: one short bullet from its stage only.
- Periods marked [youth]: write school, family and friend situations of that age. Never mention jobs, earning money, dating, marriage or children.
- Periods marked [senior]: write later-life situations (family, health, neighbours, hobbies, handing things over). No job hunting or promotions.
- Claims without scenes: invent one concrete scene that fits that period's age.`;

/** 나이별 시나리오: 대운 구간마다 무대 + 대운 사화 주장 */
const formatDecadeBlock = (
  sheet: LifetimeFactSheet,
  context: DecadeContext
): string => {
  const { decades } = sheet;
  const focus = focusIndexes(decades, context.currentAge);
  const lines = decades.map((decade, index) => {
    const isFocus = focus.has(index);
    const claims = isFocus
      ? decade.claims
      : decade.claims.slice(0, NON_FOCUS_CLAIMS);
    const body = claims.map((c, i) => `  ${formatClaim(c, i)}`).join("\n");
    const stageMark =
      decade.lifeStage === "adult" ? "" : ` [${decade.lifeStage}]`;
    return `- ${decadeLabel(decades, index, context)}${isFocus ? " [focus]" : ""}${stageMark} | stage: ${decade.stage}${body ? `\n${body}` : ""}`;
  });
  const focusLine =
    context.currentAge !== undefined
      ? `\n- **Focus on current age ${context.currentAge} Dayun period!**`
      : "";

  return `## Dayun (10-year cycles) — engine-computed fact sheet, internal only
${lines.join("\n")}${focusLine}

${DECADE_RULES}`;
};

/** 핵심 시나리오의 하이라이트·고비에 쓸 대운 (엔진이 고른 구간만) */
const formatDecadeTones = (
  sheet: LifetimeFactSheet,
  context: DecadeContext
): string => {
  const { decades, decadeTones } = sheet;
  const toneLine = (
    label: string,
    index: number | undefined,
    direction: "positive" | "negative"
  ): string => {
    if (index === undefined) {
      return `- ${label}: (none — write this paragraph without naming any age range)`;
    }
    const decade = decades[index];
    const claim =
      decade.claims.find((c) => c.direction === direction) ?? decade.claims[0];
    return `- ${label}: ${decadeLabel(decades, index, context)} | stage: ${decade.stage}${claim ? ` | ${claim.topic}` : ""}`;
  };

  return `### Dayun highlight and hard period (engine-selected)
${toneLine("highlight", decadeTones.highlight, "positive")}
${toneLine("hard", decadeTones.hard, "negative")}
- Use these age ranges verbatim for the highlight and trial paragraphs. Never name any other age or age range.`;
};

/** 스포일러·핵심 시나리오: 핵심 주장 + 각 영역 대표 주장 1개 */
const formatCoreBlock = (
  sheet: LifetimeFactSheet,
  decadeTones = ""
): string => {
  const highlights = CATEGORY_SECTIONS.flatMap((category) => {
    const [top] = sheet.claims[category];
    return top ? [`- ${category}: [${top.direction}] ${top.topic}`] : [];
  });
  return `## Fact Sheet — core (engine-computed, internal only)
${formatSectionClaims(sheet, "core")}

### One headline claim per area (mention at most briefly; areas have their own sections)
${highlights.join("\n") || "- (none)"}
${decadeTones ? `\n${decadeTones}\n` : ""}
${NARRATION_RULES}`;
};

const formatCareerExtra = (sheet: LifetimeFactSheet): string =>
  sheet.careerFields.length > 0
    ? `\n\n### Field candidates (engine-selected)
${sheet.careerFields.map((f) => `- ${f}`).join("\n")}
- Output \`fields\`: 3~5 of these candidates, translated into the response language as short field names. Do not invent fields outside this list. You may name 1~2 of them in the body.`
    : `\n\n- Output \`fields\` as an empty array (no engine candidates).`;

const formatRelationshipExtra = (sheet: LifetimeFactSheet): string => {
  const { partner } = sheet;
  if (!partner) {
    return `\n\n- Output \`partner\` as null (no engine data).`;
  }
  return `\n\n### Partner profile (engine-selected)
- traits: ${partner.traits.join(", ")}
- role in the relationship: ${partner.role}
- meeting paths: ${partner.meetingPaths.join(", ")}
- Output \`partner\` with these items rewritten naturally in the response language: traits exactly 2~3 short phrases, role one sentence, meetingPaths exactly 2~3 short phrases (never more than 3). Never state appearance, job title, age or a specific name.`;
};

const formatTimingBlock = (sheet: LifetimeFactSheet): string => {
  const timing = sheet.timing
    .map((entry) => {
      const likely =
        entry.likely.length > 0
          ? entry.likely
              .map((y) => `  - likely ${y.year}: ${y.reasons.join(" / ")}`)
              .join("\n")
          : "  - likely: (none)";
      const caution = entry.caution
        ? `\n  - caution ${entry.caution.year}: ${entry.caution.reasons.join(" / ")}`
        : "";
      return `- topic ${entry.topic} (${TIMING_TOPIC_LABELS[entry.topic]})\n${likely}${caution}`;
    })
    .join("\n");

  return `## Fact Sheet — timing (engine-computed, internal only)
### Future year candidates
${timing}

Rules:
- timing: one entry per topic above, same topic keys. Use ONLY the years listed. likely = the listed likely years (same order); caution = the listed caution year or null.
- reason: one sentence (≤ 45 Korean characters or ≤ 90 Latin characters) in plain words that says what kind of year it is for that topic, built from the given reasons. Say "가능성이 높은 해" level probability, never certainty.`;
};

export const formatFactSheetBlock = (
  sheet: LifetimeFactSheet,
  requestType: InterpretationType,
  decadeContext: DecadeContext = {}
): string => {
  if (requestType === "lifetime_timing") return formatTimingBlock(sheet);
  if (requestType === "lifetime_age_scenarios") {
    return formatDecadeBlock(sheet, decadeContext);
  }
  if (requestType === "lifetime_core") {
    return formatCoreBlock(sheet, formatDecadeTones(sheet, decadeContext));
  }

  const section = SECTION_BY_TYPE[requestType];
  if (!section) return "";
  if (section === "core") return formatCoreBlock(sheet);

  const extra =
    requestType === "lifetime_career"
      ? formatCareerExtra(sheet)
      : requestType === "lifetime_relationship"
        ? formatRelationshipExtra(sheet)
        : "";

  return `## Fact Sheet — ${section} (engine-computed, internal only)
${formatSectionClaims(sheet, section)}

${NARRATION_RULES}${extra}`;
};

// ============================================================
// 응답 병합 (엔진 값 우선)
// ============================================================

/** LLM 타이밍 응답에서 시트에 없는 연도를 버리고 시트 순서로 맞춘다 */
export const mergeTiming = (
  sheet: LifetimeFactSheet,
  response: TimingResponse
): TimingSection[] =>
  sheet.timing.map((entry) => {
    const llm = response.timing.find((t) => t.topic === entry.topic);
    const reasonFor = (year: number): string =>
      llm?.likely.find((y) => y.year === year)?.reason ??
      (llm?.caution?.year === year ? llm.caution.reason : "");
    return {
      topic: entry.topic,
      likely: entry.likely.map((y) => ({
        year: y.year,
        reason: reasonFor(y.year),
      })),
      ...(entry.caution
        ? {
            caution: {
              year: entry.caution.year,
              reason: reasonFor(entry.caution.year),
            },
          }
        : {}),
    };
  });

export const pickEvidence = (
  sheet: LifetimeFactSheet,
  category: FactCategory,
  language: Locale
): string | undefined => sheet.evidence[category]?.[language];
