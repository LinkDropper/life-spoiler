import type { Locale } from "@/i18n/config";
import { defaultLocale } from "@/i18n/config";

import { AIError } from "./errors";
import type { OutputValidatorOptions } from "./output-validator";
import { enCompatibilityPrompts } from "./prompts/compatibility-en";
import { jaCompatibilityPrompts } from "./prompts/compatibility-ja";
import {
  buildKoCategoriesCombinedPrompt,
  koCompatibilityPrompts,
} from "./prompts/compatibility-ko";
import type { CompatibilityLocalizedPrompts } from "./prompts/compatibility-ko";
import type {
  CompatibilityCategoryResponse,
  CompatibilityCategoriesCombinedResponse,
  CompatibilityInsightsResponse,
  CompatibilityInterpretationRequest,
  CompatibilityInterpretationType,
  CompatibilityOverviewResponse,
  CompatibilityScenariosResponse,
  GeminiResponseSchema,
  GeminiSchemaProperty,
} from "./types";
import {
  CompatibilityCategoryResponseSchema,
  CompatibilityCategoriesCombinedResponseSchema,
  CompatibilityInsightsResponseSchema,
  CompatibilityOverviewResponseSchema,
  CompatibilityScenariosResponseSchema,
} from "./types";
import { CURRENT_MODEL_NAME } from "./provider";
import { completeWithViolationRetry, withJudgment } from "./violation-retry";
import type { CompatibilityResult } from "@/libs/hooks/compatibility/types";

// ============================================================
// Gemini responseSchema 정의 (궁합)
// ============================================================

/** Sub-section (heading + body) — 신규 구조화 응답용 */
const SUB_SECTION_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    heading: { type: "string" },
    body: { type: "string" },
  },
  required: ["heading", "body"],
};

const INSIGHT_ITEM_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    label: { type: "string" },
    headline: { type: "string" },
    content: { type: "string" },
  },
  required: ["score", "label", "headline", "content"],
};

/**
 * 궁합 오버뷰 스키마.
 * 신규: subSections + oneLiner / 레거시: spoiler.
 */
const COMPATIBILITY_OVERVIEW_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    headline: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    spoiler: { type: "string" },
    subSections: {
      type: "array",
      items: SUB_SECTION_SCHEMA,
      minItems: 3,
      maxItems: 5,
    },
    oneLiner: { type: "string" },
    profileASummary: { type: "string" },
    profileBSummary: { type: "string" },
  },
  required: ["headline", "tags", "profileASummary", "profileBSummary"],
};

const COMPATIBILITY_INSIGHTS_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    overall: INSIGHT_ITEM_SCHEMA,
    zodiac: INSIGHT_ITEM_SCHEMA,
    fiveElement: INSIGHT_ITEM_SCHEMA,
    chemistry: INSIGHT_ITEM_SCHEMA,
    communication: INSIGHT_ITEM_SCHEMA,
    growthSynergy: INSIGHT_ITEM_SCHEMA,
    trustIndex: INSIGHT_ITEM_SCHEMA,
    crisisResilience: INSIGHT_ITEM_SCHEMA,
  },
  required: [
    "overall",
    "zodiac",
    "fiveElement",
    "chemistry",
    "communication",
    "growthSynergy",
    "trustIndex",
    "crisisResilience",
  ],
};

const COMPATIBILITY_SCENARIOS_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    coreScenarios: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
          subSections: {
            type: "array",
            items: SUB_SECTION_SCHEMA,
            minItems: 2,
            maxItems: 4,
          },
          oneLiner: { type: "string" },
        },
        required: ["title"],
      },
      minItems: 2,
      maxItems: 4,
    },
    advice: { type: "string" },
    adviceSubSections: {
      type: "array",
      items: SUB_SECTION_SCHEMA,
      minItems: 2,
      maxItems: 4,
    },
    adviceOneLiner: { type: "string" },
  },
  required: ["coreScenarios"],
};

const COMPATIBILITY_CATEGORY_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    headline: { type: "string" },
    content: { type: "string" },
    subSections: {
      type: "array",
      items: SUB_SECTION_SCHEMA,
      minItems: 2,
      maxItems: 4,
    },
    oneLiner: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
  },
  required: ["headline", "tags"],
};

/** 4개 카테고리 통합 스키마 (1회 호출로 통합) */
const COMPATIBILITY_CATEGORIES_COMBINED_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    communication: COMPATIBILITY_CATEGORY_SCHEMA,
    growth: COMPATIBILITY_CATEGORY_SCHEMA,
    emotion: COMPATIBILITY_CATEGORY_SCHEMA,
    crisis: COMPATIBILITY_CATEGORY_SCHEMA,
  },
  required: ["communication", "growth", "emotion", "crisis"],
};

const COMPATIBILITY_RESPONSE_SCHEMA_MAP: Record<
  CompatibilityInterpretationType | "compatibility_categories_combined",
  GeminiResponseSchema
> = {
  compatibility_overview: COMPATIBILITY_OVERVIEW_SCHEMA,
  compatibility_insights: COMPATIBILITY_INSIGHTS_SCHEMA,
  compatibility_core_scenarios: COMPATIBILITY_SCENARIOS_SCHEMA,
  compatibility_communication: COMPATIBILITY_CATEGORY_SCHEMA,
  compatibility_growth: COMPATIBILITY_CATEGORY_SCHEMA,
  compatibility_emotion: COMPATIBILITY_CATEGORY_SCHEMA,
  compatibility_crisis: COMPATIBILITY_CATEGORY_SCHEMA,
  compatibility_categories_combined: COMPATIBILITY_CATEGORIES_COMBINED_SCHEMA,
};

// ============================================================
// KO 스키마 (인생 운세 재설계와 같은 순서)
// ============================================================
//
// strict 모드는 속성 순서대로 생성하므로 judgment(판정) → 본문 → 제목 순으로 둔다.
// 레거시 칸(spoiler, content, advice)은 빼서 같은 내용을 두 번 쓰지 않게 한다.
// 인사이트는 화면에 점수·라벨만 나와서 headline·content를 생성하지 않는다.

const subSections = (count: number): GeminiSchemaProperty => ({
  type: "array",
  items: SUB_SECTION_SCHEMA,
  minItems: count,
  maxItems: count,
});

const KO_OVERVIEW_SCHEMA: GeminiResponseSchema = withJudgment({
  type: "object",
  properties: {
    subSections: subSections(3),
    headline: { type: "string" },
    oneLiner: { type: "string" },
    tags: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 3,
    },
    profileASummary: { type: "string" },
    profileBSummary: { type: "string" },
  },
  required: [
    "subSections",
    "headline",
    "oneLiner",
    "tags",
    "profileASummary",
    "profileBSummary",
  ],
});

const KO_INSIGHT_ITEM_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    label: { type: "string" },
  },
  required: ["score", "label"],
};

const KO_INSIGHTS_SCHEMA: GeminiResponseSchema = {
  ...COMPATIBILITY_INSIGHTS_SCHEMA,
  properties: Object.fromEntries(
    Object.keys(COMPATIBILITY_INSIGHTS_SCHEMA.properties ?? {}).map((key) => [
      key,
      KO_INSIGHT_ITEM_SCHEMA,
    ])
  ),
};

const KO_SCENARIOS_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    coreScenarios: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: withJudgment({
        type: "object",
        properties: {
          subSections: subSections(3),
          title: { type: "string" },
          oneLiner: { type: "string" },
        },
        required: ["subSections", "title", "oneLiner"],
      }),
    },
    adviceSubSections: subSections(3),
    adviceOneLiner: { type: "string" },
  },
  required: ["coreScenarios", "adviceSubSections", "adviceOneLiner"],
};

const KO_CATEGORY_SCHEMA: GeminiResponseSchema = withJudgment({
  type: "object",
  properties: {
    subSections: subSections(3),
    headline: { type: "string" },
    oneLiner: { type: "string" },
    tags: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 2,
    },
  },
  required: ["subSections", "headline", "oneLiner", "tags"],
});

const KO_CATEGORIES_COMBINED_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    communication: KO_CATEGORY_SCHEMA,
    growth: KO_CATEGORY_SCHEMA,
    emotion: KO_CATEGORY_SCHEMA,
    crisis: KO_CATEGORY_SCHEMA,
  },
  required: ["communication", "growth", "emotion", "crisis"],
};

type SchemaKey =
  | CompatibilityInterpretationType
  | "compatibility_categories_combined";

const KO_RESPONSE_SCHEMA_MAP: Record<SchemaKey, GeminiResponseSchema> = {
  compatibility_overview: KO_OVERVIEW_SCHEMA,
  compatibility_insights: KO_INSIGHTS_SCHEMA,
  compatibility_core_scenarios: KO_SCENARIOS_SCHEMA,
  compatibility_communication: KO_CATEGORY_SCHEMA,
  compatibility_growth: KO_CATEGORY_SCHEMA,
  compatibility_emotion: KO_CATEGORY_SCHEMA,
  compatibility_crisis: KO_CATEGORY_SCHEMA,
  compatibility_categories_combined: KO_CATEGORIES_COMBINED_SCHEMA,
};

const isKoRequest = (language?: Locale): boolean =>
  (language ?? defaultLocale) === "ko";

const responseSchemaFor = (
  key: SchemaKey,
  language?: Locale
): GeminiResponseSchema =>
  isKoRequest(language)
    ? KO_RESPONSE_SCHEMA_MAP[key]
    : COMPATIBILITY_RESPONSE_SCHEMA_MAP[key];

/**
 * 장면 3개·카테고리 4개를 한 응답에 쓰는 호출은 "~사람이에요" 맺음 허용을 늘린다.
 * 나머지는 인생 운세와 같은 기준이다.
 */
const validatorOptionsFor = (key: SchemaKey): OutputValidatorOptions =>
  key === "compatibility_categories_combined"
    ? { maxJudgmentEndings: 6 }
    : key === "compatibility_core_scenarios"
      ? { maxJudgmentEndings: 4 }
      : {};

// ============================================================
// 프롬프트 가져오기
// ============================================================

const compatibilityPromptsByLocale: Record<
  Locale,
  CompatibilityLocalizedPrompts
> = {
  ko: koCompatibilityPrompts,
  en: enCompatibilityPrompts,
  ja: jaCompatibilityPrompts,
};

const getCompatibilityPrompts = (
  language?: Locale
): CompatibilityLocalizedPrompts => {
  const locale = language ?? defaultLocale;
  return compatibilityPromptsByLocale[locale];
};

// ============================================================
// 프롬프트 입력 데이터 정리
// ============================================================

/**
 * 신규(subSections+oneLiner) / 레거시(spoiler) 어느 쪽이든 안전하게 첫 문장 발췌.
 * previousContext 불릿 안에 들어가므로 모든 whitespace 를 단일 공백으로 평탄화.
 */
const extractCompatibilityOpening = (
  subSections: { heading: string; body: string }[] | undefined,
  oneLiner: string | undefined,
  legacyText: string | undefined,
  maxLength = 150
): string => {
  const candidate =
    subSections?.[0]?.body?.trim() ||
    oneLiner?.trim() ||
    legacyText?.trim() ||
    "";
  return candidate.replace(/\s+/g, " ").slice(0, maxLength).trim();
};

/** 별 간 상호작용 문자열에서 "= 설명" 부분만 추출하는 헬퍼 */
const sanitizeStarInteraction = (interaction: string): string => {
  // "A 궁이름 별이름(밝기) + B 궁이름 별이름(밝기) = 설명" → "설명" 부분만 추출
  const equalsIdx = interaction.indexOf("=");
  if (equalsIdx !== -1) {
    return interaction.slice(equalsIdx + 1).trim();
  }
  return interaction;
};

/** 긴 텍스트에 줄바꿈이 없으면 자동으로 단락을 삽입하는 후처리 함수 */
const ensureLineBreaks = (text: string): string => {
  // 이미 이중 줄바꿈(단락 구분)이 있으면 그대로
  if (text.includes("\n\n")) return text;
  // 짧은 텍스트는 구분 불필요
  if (text.length < 150) return text;

  // 단일 \n만 있으면 → 문장 종결 뒤에서만 \n\n으로 승격
  if (text.includes("\n")) {
    let result = text.replace(/([.!?…다요죠까])\s*\n/g, "$1\n\n");
    // 남은 단독 \n은 공백으로 교체 (문장 중간의 잘못된 줄바꿈)
    result = result.replace(/(?<!\n)\n(?!\n)/g, " ");
    return result;
  }

  // 줄바꿈이 전혀 없는 경우: 문장 경계에서 자동 단락 분리
  const boundaries: number[] = [];
  for (let i = 0; i < text.length - 1; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (
      next === " " &&
      (ch === "." ||
        ch === "!" ||
        ch === "?" ||
        ch === "요" ||
        ch === "죠" ||
        ch === "다")
    ) {
      boundaries.push(i + 1);
    }
  }

  if (boundaries.length < 2) return text;

  // 80자 이상 누적되면 문장 경계에서 단락 분리
  const paragraphs: string[] = [];
  let start = 0;

  for (const boundaryIdx of boundaries) {
    if (boundaryIdx - start >= 80) {
      paragraphs.push(text.slice(start, boundaryIdx).trim());
      start = boundaryIdx + 1;
    }
  }

  const remaining = text.slice(start).trim();
  if (remaining) {
    paragraphs.push(remaining);
  }

  return paragraphs.length > 1 ? paragraphs.join("\n\n") : text;
};

/** AI가 문장 중간에 잘못 삽입한 \n\n을 정리하는 후처리 함수 */
const cleanupBrokenLineBreaks = (text: string): string => {
  if (!text.includes("\n\n")) return text;

  const parts = text.split(/\n\n+/);
  if (parts.length <= 1) return text;

  const merged: string[] = [];
  let buffer = parts[0].trim();

  for (let i = 1; i < parts.length; i++) {
    const next = parts[i].trim();
    if (!next) continue;
    if (!buffer) {
      buffer = next;
      continue;
    }

    // buffer가 문장 종결 패턴으로 끝나고 충분히 길면 → 단락 구분 유지
    const endsWithSentenceEnd =
      /[.!?…]\s*$/.test(buffer) || /[다요죠까]\s*$/.test(buffer);

    if (endsWithSentenceEnd && buffer.length >= 40) {
      merged.push(buffer);
      buffer = next;
    } else {
      // 문장 중간이거나 너무 짧은 조각 → 이어붙이기
      buffer += ` ${next}`;
    }
  }

  if (buffer.trim()) merged.push(buffer.trim());

  return merged.join("\n\n");
};

/** 객체의 모든 문자열 필드에 cleanupBrokenLineBreaks 적용 */
const cleanupAllBrokenLineBreaks = <T>(obj: T): T => {
  if (typeof obj === "string") {
    return cleanupBrokenLineBreaks(obj) as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanupAllBrokenLineBreaks(item)) as T;
  }
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = cleanupAllBrokenLineBreaks(value);
    }
    return result as T;
  }
  return obj;
};

/** 객체의 모든 문자열 필드에 줄바꿈을 보장 (ensureLineBreaks의 길이 체크로 짧은 필드는 무시) */
const ensureAllLineBreaks = <T>(obj: T): T => {
  if (typeof obj === "string") {
    return ensureLineBreaks(obj) as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => ensureAllLineBreaks(item)) as T;
  }
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = ensureAllLineBreaks(value);
    }
    return result as T;
  }
  return obj;
};

// ============================================================
// 데이터 포맷팅 (사전 분석 기반)
// ============================================================

/** 궁 이름 → 손님이 알아듣는 영역 이름 (궁 이름은 출력 금지라 넘기지 않는다) */
const PALACE_AREA_LABELS: Record<string, string> = {
  명궁: "성격",
  부처궁: "가까운 관계",
  재백궁: "돈",
  관록궁: "일",
  질액궁: "몸과 컨디션",
  천이궁: "바깥 활동",
  복덕궁: "마음과 쉼",
  부모궁: "윗사람",
  형제궁: "형제와 동료",
  자녀궁: "아랫사람",
  노복궁: "사회 관계",
  전택궁: "집과 살림",
  교우궁: "친구와 인맥",
};

const palaceToArea = (palace: string): string =>
  PALACE_AREA_LABELS[palace] || palace;

const list = (items: string[], empty = "없음"): string =>
  items.length > 0 ? items.join(", ") : empty;

/**
 * 엔진 사전 분석 문구 중 궁·별 이름과 밝기가 그대로 들어간 것(예: "복덕궁: A 태음(함) + B 무곡(왕)
 * → tension", "긴장 에너지가 전택궁 영역에 존재")과 성격 프로필을 되풀이한 것("A 소통: …")은
 * 넘기지 않는다. 모델이 용어를 그대로 옮기거나 같은 말을 되풀이했다.
 */
const ENGINE_TERM_POINT =
  /(궁|→|사화|밝기|\((?:묘|왕|득|리|평|함)\)|에너지|tension|good)|^(?:A|B) (?:소통|가치관|감정|갈등):/;

const usablePoints = (points: string[]): string[] =>
  points.filter((p) => !ENGINE_TERM_POINT.test(p));

/** 엔진 문구의 "A", "B"를 이름으로 바꾼다 (A/B 혼동 방지) */
const withNames = (text: string, nameA: string, nameB: string): string =>
  text
    .replace(/(^|\s|vs\s)A(?=의|\s|$)/g, `$1${nameA}`)
    .replace(/(^|\s|vs\s)B(?=의|\s|$)/g, `$1${nameB}`);

const formatPersonality = (
  title: string,
  p: NonNullable<CompatibilityInterpretationRequest["personalityA"]>,
  isAnimal: boolean
): string =>
  `## ${title} (엔진 사전 분석, 내부용)
- ${isAnimal ? "핵심 기질" : "핵심 성격"}: ${list(p.coreTraits)}
- ${isAnimal ? "표현하는 방식" : "말하는 방식"}: ${list(p.communicationStyle)}
- 감정 패턴: ${list(p.emotionalPattern)}
- ${isAnimal ? "스트레스 반응" : "갈등 대처"}: ${list(p.conflictStyle)}
- ${isAnimal ? "평소 성향" : "가치관"}: ${list(p.valueOrientation)}
- 관계에서의 강점: ${list(p.strengths)}
- 관계에서의 약점: ${list(p.weaknesses)}
- 타고난 오행: ${p.dominantElement}`;

/**
 * 사전 분석 데이터를 AI 입력용으로 포맷한다.
 *
 * 인생 운세 사실 시트처럼 엔진이 미리 계산한 결론만 넘긴다. 예전 블록은 이모지 헤더,
 * 영어 헤더(Profile A Info, Zodiac Compatibility, Score Range), "⚠️ 실패" 경고와
 * 생년 음력 원문을 함께 넘겼고, 지시문 문체가 출력에 샜다. 지금은 해요체 한국어로만 쓴다.
 * 이름 혼동·전문 용어 규칙은 시스템 프롬프트와 output-validator가 맡는다.
 */
const formatCompatibilityDataForAI = (
  request: CompatibilityInterpretationRequest
): string => {
  const {
    profileA,
    profileB,
    chartA,
    chartB,
    relationshipType,
    zodiacCompatibility,
    fiveElementCompatibility,
    previousContext,
  } = request;

  const genderLabel = (gender: string) => (gender === "male" ? "남성" : "여성");
  const isPetRelationship =
    request.relationshipTypeKey === "cat_owner" ||
    request.relationshipTypeKey === "dog_owner";
  const petAnimalLabel =
    request.relationshipTypeKey === "cat_owner" ? "고양이" : "강아지";
  const nameA = `${profileA.name}님`;
  const nameB = isPetRelationship ? profileB.name : `${profileB.name}님`;

  // ──── 관계 ────
  const relationLines = isPetRelationship
    ? [
        `- 관계: ${relationshipType}`,
        `- 집사: ${nameA} (${genderLabel(profileA.gender)}, ${profileA.currentAge}세)`,
        `- 반려${petAnimalLabel}: ${nameB} (이름만 불러요)`,
      ]
    : (() => {
        const ageDiff = Math.abs(profileA.currentAge - profileB.currentAge);
        const older =
          profileA.currentAge >= profileB.currentAge ? nameA : nameB;
        return [
          `- 관계: ${relationshipType}`,
          `- ${nameA}: ${genderLabel(profileA.gender)}, ${profileA.currentAge}세 (${profileA.birthYear}년생)`,
          `- ${nameB}: ${genderLabel(profileB.gender)}, ${profileB.currentAge}세 (${profileB.birthYear}년생)`,
          ageDiff === 0
            ? "- 나이: 동갑이에요"
            : `- 나이: ${older}이 ${ageDiff}살 많아요`,
        ];
      })();

  const blocks: string[] = [`## 관계\n${relationLines.join("\n")}`];

  // ──── 성격 프로필 ────
  if (request.personalityA && request.personalityB) {
    blocks.push(
      formatPersonality(
        isPetRelationship
          ? `집사 ${nameA} 성격 프로필`
          : `${nameA} 성격 프로필`,
        request.personalityA,
        false
      ),
      formatPersonality(
        isPetRelationship
          ? `반려${petAnimalLabel} ${nameB} 기질 프로필`
          : `${nameB} 성격 프로필`,
        request.personalityB,
        isPetRelationship
      )
    );
  }

  // ──── 교차 분석 ────
  if (request.analysis) {
    const a = request.analysis;
    const interactions = [
      ...new Set([
        ...a.communication.starInteractions.slice(0, 2),
        ...a.growth.starInteractions.slice(0, 1),
        ...a.emotion.starInteractions.slice(0, 1),
        ...a.crisis.starInteractions.slice(0, 1),
      ]),
    ]
      .map(sanitizeStarInteraction)
      .filter((i) => !ENGINE_TERM_POINT.test(i))
      .map((i) => `- ${i}`);
    const named = (items: string[]) =>
      usablePoints(items).map((d) => `- ${withNames(d, nameA, nameB)}`);
    const orNone = (lines: string[]) =>
      lines.length > 0 ? lines.join("\n") : "- 따로 없음";
    const category = (points: string[]) =>
      usablePoints(points)
        .map((d) => withNames(d, nameA, nameB))
        .join(" / ") || "따로 없음";
    blocks.push(`## 두 사람 교차 분석 (엔진 사전 분석, 내부용)
### 핵심 역학
${orNone(named(a.keyDynamics))}

### 잘 맞는 점
${orNone(named(a.synergyPoints))}

### 부딪히는 점
${orNone(named(a.tensionPoints))}

### 영역별
- 소통: ${category(a.communication.analysisPoints)}
- 성장: ${category(a.growth.analysisPoints)}
- 감정: ${category(a.emotion.analysisPoints)}
- 위기: ${category(a.crisis.analysisPoints)}

### 자주 보이는 상호작용
${orNone(interactions)}`);
  }

  // ──── 타고난 쪽 ────
  const fortuneLine = (name: string, chart: typeof chartA) =>
    `- ${name}: 운이 모이는 곳은 ${palaceToArea(chart.sihua.hualu.palace)}, 스트레스가 생기기 쉬운 곳은 ${palaceToArea(chart.sihua.huaji.palace)}`;
  const fortuneLines = [fortuneLine(nameA, chartA), fortuneLine(nameB, chartB)];
  if (request.huajiCrossAnalysis) {
    const h = request.huajiCrossAnalysis;
    const areas = (palaces: string[]) =>
      palaces.length > 0 ? palaces.map(palaceToArea).join(", ") : "없음";
    fortuneLines.push(
      `- ${nameA}의 스트레스가 ${nameB}에게 닿는 곳: ${areas(h.aHuajiAffectsBPalaces)}`,
      `- ${nameB}의 스트레스가 ${nameA}에게 닿는 곳: ${areas(h.bHuajiAffectsAPalaces)}`,
      `- 둘의 스트레스가 같은 곳에 몰려요: ${h.bothHuajiSameArea ? "예" : "아니오"}`
    );
  }
  blocks.push(`## 타고난 쪽 (참고용)\n${fortuneLines.join("\n")}`);

  // ──── 띠·오행 ────
  blocks.push(`## 띠 궁합\n${zodiacCompatibility}`);
  blocks.push(`## 오행 궁합\n${fiveElementCompatibility}`);

  // ──── 점수 범위 ────
  const scoreLines: string[] = [];
  if (request.scoreRange) {
    scoreLines.push(
      `- overall: ${request.scoreRange.min}~${request.scoreRange.max}`
    );
  }
  if (request.analysis?.scoreConstraints) {
    for (const [key, c] of Object.entries(request.analysis.scoreConstraints)) {
      scoreLines.push(`- ${key}: ${c.min}~${c.max} (권장 ${c.suggested})`);
    }
  }
  if (scoreLines.length > 0) {
    blocks.push(`## 점수 범위 (엔진 계산, 내부용)\n${scoreLines.join("\n")}`);
  }

  if (previousContext) {
    blocks.push(previousContext);
  }

  return blocks.join("\n\n");
};

// ============================================================
// 단일 해석 요청
// ============================================================

const requestCompatibilityInterpretation = async <T>(
  request: CompatibilityInterpretationRequest,
  schema: { parse: (data: unknown) => T },
  options?: { maxTokens?: number }
): Promise<T> => {
  const prompts = getCompatibilityPrompts(request.language);
  const chartData = formatCompatibilityDataForAI(request);
  const typePrompts = prompts.userPrompts[request.relationshipTypeKey];
  const userPrompt = typePrompts[request.requestType];

  const fullUserPrompt = `${chartData}

---

${userPrompt}`;

  const responseSchema = responseSchemaFor(
    request.requestType,
    request.language
  );

  // 금지 용어·문체 위반이 있으면 피드백을 붙여 1회 재생성한다 (인생 운세와 같은 검사기)
  const { parsed } = await completeWithViolationRetry(
    [
      {
        role: "system",
        content: prompts.systemPrompts[request.relationshipTypeKey],
      },
      { role: "user", content: fullUserPrompt },
    ],
    {
      language: request.language,
      completion: {
        responseSchema,
        ...(options?.maxTokens && { maxTokens: options.maxTokens }),
      },
      validator: validatorOptionsFor(request.requestType),
      label: `compatibility:${request.requestType}`,
    }
  );

  try {
    return schema.parse(parsed);
  } catch (error) {
    throw new AIError("AI 응답이 예상된 형식과 다릅니다.", {
      code: "RESPONSE_PARSE_FAILED",
      originalError: error as Error,
      requestType: request.requestType,
    });
  }
};

// ============================================================
// 개별 해석 함수
// ============================================================

// 큰 응답이 필요한 호출의 maxTokens (기본 6000으로는 부족)
// - overview: spoiler 600-700자 → ~1,500 토큰
// - insights: 8항목 × 350자 → ~6,000+ 토큰
// - scenarios: 3×650자 + advice 650자 → ~5,500+ 토큰
// - categories combined: 4개 × 400자 → ~8,000+ 토큰
const LARGE_RESPONSE_MAX_TOKENS = 12000;

export const interpretCompatibilityOverview = async (
  request: Omit<CompatibilityInterpretationRequest, "requestType">
): Promise<CompatibilityOverviewResponse> => {
  return requestCompatibilityInterpretation(
    { ...request, requestType: "compatibility_overview" },
    CompatibilityOverviewResponseSchema,
    { maxTokens: LARGE_RESPONSE_MAX_TOKENS }
  );
};

export const interpretCompatibilityInsights = async (
  request: Omit<CompatibilityInterpretationRequest, "requestType">
): Promise<CompatibilityInsightsResponse> => {
  return requestCompatibilityInterpretation(
    { ...request, requestType: "compatibility_insights" },
    CompatibilityInsightsResponseSchema,
    { maxTokens: LARGE_RESPONSE_MAX_TOKENS }
  );
};

export const interpretCompatibilityCoreScenarios = async (
  request: Omit<CompatibilityInterpretationRequest, "requestType">
): Promise<CompatibilityScenariosResponse> => {
  return requestCompatibilityInterpretation(
    { ...request, requestType: "compatibility_core_scenarios" },
    CompatibilityScenariosResponseSchema,
    { maxTokens: LARGE_RESPONSE_MAX_TOKENS }
  );
};

export const interpretCompatibilityCommunication = async (
  request: Omit<CompatibilityInterpretationRequest, "requestType">
): Promise<CompatibilityCategoryResponse> => {
  return requestCompatibilityInterpretation(
    { ...request, requestType: "compatibility_communication" },
    CompatibilityCategoryResponseSchema
  );
};

export const interpretCompatibilityGrowth = async (
  request: Omit<CompatibilityInterpretationRequest, "requestType">
): Promise<CompatibilityCategoryResponse> => {
  return requestCompatibilityInterpretation(
    { ...request, requestType: "compatibility_growth" },
    CompatibilityCategoryResponseSchema
  );
};

export const interpretCompatibilityEmotion = async (
  request: Omit<CompatibilityInterpretationRequest, "requestType">
): Promise<CompatibilityCategoryResponse> => {
  return requestCompatibilityInterpretation(
    { ...request, requestType: "compatibility_emotion" },
    CompatibilityCategoryResponseSchema
  );
};

export const interpretCompatibilityCrisis = async (
  request: Omit<CompatibilityInterpretationRequest, "requestType">
): Promise<CompatibilityCategoryResponse> => {
  return requestCompatibilityInterpretation(
    { ...request, requestType: "compatibility_crisis" },
    CompatibilityCategoryResponseSchema
  );
};

/**
 * 4개 카테고리 통합 해석 (1회 호출)
 * communication, growth, emotion, crisis를 한번에 생성하여 일관성 보장
 */
export const interpretCompatibilityCategoriesCombined = async (
  request: Omit<CompatibilityInterpretationRequest, "requestType">
): Promise<CompatibilityCategoriesCombinedResponse> => {
  const prompts = getCompatibilityPrompts(request.language);
  const chartData = formatCompatibilityDataForAI({
    ...request,
    requestType: "compatibility_communication", // 타입 호환용, 실제로는 사용 안 됨
  });

  // 4개 카테고리 통합 프롬프트 구성 (KO는 섹션별 질문을 둔 새 프롬프트)
  const categoriesPrompt = isKoRequest(request.language)
    ? buildKoCategoriesCombinedPrompt(request.relationshipTypeKey)
    : `아래 4가지 카테고리를 **하나의 JSON 응답**으로 한번에 작성해주세요.
⚠️ 위의 성격 프로필과 교차 분석 결과를 반드시 활용하세요.
⚠️ 4개 카테고리 간 성격 묘사가 일관되어야 합니다. A와 B의 성격을 절대 혼동하지 마세요.

### communication (소통 & 갈등)
${prompts.userPrompts[request.relationshipTypeKey].compatibility_communication}

### growth (재물 & 성장)
${prompts.userPrompts[request.relationshipTypeKey].compatibility_growth}

### emotion (감정 & 신뢰)
${prompts.userPrompts[request.relationshipTypeKey].compatibility_emotion}

### crisis (위기 & 극복)
${prompts.userPrompts[request.relationshipTypeKey].compatibility_crisis}

응답 형식 (JSON):
{
  "communication": { "headline": "...", "content": "...", "tags": [...] },
  "growth": { "headline": "...", "content": "...", "tags": [...] },
  "emotion": { "headline": "...", "content": "...", "tags": [...] },
  "crisis": { "headline": "...", "content": "...", "tags": [...] }
}`;
  const combinedUserPrompt = `${chartData}

---

${categoriesPrompt}`;

  const { parsed } = await completeWithViolationRetry(
    [
      {
        role: "system",
        content: prompts.systemPrompts[request.relationshipTypeKey],
      },
      { role: "user", content: combinedUserPrompt },
    ],
    {
      language: request.language,
      completion: {
        responseSchema: responseSchemaFor(
          "compatibility_categories_combined",
          request.language
        ),
        maxTokens: LARGE_RESPONSE_MAX_TOKENS,
      },
      validator: validatorOptionsFor("compatibility_categories_combined"),
      label: "compatibility:categories_combined",
    }
  );

  try {
    return CompatibilityCategoriesCombinedResponseSchema.parse(parsed);
  } catch (error) {
    throw new AIError("AI 응답이 예상된 형식과 다릅니다.", {
      code: "RESPONSE_PARSE_FAILED",
      originalError: error as Error,
      requestType: "compatibility_categories_combined",
    });
  }
};

// ============================================================
// 전체 해석 오케스트레이션 (3단계 병렬)
// ============================================================

export const generateCompatibilityInterpretation = async (
  request: Omit<CompatibilityInterpretationRequest, "requestType">
): Promise<CompatibilityResult> => {
  // ──── 성격 앵커 (사전 분석된 프로필 기반, 200자 내외) ────
  const personalityAnchor =
    request.personalityA && request.personalityB
      ? `## 두 사람 성격 요약 (엔진 사전 분석)
- ${request.profileA.name}: ${request.personalityA.coreTraits.slice(0, 3).join(", ")}
- ${request.profileB.name}: ${request.personalityB.coreTraits.slice(0, 3).join(", ")}
이 요약과 어긋나지 않게 쓰되, 성격 소개를 되풀이하지 말고 이 섹션의 질문에 집중해요.`
      : "";

  // ──── Stage 1: overview + insights 병렬 ────
  const [overview, insights] = await Promise.all([
    interpretCompatibilityOverview(request),
    interpretCompatibilityInsights({
      ...request,
      previousContext: personalityAnchor,
    }),
  ]);

  // 방어적 클램핑: overall.score가 scoreRange 범위를 벗어나면 보정
  if (request.scoreRange) {
    insights.overall.score = Math.max(
      request.scoreRange.min,
      Math.min(request.scoreRange.max, insights.overall.score)
    );
  }

  // 카테고리별 점수 클램핑 (사전 분석 점수 제약 적용)
  if (request.analysis?.scoreConstraints) {
    const sc = request.analysis.scoreConstraints;
    const clampScore = (score: number, key: string): number => {
      const constraint = sc[key];
      if (!constraint) return score;
      return Math.max(constraint.min, Math.min(constraint.max, score));
    };

    insights.communication.score = clampScore(
      insights.communication.score,
      "communication"
    );
    insights.growthSynergy.score = clampScore(
      insights.growthSynergy.score,
      "growthSynergy"
    );
    insights.trustIndex.score = clampScore(
      insights.trustIndex.score,
      "trustIndex"
    );
    insights.crisisResilience.score = clampScore(
      insights.crisisResilience.score,
      "crisisResilience"
    );
    insights.chemistry.score = clampScore(
      insights.chemistry.score,
      "chemistry"
    );
  }

  // Stage 1 context (Stage 2 전달용)
  // 신규(subSections+oneLiner)·레거시(spoiler) 모두 안전하게 발췌
  const overviewOpening = extractCompatibilityOpening(
    overview.subSections,
    overview.oneLiner,
    overview.spoiler,
    150
  );
  // 앞 섹션이 쓴 말. 지시문 문체가 출력에 새지 않도록 해요체로 쓴다.
  // (KO 인사이트는 점수·라벨만 생성하므로 요약 섹션의 말만 넘긴다)
  const stage1Context = `${personalityAnchor}

## 앞 섹션에서 이미 쓴 말
- 궁합 headline: "${overview.headline}"
- 궁합 요약 첫 문단: "${overviewOpening}"
이 섹션에서는 위와 같은 문장 구조와 낱말을 피하고, 같은 장면이나 같은 성격 대비를 다시 쓰지 않아요.`;

  // ──── Stage 2: scenarios + categories(4개 통합) 병렬 ────
  const [scenarios, categories] = await Promise.all([
    interpretCompatibilityCoreScenarios({
      ...request,
      previousContext: stage1Context,
    }),
    interpretCompatibilityCategoriesCombined({
      ...request,
      previousContext: stage1Context,
    }),
  ]);

  // ──── 후처리: 줄바꿈 보장 + 잘못된 줄바꿈 정리 ────
  const sanitizedOverview = cleanupAllBrokenLineBreaks(
    ensureAllLineBreaks(overview)
  );
  const sanitizedInsights = cleanupAllBrokenLineBreaks(
    ensureAllLineBreaks(insights)
  );
  const sanitizedScenarios = cleanupAllBrokenLineBreaks(
    ensureAllLineBreaks(scenarios)
  );
  const sanitizedCategories = cleanupAllBrokenLineBreaks(
    ensureAllLineBreaks(categories)
  );

  return {
    score: sanitizedInsights.overall.score,
    subScores: {
      communication: sanitizedInsights.communication.score,
      growthSynergy: sanitizedInsights.growthSynergy.score,
      trustIndex: sanitizedInsights.trustIndex.score,
      crisisResilience: sanitizedInsights.crisisResilience.score,
    },
    charts: {
      profileA: {
        profileId: "",
        name: request.profileA.name,
        chart: {
          wuxingJu: request.chartA.wuxingJu,
          mingGong: request.chartA.mingGongPosition,
          shenGong: request.chartA.shenGongPosition,
          sihua: {
            hualu: request.chartA.sihua.hualu.star,
            huaquan: request.chartA.sihua.huaquan.star,
            huake: request.chartA.sihua.huake.star,
            huaji: request.chartA.sihua.huaji.star,
          },
        },
        rawChart: null as never, // Filled by API route
      },
      profileB: {
        profileId: "",
        name: request.profileB.name,
        chart: {
          wuxingJu: request.chartB.wuxingJu,
          mingGong: request.chartB.mingGongPosition,
          shenGong: request.chartB.shenGongPosition,
          sihua: {
            hualu: request.chartB.sihua.hualu.star,
            huaquan: request.chartB.sihua.huaquan.star,
            huake: request.chartB.sihua.huake.star,
            huaji: request.chartB.sihua.huaji.star,
          },
        },
        rawChart: null as never, // Filled by API route
      },
    },
    interpretation: {
      headline: sanitizedOverview.headline,
      tags: sanitizedOverview.tags,
      insights: sanitizedInsights,
      spoiler: sanitizedOverview.spoiler,
      overviewSubSections: sanitizedOverview.subSections,
      overviewOneLiner: sanitizedOverview.oneLiner,
      coreScenarios: sanitizedScenarios.coreScenarios,
      categories: {
        communication: sanitizedCategories.communication,
        growth: sanitizedCategories.growth,
        emotion: sanitizedCategories.emotion,
        crisis: sanitizedCategories.crisis,
      },
      advice: sanitizedScenarios.advice,
      adviceSubSections: sanitizedScenarios.adviceSubSections,
      adviceOneLiner: sanitizedScenarios.adviceOneLiner,
      meta: {
        generatedAt: new Date().toISOString(),
        model: CURRENT_MODEL_NAME,
        isFallback: false,
      },
    },
  };
};

// ============================================================
// 폴백 응답 생성
// ============================================================

export const createCompatibilityFallbackResult = (
  error: Error
): CompatibilityResult => {
  const isRateLimited =
    error instanceof AIError && error.code === "RATE_LIMITED";
  const fallbackMessage = isRateLimited
    ? "현재 많은 분들이 이용 중입니다. 잠시 후 다시 시도해주세요."
    : "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";

  const emptyInsight = {
    score: 0,
    label: "",
    headline: "",
    content: fallbackMessage,
  };
  const emptyCategory = { headline: "", content: fallbackMessage, tags: [] };

  return {
    score: 0,
    subScores: {
      communication: 0,
      growthSynergy: 0,
      trustIndex: 0,
      crisisResilience: 0,
    },
    charts: {
      profileA: {
        profileId: "",
        name: "",
        chart: {
          wuxingJu: "",
          mingGong: "",
          shenGong: "",
          sihua: { hualu: "", huaquan: "", huake: "", huaji: "" },
        },
        rawChart: null as never,
      },
      profileB: {
        profileId: "",
        name: "",
        chart: {
          wuxingJu: "",
          mingGong: "",
          shenGong: "",
          sihua: { hualu: "", huaquan: "", huake: "", huaji: "" },
        },
        rawChart: null as never,
      },
    },
    interpretation: {
      headline: "🔮 궁합 분석 준비 중",
      tags: [],
      insights: {
        overall: emptyInsight,
        zodiac: emptyInsight,
        fiveElement: emptyInsight,
        chemistry: emptyInsight,
        communication: emptyInsight,
        growthSynergy: emptyInsight,
        trustIndex: emptyInsight,
        crisisResilience: emptyInsight,
      },
      spoiler: fallbackMessage,
      coreScenarios: [],
      categories: {
        communication: emptyCategory,
        growth: emptyCategory,
        emotion: emptyCategory,
        crisis: emptyCategory,
      },
      advice: "",
      meta: {
        generatedAt: new Date().toISOString(),
        model: CURRENT_MODEL_NAME,
        isFallback: true,
      },
    },
  };
};
