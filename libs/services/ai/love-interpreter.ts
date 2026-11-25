import { calculateDayun } from "@/libs/zi-wei-dou-shu/calculators/dayun";
import { buildLoveFactSheet } from "@/libs/zi-wei-dou-shu/calculators/love-fortune-facts";
import type { LoveFactSheet } from "@/libs/zi-wei-dou-shu/calculators/love-fortune-facts";
import type { ZiweiChart } from "@/libs/zi-wei-dou-shu/types";

import {
  formatConflictKo,
  formatGuestKo,
  formatPartnerKo,
  formatPeachKo,
  formatPrescriptionKo,
  formatPreviewKo,
  formatSeasonsKo,
  formatSkinshipKo,
  formatSomeKo,
} from "./love-fact-format";
import type { LoveGuest } from "./love-fact-format";
import type { OutputValidatorOptions } from "./output-validator";
import { LOVE_SYSTEM_PROMPT_KO, LOVE_USER_PROMPTS_KO } from "./prompts/love-ko";
import type { LoveSectionKey } from "./prompts/love-ko";
import { chatCompletion, parseJsonResponse } from "./provider";
import type {
  GeminiMessage,
  GeminiResponseSchema,
  GeminiSchemaProperty,
} from "./types";
import { completeWithViolationRetry, withJudgment } from "./violation-retry";

// ============================================================
// 연애 운세 (KO). 1단계 = 무료 예고편, 2단계 = 본편 7섹션 병렬,
// 3단계 = 섹션 사이 반복 검사 → 겹친 섹션만 1회 재생성.
// 숫자·라벨·칸 이름·사람 이름·연도는 엔진이 정하고 LLM은 설명만 쓴다.
// ============================================================

const STRING: GeminiSchemaProperty = { type: "string" };

const objectOf = (
  properties: Record<string, GeminiSchemaProperty>
): GeminiSchemaProperty => ({
  type: "object",
  properties,
  required: Object.keys(properties),
});

const arrayOf = (
  item: Record<string, GeminiSchemaProperty>,
  count: number
): GeminiSchemaProperty => ({
  type: "array",
  items: objectOf(item),
  minItems: count,
  maxItems: count,
});

const SUB_SECTION = { heading: STRING, body: STRING };

/** judgment → 본문 → 제목 순서 (속성 순서 = 생성 순서) */
const section = (
  body: Record<string, GeminiSchemaProperty>
): GeminiResponseSchema =>
  withJudgment({
    type: "object",
    properties: { ...body, headline: STRING },
    required: [...Object.keys(body), "headline"],
  });

const schemaFor = (
  key: LoveSectionKey,
  sheet: LoveFactSheet
): GeminiResponseSchema => {
  switch (key) {
    case "love_preview":
      return section({ subSections: arrayOf(SUB_SECTION, 2) });
    case "love_some":
      return section({
        steps: arrayOf(
          { stage: STRING, scene: STRING, partnerVoice: STRING },
          3
        ),
        oneLiner: STRING,
      });
    case "love_skinship":
      return section({
        steps: arrayOf({ moment: STRING, timing: STRING, scene: STRING }, 3),
        expressionStyle: STRING,
        antidote: STRING,
      });
    case "love_conflict":
      return section({
        subSections: arrayOf(SUB_SECTION, 2),
        antidote: STRING,
      });
    case "love_partner": {
      const person = objectOf({ scene: STRING, voice: STRING });
      return section({
        ...(sheet.attract ? { attract: person } : {}),
        ...(sheet.lasting ? { lasting: person } : {}),
      });
    }
    case "love_peach":
      return section({ lasting: STRING, short: STRING });
    case "love_seasons":
      return section({
        ...(sheet.seasons.length
          ? {
              seasons: arrayOf(
                {
                  year: { type: "integer" },
                  title: STRING,
                  body: STRING,
                  todo: STRING,
                },
                sheet.seasons.length
              ),
            }
          : {}),
        ...(sheet.restSeason
          ? {
              rest: objectOf({
                year: { type: "integer" },
                title: STRING,
                body: STRING,
              }),
            }
          : {}),
      });
    case "love_prescription":
      return section({
        actions: arrayOf({ title: STRING, scene: STRING }, 3),
        closing: STRING,
      });
  }
};

/** 섹션마다 그 섹션 재료만 넘긴다 */
const dataFor = (
  key: LoveSectionKey,
  sheet: LoveFactSheet,
  guest: LoveGuest
): string => {
  switch (key) {
    case "love_preview":
      return formatPreviewKo(sheet);
    case "love_some":
      return formatSomeKo(sheet);
    case "love_skinship":
      return formatSkinshipKo(sheet);
    case "love_conflict":
      return formatConflictKo(sheet);
    case "love_partner":
      return formatPartnerKo(sheet);
    case "love_peach":
      return formatPeachKo(sheet);
    case "love_seasons":
      return formatSeasonsKo(sheet);
    case "love_prescription":
      return formatPrescriptionKo(sheet, guest);
  }
};

/** 손님 정보 옮겨 적기 검사. 직업은 프롬프트에 넘기지 않지만 모델이 지어낼 수 있어 같이 잡는다 */
const GUEST_ECHO =
  /((?:대학생|학생|직장인|취준생|프리랜서)(?:이라서|이라|인 |이면|이니까|으로서)|만 ?\d+세|\d+세(?:인|로|라|가|에))/g;
/**
 * 직업을 가정한 말. 직업은 입력받지 않으므로 출퇴근·학교 생활을 전제한 장면은 다 추측이다.
 * 고정 평가 세트(명반 6개)에서 계획 단계 없이 돌리면 회차마다 "퇴근하고 집에 와서"가 5~6곳 나왔다.
 */
const JOB_ASSUMPTION =
  /(퇴근|출근|회식|야근|사무실|직장|회사|강의실|캠퍼스|수업|학교|동아리)/g;
const READER_AS_GUEST =
  /손님(?=[은이의도께에한]|\s|쪽)|당신(?=[은이의도께에한을]|\s)/g;

export const loveValidatorFor = (): OutputValidatorOptions => {
  return {
    // 캐릭터 이름이 "~사람"으로 끝나 판정 맺음 횟수 기준을 한 번 늘린다
    maxJudgmentEndings: 3,
    extraRules: [
      { code: "THIRD_PERSON", pattern: READER_AS_GUEST },
      { code: "CONTEXT_MISMATCH", pattern: GUEST_ECHO },
      { code: "CONTEXT_MISMATCH", pattern: JOB_ASSUMPTION },
    ],
  };
};

interface SectionResult {
  parsed: Record<string, unknown>;
  messages: GeminiMessage[];
  response: string;
}

const runSection = async (
  key: LoveSectionKey,
  sheet: LoveFactSheet,
  guest: LoveGuest,
  messages: GeminiMessage[]
): Promise<SectionResult> => {
  const { parsed, response } = await completeWithViolationRetry<
    Record<string, unknown>
  >(messages, {
    language: "ko",
    completion: { responseSchema: schemaFor(key, sheet) },
    validator: loveValidatorFor(),
    label: `love:${key}`,
  });
  return { parsed, messages, response };
};

const requestSection = (
  key: LoveSectionKey,
  sheet: LoveFactSheet,
  guest: LoveGuest,
  avoid?: string
): Promise<SectionResult> => {
  const user = [
    formatGuestKo(guest),
    dataFor(key, sheet, guest),
    ...(avoid ? [avoid] : []),
    "---",
    LOVE_USER_PROMPTS_KO[key],
  ].join("\n\n");
  return runSection(key, sheet, guest, [
    { role: "system", content: LOVE_SYSTEM_PROMPT_KO },
    { role: "user", content: user },
  ]);
};

// ------------------------------------------------------------
// 섹션 사이 반복 검사. 섹션을 병렬로 만들어 서로를 못 보니, 다 만든 뒤
// 어절 3개짜리 구절이 앞 섹션과 겹치면 그 섹션만 다시 쓰게 한다.
// ------------------------------------------------------------

const collectText = (value: unknown, skip: ReadonlySet<string>): string[] => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap((v) => collectText(v, skip));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) =>
      skip.has(k) ? [] : collectText(v, skip)
    );
  }
  return [];
};

/** 숫자·연도처럼 엔진이 정해 겹쳐도 되는 칸은 빼고 본다 */
const SKIP_KEYS = new Set(["year", "timing", "moment", "stage"]);

const phrasesOf = (parsed: unknown): Set<string> => {
  const out = new Set<string>();
  for (const text of collectText(parsed, SKIP_KEYS)) {
    const words = text
      .replace(/["“”'‘’.,!?…()]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
    for (let i = 0; i + 3 <= words.length; i += 1) {
      const phrase = words.slice(i, i + 3).join(" ");
      // "수 있어요" 같은 짧은 말끝 조합은 어디에나 나와서 뺀다
      if (phrase.replace(/\s/g, "").length >= 9) out.add(phrase);
    }
  }
  return out;
};

/** 엔진이 정해 섹션마다 써도 되는 말 (캐릭터·칸·사람 이름) */
const allowedPhrases = (sheet: LoveFactSheet): string[] =>
  [
    sheet.label,
    sheet.quadrant.name,
    sheet.attract?.title,
    sheet.lasting?.title,
    sheet.conflict.label,
  ].filter((t): t is string => !!t);

const findRepeats = (
  order: LoveSectionKey[],
  results: Partial<Record<LoveSectionKey, Record<string, unknown>>>,
  sheet: LoveFactSheet
): Partial<Record<LoveSectionKey, string[]>> => {
  const allowed = allowedPhrases(sheet);
  const seen = new Set<string>();
  const repeats: Partial<Record<LoveSectionKey, string[]>> = {};
  for (const key of order) {
    const phrases = phrasesOf(results[key]);
    const hits = [...phrases].filter(
      (p) => seen.has(p) && !allowed.some((a) => a.includes(p))
    );
    if (hits.length > 0) repeats[key] = hits;
    phrases.forEach((p) => seen.add(p));
  }
  return repeats;
};

const repeatFeedback = (phrases: string[]): string =>
  `방금 답에 다른 섹션에서 이미 쓴 구절이 있어요: ${phrases
    .slice(0, 8)
    .map((p) => `"${p}"`)
    .join(
      ", "
    )}. 섹션을 이어서 읽기 때문에 같은 말이 다시 나오면 되풀이로 읽혀요. 그 구절 자리에 이 섹션 재료로 만든 새 장면과 새 말을 써 주세요. 같은 JSON 형식은 그대로 두고 다시 써 주세요.`;

// ------------------------------------------------------------
// 일반 독자 판정. 인생 운세 품질 측정(docs/lifetime-fortune-quality-2026-11.md §14)에서
// 쓴 "자미두수를 모르는 20~30대 독자" 판정. 측정 스크립트에서 버전 비교용으로 쓴다.
// 판정 모델이 생성 모델과 같아 수치는 방향 참고치다.
// ------------------------------------------------------------

/** 화면에 나오지 않거나 엔진이 정한 칸은 판정하지 않는다 */
const READER_SKIP = new Set([...SKIP_KEYS, "judgment"]);

const SECTION_NAME: Record<LoveSectionKey, string> = {
  love_preview: "연애 캐릭터",
  love_some: "썸",
  love_skinship: "스킨십 진도표",
  love_conflict: "싸울 때",
  love_partner: "끌리는 사람과 오래 가는 사람",
  love_peach: "설렘이 들어오는 방식",
  love_seasons: "인연 시즌",
  love_prescription: "연애 처방",
};

const FIELD_LABEL: Record<string, string> = {
  headline: "섹션 제목",
  heading: "소제목",
  title: "이름",
  partnerVoice: "상대 대사",
  voice: "그 사람 대사",
  oneLiner: "마무리 한 줄",
  closing: "마무리 한 줄",
  antidote: "해독제",
  todo: "해 볼 일",
};

/** 제목·이름·대사는 통째로, 본문은 문장으로 나눈다 */
const WHOLE_FIELDS = new Set([
  "headline",
  "heading",
  "title",
  "partnerVoice",
  "voice",
]);

interface ReaderEntry {
  id: number;
  section: LoveSectionKey;
  label: string;
  text: string;
}

export interface ReaderFlag {
  section: LoveSectionKey;
  text: string;
  verdict: string;
  reason: string;
}

const collectLabeled = (
  value: unknown,
  key: string,
  out: { label: string; text: string; key: string }[]
): void => {
  if (READER_SKIP.has(key)) return;
  if (typeof value === "string") {
    const label = FIELD_LABEL[key] ?? "본문";
    const texts = WHOLE_FIELDS.has(key)
      ? [value.trim()]
      : value
          .split(/(?<=[.!?])\s+/)
          .map((t) => t.trim())
          .filter(Boolean);
    texts.forEach((text) => out.push({ label, text, key }));
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v) => collectLabeled(v, key, out));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([k, v]) => collectLabeled(v, k, out));
  }
};

const READER_SYSTEM = `자미두수를 전혀 모르는 20~30대 독자가 휴대폰으로 연애 운세를 위에서부터 한 번 읽는다고 생각하고 판정해요. 항목은 화면에 나오는 순서이고, 제목·소제목·대사는 바로 앞뒤 본문과 같이 읽어요.
- clear: 앞뒤와 같이 읽으면 어떤 상황에서 무슨 일이 생기는지 바로 알아요. 제목이 짧아 결론을 다 말하지 않아도, 본문과 이어지면 clear예요.
- vague: 앞뒤와 같이 읽어도 비유, 새로 지은 말, 두 가지를 한 문장에 맞붙인 말, 빠진 목적어 때문에 무슨 뜻인지 바로 안 잡혀요.
- no_context: 앞뒤와 같이 읽어도 왜 이 말이 나오는지 몰라요.
clear가 아닌 항목만 flags에 넣고, reason에 어느 말이 왜 안 통하는지 한 문장으로 써요. 다 clear면 flags는 빈 배열이에요.`;

const READER_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    flags: {
      type: "array",
      items: objectOf({
        id: { type: "integer" },
        verdict: { type: "string", enum: ["vague", "no_context"] },
        reason: STRING,
      }),
    },
  },
  required: ["flags"],
};

export const judgeLoveReadability = async (
  results: Partial<Record<LoveSectionKey, Record<string, unknown>>>
): Promise<ReaderFlag[]> => {
  const entries: ReaderEntry[] = [];
  const blocks: string[] = [];
  for (const [section, parsed] of Object.entries(results)) {
    const key = section as LoveSectionKey;
    const items: { label: string; text: string; key: string }[] = [];
    collectLabeled(parsed, "", items);
    // 화면에서는 섹션 제목이 맨 위에 온다 (생성 순서는 맨 끝)
    items.sort(
      (x, y) => Number(y.key === "headline") - Number(x.key === "headline")
    );
    const lines = items.map((item) => {
      const entry = { id: entries.length + 1, section: key, ...item };
      entries.push(entry);
      return `[${entry.id}] (${item.label}) ${item.text}`;
    });
    blocks.push(`## ${SECTION_NAME[key]}\n${lines.join("\n")}`);
  }
  const response = await chatCompletion(
    [
      { role: "system", content: READER_SYSTEM },
      { role: "user", content: blocks.join("\n\n") },
    ],
    { responseSchema: READER_SCHEMA }
  );
  const { flags = [] } = parseJsonResponse<{
    flags?: { id: number; verdict: string; reason: string }[];
  }>(response);
  return flags.flatMap((f) => {
    const entry = entries.find((e) => e.id === f.id);
    return entry
      ? [
          {
            section: entry.section,
            text: entry.text,
            verdict: f.verdict,
            reason: f.reason,
          },
        ]
      : [];
  });
};

const MAIN_SECTIONS: LoveSectionKey[] = [
  "love_some",
  "love_skinship",
  "love_conflict",
  "love_partner",
  "love_peach",
  "love_seasons",
  "love_prescription",
];

const ORDER: LoveSectionKey[] = ["love_preview", ...MAIN_SECTIONS];

export interface LoveInterpretation {
  sheet: LoveFactSheet;
  preview: Record<string, unknown>;
  sections: Partial<Record<LoveSectionKey, Record<string, unknown>>>;
  /** 섹션 사이 반복 검사: 첫 생성에서 걸린 구절, 재생성 뒤 남은 구절 */
  repeats: {
    first: Partial<Record<LoveSectionKey, string[]>>;
    remaining: Partial<Record<LoveSectionKey, string[]>>;
  };
}

export const generateLoveInterpretation = async (
  chart: ZiweiChart,
  guest: LoveGuest
): Promise<LoveInterpretation> => {
  const birthYear = Number(chart.input.birthDate.slice(0, 4));
  const sheet = buildLoveFactSheet(chart, {
    birthYear,
    currentYear: guest.currentYear,
    dayun: calculateDayun(chart),
  });

  const preview = await requestSection("love_preview", sheet, guest);
  // 예고편 판정은 이어 쓰라고 넘기면 그대로 복사됐다(1회차). 되풀이하지 말 문장으로만 넘긴다.
  const avoid = `## 예고편에서 이미 한 말 (이 문장은 되풀이하지 않아요)\n- ${String(preview.parsed.judgment ?? "")}`;

  const mains = await Promise.all(
    MAIN_SECTIONS.map((key) => requestSection(key, sheet, guest, avoid))
  );
  const byKey: Partial<Record<LoveSectionKey, SectionResult>> = {
    love_preview: preview,
    ...Object.fromEntries(MAIN_SECTIONS.map((key, i) => [key, mains[i]])),
  };
  const parsedOf = () =>
    Object.fromEntries(
      ORDER.map((key) => [key, byKey[key]?.parsed])
    ) as Partial<Record<LoveSectionKey, Record<string, unknown>>>;

  // 섹션 사이 반복(코드 검사)에 걸린 섹션만 한 번 다시 쓴다.
  // 독자 판정은 생성 단계에 넣지 않는다: 판정 모델이 생성 모델과 같고, 4회차 실측에서
  // 재생성 뒤 걸린 문장이 4 → 6으로 줄지 않았다. 측정용으로만 쓴다(judgeLoveReadability).
  const first = findRepeats(ORDER, parsedOf(), sheet);
  const feedbackFor = (key: LoveSectionKey): string | undefined =>
    first[key] ? repeatFeedback(first[key] ?? []) : undefined;
  const retryKeys = ORDER.filter((key) => feedbackFor(key));
  const retried = await Promise.all(
    retryKeys.map((key) => {
      const prev = byKey[key];
      if (!prev) return Promise.resolve(undefined);
      return runSection(key, sheet, guest, [
        ...prev.messages,
        { role: "assistant", content: prev.response },
        { role: "user", content: feedbackFor(key) ?? "" },
      ]);
    })
  );
  retryKeys.forEach((key, i) => {
    const result = retried[i];
    if (result) byKey[key] = result;
  });
  const remaining = findRepeats(ORDER, parsedOf(), sheet);

  const final = parsedOf();
  return {
    sheet,
    preview: final.love_preview ?? {},
    sections: Object.fromEntries(
      MAIN_SECTIONS.map((key) => [key, final[key]])
    ) as LoveInterpretation["sections"],
    repeats: { first, remaining },
  };
};
