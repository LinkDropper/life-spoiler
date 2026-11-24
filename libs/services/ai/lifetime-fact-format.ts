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

/** 연애 재료 표처럼 필드로 된 주장: 장면 단서·곁 사람의 말·피할 해석 */
const formatClaimMaterial = (claim: FortuneClaim): string =>
  [
    claim.cues?.length ? `  cues: ${claim.cues.join(" / ")}` : "",
    claim.voice ? `  voice: ${claim.voice}` : "",
    claim.avoid ? `  avoid: ${claim.avoid}` : "",
  ]
    .filter(Boolean)
    .map((line) => `\n${line}`)
    .join("");

export const formatClaim = (claim: FortuneClaim, index: number): string => {
  const period = claim.period ? ` | period: ${claim.period}` : "";
  const lens = claim.lens ? ` | lens: ${claim.lens}` : "";
  return `${index + 1}. [${claim.direction}, strength ${claim.strength}${period}${lens}] ${claim.topic}${formatClaimMaterial(claim)}`;
};

/** 스포일러·핵심 시나리오: 항목 구성이 서사 구조(본질·강점·약점·패턴 등)라 개수를 고정한다 */
const FIXED_ITEM_RULE =
  "- Keep exactly the number of items (subSections, bullets, paragraphs) the section's response format asks for. Do not add or drop items to match the number of claims: with fewer claims, cover different angles or scenes of the same claims; with more, merge or leave out the weakest.";

/**
 * 영역 섹션 소제목 개수: 말할 거리만큼(2~3).
 * v13~v14는 3개로 고정했는데, 주장이 2개(한 별의 강점·주의)뿐인 섹션은 3칸을 채우려고
 * 같은 이야기를 쪼개 되풀이했다(2003-08-08 인연 ②③). 재설계 1단계에서
 * 주장이 2개 이하면 2개, 3개 이상이면 3개로 둔다(docs/lifetime-prompt-redesign-2026-11.md §3.5).
 */
export const CATEGORY_ITEM_MIN = 2;
export const CATEGORY_ITEM_MAX = 3;

const categoryItemCount = (claimCount: number): number =>
  Math.min(CATEGORY_ITEM_MAX, Math.max(CATEGORY_ITEM_MIN, claimCount));

/**
 * 영역 섹션이면 소제목 개수를, 아니면 undefined.
 * 응답 스키마의 subSections 개수를 이 값으로 고정한다. 데이터 블록 지시만으로는
 * 모델이 응답 형식 예시(3개)를 따라 20개 섹션 모두 3개로 썼다.
 */
export const categorySubSectionCount = (
  sheet: LifetimeFactSheet,
  requestType: InterpretationType
): number | undefined => {
  const section = SECTION_BY_TYPE[requestType];
  if (!section || section === "core") return undefined;
  return categoryItemCount(sheet.claims[section].length);
};

const categoryItemRule = (count: number): string =>
  `- Write exactly ${count} items (subSections, or paragraphs when the format uses a content field), one angle per item. Do not split one claim into several items that say the same thing.`;

const narrationRules = (
  itemRule: string
): string => `Rules for using the fact sheet:
- Use these claims as the material for the section (their topics, each shown through at least one concrete scene, in your own words and in the response language). Claims are ordered by how central they are to this section: the first claim sets the section's main point; later claims support it or show its other side.
${itemRule}
- Do not pad by restating a point in other words. When a claim has more to show, use another of its cues; when it has nothing more, move to the next claim.
- Keep each claim's direction: positive → strength, negative → weak spot said plainly, mixed → both sides.
- Do not add life events, years, ages, job names or partner details that are not in this sheet.
- Build each scene yourself from the claim's cues (who/when/where/what); do not copy them as text. voice is material for a line someone close would say; lens is the angle the claim covers; avoid is the reading to steer clear of.`;

/**
 * KO 사실 시트 사용 규칙.
 * 영어 규칙 블록을 그대로 두면 지시문의 문체가 출력에 새어 "~니다"가 섞였다
 * (칸별 키워드 실험: 영어 16개 → 한국어 해요체 0개, 2003-08-08).
 */
const KO_FIXED_ITEM_RULE =
  "- 응답 형식이 정한 항목 수를 그대로 지켜요. 주장이 적으면 같은 주장의 다른 장면을 보여 주고, 많으면 약한 주장을 합치거나 빼요.";

const koCategoryItemRule = (count: number): string =>
  `- 문단은 정확히 ${count}개, 문단마다 관점 하나예요. 주장 하나를 여러 문단으로 쪼개 같은 이야기를 되풀이하지 않아요.`;

const koNarrationRules = (itemRule: string): string => `사실 시트 쓰는 법:
- 위 주장들이 이 섹션의 재료예요. 이 섹션 질문에 가까운 순서로 놓여 있어서, 판정은 첫 번째 주장에서 정해요. 나머지 주장은 그 판정을 보여 주는 다른 장면이나 반대쪽 모습으로 써요.
${itemRule}
- 주장의 방향을 지켜요. positive는 강점으로, negative는 약점을 그대로, mixed는 양쪽을 말해요.
- 장면은 주장의 cues로 직접 만들어요(언제·어디서·누구와·무엇). 단서를 그대로 옮기지 말고, 입력의 연애·직업 상태에 맞는 그 사람의 장면으로 만들어요. voice는 곁 사람이 할 법한 말의 재료예요. 상황에 맞게 고쳐서, 누가 말했는지 붙인 큰따옴표 대사로 장면 안에 넣어요. lens는 그 주장이 맡을 관점이고, avoid는 그렇게 읽히지 않게 할 해석이에요.
- 이 시트에 없는 사건, 나이, 연도, 직업명, 상대 정보는 만들지 않아요.`;

const sectionNarration = (
  language: Locale,
  kind: "fixed" | { count: number }
): string => {
  if (language === "ko") {
    return koNarrationRules(
      kind === "fixed" ? KO_FIXED_ITEM_RULE : koCategoryItemRule(kind.count)
    );
  }
  return narrationRules(
    kind === "fixed" ? FIXED_ITEM_RULE : categoryItemRule(kind.count)
  );
};

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
  /** 사실 시트 사용 규칙의 언어 (KO만 한국어 규칙) */
  language?: Locale;
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
- Claims with cues: build the scene from the cues and voice (rewritten, never copied). Claims without cues: invent one concrete scene that fits that period's age.`;

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
  language: Locale,
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
${sectionNarration(language, "fixed")}`;
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
  const language = decadeContext.language ?? "en";
  if (requestType === "lifetime_core") {
    return formatCoreBlock(
      sheet,
      language,
      formatDecadeTones(sheet, decadeContext)
    );
  }

  const section = SECTION_BY_TYPE[requestType];
  if (!section) return "";
  if (section === "core") return formatCoreBlock(sheet, language);

  const extra =
    requestType === "lifetime_career"
      ? formatCareerExtra(sheet)
      : requestType === "lifetime_relationship"
        ? formatRelationshipExtra(sheet)
        : "";

  return `## Fact Sheet — ${section} (engine-computed, internal only)
${formatSectionClaims(sheet, section)}

${sectionNarration(language, {
  count: categoryItemCount(sheet.claims[section].length),
})}${extra}`;
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
