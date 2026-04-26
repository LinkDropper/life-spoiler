import { env } from "@/env";

import {
  INTEREST_AREAS_SCHEMA,
  INTEREST_AREAS_USER_PROMPT,
  REGION_SCORES_SCHEMA,
  REGION_SCORES_USER_PROMPT,
  SIGNATURE_OVERALL_SCHEMA,
  SIGNATURE_OVERALL_USER_PROMPT,
  buildInterestAreasSystemPrompt,
  buildRegionScoresSystemPrompt,
  buildSignatureOverallSystemPrompt,
} from "./prompts/text-report.v3";
import type {
  InterestAreasResponse,
  RegionScoresResponse,
  SignatureOverallResponse,
} from "./prompts/text-report.v3";
import type { RegionRawScore } from "./region-scorer";
import type { AnimalMatch } from "./types";
import type { FaceTextReportV3 } from "./types.v3";

// ============================================================
// v3 텍스트 리포트 — 3단계 Gemini 파이프라인
//
// Stage A: signature + overallScore
// Stage B: regionScores (8개 부위)
// Stage C: interestAreas + closing
//
// 각 단계는 독립 호출 — 한 단계 실패 시 해당 단계만 재시도.
// 사진은 3번 모두 전달.
// ============================================================

/**
 * Phase 13(2026-04-21): `gemini-2.5-flash-lite` → `gemini-2.5-flash` 상향.
 * - flash-lite의 지시 준수율 한계로 Soft validator 재시도가 잦아 전체 지연이 컸음.
 * - flash는 2~3배 정확도로 첫 시도 성공률이 크게 상승 → 총 호출 횟수 감소 → 전체 지연 단축.
 * - 비용은 4배지만 재시도 감소로 실효 증가는 약 2~2.5배. 월 매출 대비 무시 가능.
 */
const FACE_GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 60_000;

/**
 * Phase 13: Hard/Soft validator 재시도 횟수를 분리.
 * - HARD: 레이아웃 필수 제약 (배열 개수·도메인 순서 등) — 3회 재시도 유지
 * - SOFT: 품질 개선 목적 (시간 은유·A보다 B 패턴 등) — 1회만 재시도
 *   - 1회 교정 시도에도 실패하면 LLM이 구조적으로 해당 편향을 못 고치는 것으로 간주
 *   - 2회 이상 반복은 지연 비율 대비 품질 개선이 미미
 */
const MAX_HARD_RETRIES = 3;
const MAX_SOFT_RETRIES = 1;

/** 루프 상한은 Hard 기준(더 큼). Soft는 내부 조건으로 제한. */
const MAX_RETRIES = MAX_HARD_RETRIES;

interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiRequest {
  contents: GeminiContent[];
  systemInstruction?: {
    parts: GeminiPart[];
  };
  generationConfig?: {
    responseMimeType?: string;
    responseSchema?: unknown;
    temperature?: number;
    maxOutputTokens?: number;
  };
}

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
    finishReason?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
}

const fetchWithTimeout = async (
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

interface CallStageOptions<T> {
  imageBase64: string;
  mimeType: string;
  systemPrompt: string;
  userPrompt: string;
  responseSchema: unknown;
  stageName: string;
  /** Stage B처럼 분량이 큰 경우 토큰 상한 증설 */
  maxOutputTokens?: number;
  /**
   * Phase 12: 응답 수령 후 품질 검증. 실패 시 throw된 에러 메시지를
   * 재시도 시 프롬프트에 feedback으로 주입해 LLM이 교정하도록 유도.
   */
  validator?: (resp: T) => void;
}

/**
 * 재시도 시 system prompt 하단에 붙는 feedback 블록.
 * 직전 validator 실패 메시지를 LLM에게 전달해 같은 실수를 반복하지 않도록 한다.
 */
const buildRetryFeedback = (previousError: string, attempt: number): string => `

---

## ⚠️ 이전 응답 검증 실패 (재시도 ${attempt}회차)

직전 응답이 품질 검증에서 다음 이유로 실패했습니다:

> ${previousError}

이번 재시도에서는 **반드시** 위 문제를 교정해서 응답하세요. 구체적으로:
- 문제가 "A보다 B 패턴 과다"라면 → 부위별 패턴 할당표를 엄격히 지켜 다른 문법 구조를 사용하세요.
- 문제가 "시간·축적 은유 과다"라면 → "시간이 갈수록", "쌓아가는", "차곡차곡", "가까워질수록", "함께할수록" 등의 표현을 제거하고 대안 은유(무게·온기·속도·빛·공간·리듬·깊이)로 교체하세요.
- 문제가 "반대 결 축 부족"이라면 → highlights에 활동성(추진력/실행력), 유머(위트/여유), 감수성(섬세함/공감), 순발력(눈치/재치), 호기심(탐구심), 표현력(전달력) 중 최소 2개를 반드시 포함하세요.
- 문제가 "과거 수렴 어휘 과다"라면 → "신중함·안정감·꾸준함·신뢰감·후반상승·성실함·차분함" 중 최대 1개만 사용하고 나머지는 새 어휘로 교체하세요.
- 문제가 "긴 구문 반복"이라면 → 동일한 긴 구문을 여러 문장에 재사용하지 말고 각 문장을 서로 다른 어휘·구조로 작성하세요.

위 교정 사항을 반영한 JSON만 출력하세요.`;

const callStage = async <T>({
  imageBase64,
  mimeType,
  systemPrompt,
  userPrompt,
  responseSchema,
  stageName,
  maxOutputTokens,
  validator,
}: CallStageOptions<T>): Promise<T> => {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API 키가 설정되지 않았습니다.");
  }

  const url = `${GEMINI_API_BASE}/${FACE_GEMINI_MODEL}:generateContent`;

  let lastError: Error | null = null;
  /** 직전 validator 실패 메시지. 재시도 프롬프트에 주입. */
  let previousValidationError: string | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // 재시도일 경우 system prompt에 feedback 추가
    const systemPromptForAttempt =
      attempt > 0 && previousValidationError
        ? systemPrompt + buildRetryFeedback(previousValidationError, attempt)
        : systemPrompt;

    const request: GeminiRequest = {
      contents: [
        {
          role: "user",
          parts: [
            { text: userPrompt },
            { inlineData: { mimeType, data: imageBase64 } },
          ],
        },
      ],
      systemInstruction: { parts: [{ text: systemPromptForAttempt }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.85,
        maxOutputTokens: maxOutputTokens ?? 4096,
      },
    };

    try {
      const response = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify(request),
        },
        REQUEST_TIMEOUT_MS
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Gemini API 요청 실패 [${stageName}] (${response.status}): ${errorText}`
        );
      }

      const data: GeminiResponse = await response.json();

      if (data.promptFeedback?.blockReason) {
        throw new Error(
          `콘텐츠가 차단되었습니다 [${stageName}]: ${data.promptFeedback.blockReason}`
        );
      }

      const candidate = data.candidates?.[0];
      const text = candidate?.content.parts.map((p) => p.text).join("");

      if (!text) {
        throw new Error(`Gemini 응답이 비어있습니다 [${stageName}].`);
      }

      // Phase 13: finishReason=MAX_TOKENS 면 JSON이 중간에 잘린 상태.
      // flash 모델로 상향하면서 응답이 lite 대비 길어져 token 상한에 걸리는 경우가 잦음.
      // 명시적으로 감지해 재시도 트리거 + 원인 로그 확보.
      if (candidate?.finishReason === "MAX_TOKENS") {
        throw new Error(
          `Gemini 응답이 토큰 상한에 도달해 잘렸습니다 [${stageName}]. maxOutputTokens 증설 필요.`
        );
      }

      let parsed: T;
      try {
        parsed = JSON.parse(text) as T;
      } catch (parseError) {
        const snippet = text.slice(0, 200).replace(/\n/g, "\\n");
        throw new Error(
          `Gemini 응답 JSON 파싱 실패 [${stageName}] (finishReason=${candidate?.finishReason ?? "unknown"}, length=${text.length}): ${(parseError as Error).message}. 응답 앞부분: ${snippet}...`
        );
      }

      // Phase 12/13: 품질 validator 실행.
      // - "[v3 검증 실패] Soft:" prefix가 있는 에러는 품질용 → 마지막 시도에서는 경고만 남기고 통과.
      //   이전 시도에서는 feedback 주입해 재시도 유도.
      // - 그 외 [v3 검증 실패] 는 hard 실패 → 최종 시도까지 실패하면 throw.
      if (validator) {
        try {
          validator(parsed);
        } catch (validationError) {
          const message =
            validationError instanceof Error
              ? validationError.message
              : String(validationError);
          const isSoft = message.includes("[v3 검증 실패] Soft:");
          previousValidationError = message;
          lastError = validationError as Error;

          // Soft는 1회, Hard는 MAX_RETRIES(3)회까지 재시도.
          const retryLimit = isSoft ? MAX_SOFT_RETRIES : MAX_HARD_RETRIES;
          if (attempt < retryLimit) {
            console.warn(
              `[face-spoiler v3] Stage ${stageName} validator ${isSoft ? "soft" : "hard"} 실패 (attempt ${attempt + 1}/${retryLimit + 1}): ${message}`
            );
            await sleep(500 * (attempt + 1));
            continue;
          }

          // 마지막 시도. soft 실패는 경고만 남기고 통과, hard 실패는 throw.
          if (isSoft) {
            console.warn(
              `[face-spoiler v3] Stage ${stageName} soft validator 최종 실패 — 경고만 남기고 결과 통과: ${message}`
            );
            return parsed;
          }
          throw validationError;
        }
      }

      return parsed;
    } catch (error) {
      // Network·parse·API 실패 (validator 실패는 위에서 이미 처리)
      const isValidationError =
        error instanceof Error && error.message.includes("[v3 검증 실패]");
      if (!isValidationError) {
        previousValidationError = null;
      }
      lastError = error as Error;
      if (attempt < MAX_RETRIES) {
        await sleep(500 * (attempt + 1));
        continue;
      }
    }
  }

  throw (
    lastError ??
    new Error(`Gemini v3 파이프라인 [${stageName}] 알 수 없는 오류.`)
  );
};

// ============================================================
// 사후 검증 — UI 레이아웃이 실제로 깨지는 제약만 유지.
//
// 정책 (2026-04-20 2차 조정):
// - 글자 수 검증은 전면 제거. 프롬프트가 톤·분량을 유도하되 validator는
//   강제하지 않는다. Gemini 응답이 안정적으로 글자 수를 지키지 않아 반복
//   실패가 발생했고, UI는 pre-wrap·반응형 CSS로 다양한 길이를 수용 가능.
// - 배열 개수·순서는 **유지**: 8개 부위, 3개 분야, bullets 3개 등은 UI가
//   레이아웃을 전제로 설계돼 있어 개수가 어긋나면 실제로 렌더 깨짐.
// - domain enum 순서(`love → money → career`)도 유지: interestAreas의 순서가
//   컴포넌트 렌더 순서와 직결.
// ============================================================

const ensureArrayLength = <T>(
  arr: T[],
  min: number,
  max: number,
  label: string
): void => {
  if (arr.length < min || arr.length > max) {
    throw new Error(
      `[v3 검증 실패] ${label}: 개수 ${arr.length} (허용 ${min}~${max})`
    );
  }
};

// ============================================================
// 시간·축적 은유 검출 (Phase 10 + 11)
// Phase 11: 검사 범위를 nicknameSubtext + finalNote 에서
// oneLineVerdict, oneLineDefinition, body 까지 확장. 상한도 2 -> 3.
// ============================================================

const TIME_ACCUMULATION_PATTERNS: readonly RegExp[] = [
  /시간이\s*갈수록/,
  /시간이\s*지날수록/,
  /시간\s*속에서/,
  /세월이\s*흐를수록/,
  /오래\s*볼수록/,
  /함께하는\s*시간/,
  /관계가\s*깊어질수록/,
  /볼수록\s*(진가|깊어|드러)/,
  /차곡차곡/,
  /한\s*푼\s*두\s*푼/,
  /쌓여가/,
  /쌓아가/,
  /쌓아\s*올리/,
  // Phase 11 추가 패턴
  /가까워질수록/,
  /함께할수록/,
  /알수록\s*(진가|깊어|드러)/,
] as const;

const countTimeAccumulation = (text: string): number =>
  TIME_ACCUMULATION_PATTERNS.reduce(
    (acc, pattern) => acc + (pattern.test(text) ? 1 : 0),
    0
  );

/**
 * Phase 11: 확장 범위(13개 문장)에 맞춘 상한.
 * Phase 12 조정(2026-04-21): 3 -> 6. LLM이 "신뢰형 안정 타입"을 묘사할 때
 * 시간·축적 은유가 자연스럽게 많이 등장하는 경향이 강해, 재시도 3회로도
 * 통과 못해 사용자가 에러로 차단되는 사례 발생. 극단적 반복만 차단하도록 완화.
 */
export const TIME_ACCUMULATION_LIMIT = 6;

// ============================================================
// Phase 11 — highlights 반대 결 축 검증
// result6에서 LLM이 highlights 8개 중 반대 결 1개만 포함한 규칙 위반 사례 대응.
// ============================================================

/** 주류 축("신중·안정·꾸준")에서 벗어난 반대 결 키워드 사전. */
const REVERSE_AXIS_KEYWORDS: readonly string[] = [
  // 활동성
  "추진력",
  "실행력",
  "속도감",
  "행동력",
  "에너지",
  "돌파력",
  "기동력",
  // 유머
  "위트",
  "유머",
  "여유",
  "가벼움",
  "유쾌",
  "밝음",
  "엉뚱",
  // 감수성
  "섬세",
  "공감",
  "감성",
  "정서",
  "감수성",
  // 순발력
  "눈치",
  "재치",
  "순발력",
  "민첩",
  "기지",
  // 호기심
  "탐구",
  "학습욕",
  "호기심",
  "실험",
  // 표현력
  "표현력",
  "전달력",
  "캐릭터",
  "언변",
  "발상",
  // 적극성·카리스마
  "추진",
  "주도",
  "카리스마",
];

const REVERSE_AXIS_MIN = 2;

const countReverseAxisHighlights = (
  highlights: Array<{ title: string; body: string }>
): number => {
  let count = 0;
  highlights.forEach((h) => {
    const combined = `${h.title} ${h.body}`;
    if (REVERSE_AXIS_KEYWORDS.some((kw) => combined.includes(kw))) {
      count += 1;
    }
  });
  return count;
};

// ============================================================
// Phase 11 — coreKeywords 과거 수렴 어휘 제한
// ============================================================

const LEGACY_CONVERGED_KEYWORDS: readonly string[] = [
  "신중함",
  "안정감",
  "꾸준함",
  "신뢰감",
  "후반상승",
  "성실함",
  "차분함",
];

const LEGACY_KEYWORD_MAX = 1;

const countLegacyKeywords = (keywords: string[]): number =>
  keywords.reduce(
    (acc, kw) =>
      acc +
      (LEGACY_CONVERGED_KEYWORDS.some(
        (legacy) => kw === legacy || kw.includes(legacy) || legacy.includes(kw)
      )
        ? 1
        : 0),
    0
  );

// ============================================================
// Phase 11 — oneLiner "A보다 B" 패턴 상한
// ============================================================

const A_BODA_B_PATTERN = /보다,?\s/;
const A_BODA_B_LIMIT = 3;

const countABodaB = (regions: Array<{ oneLiner: string }>): number =>
  regions.reduce(
    (acc, r) => acc + (A_BODA_B_PATTERN.test(r.oneLiner) ? 1 : 0),
    0
  );

// ============================================================
// Phase 11 — 긴 구문 중복 검증 (nicknameSubtext + finalNote)
// "함께하는 시간을 통해 진가를 발휘" 같은 복붙을 검출.
// ============================================================

// Phase 13: 6자 → 8자로 완화. 한국어 2단어 수준까지는 자연스러운 반복 허용.
const SHARED_PHRASE_MIN_LEN = 8;
const SHARED_PHRASE_MAX_LEN = 14;

const findSharedPhrase = (texts: string[]): string | null => {
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i];
      const b = texts[j];
      const maxLen = Math.min(SHARED_PHRASE_MAX_LEN, a.length);
      for (let len = maxLen; len >= SHARED_PHRASE_MIN_LEN; len--) {
        for (let start = 0; start + len <= a.length; start++) {
          const sub = a.substring(start, start + len);
          if (!/[가-힣]/.test(sub)) continue;
          if (b.includes(sub)) {
            return sub;
          }
        }
      }
    }
  }
  return null;
};

// ============================================================
// Phase 16 (2026-04-22) — 수렴 어휘 블랙리스트 (Option II)
// 5명 결과가 "묵직/안정적/조화롭게/꾸준/포용"으로 계속 수렴하는 문제.
// 섹션별 전체 텍스트에서 각 어휘가 3회를 넘으면 Soft 재시도 유도.
// ============================================================

// Phase 17 (2026-04-22): 블랙리스트 대폭 확장.
// result-report4.md 분석 결과 "안정/조화/부드럽/통찰/차분/또렷/꾸준/신중/관찰력/판단력"
// 계열 어휘가 3명 총 40회 이상 등장. Gemini의 관상학 학습 편향이 원인.
//
// Phase 17.5 (2026-04-22): 2차 확장.
// result-report5.md에서 Gemini가 블랙리스트를 회피하되 같은 의미 축의 유의어로
// 도피("판단력/분석/명석/사려 깊은/현실적/포용력/실행력") 발견. 해당 어휘도 차단.
const VOCAB_BLACKLIST: readonly { word: string; max: number }[] = [
  // 기존 (유지)
  { word: "묵직", max: 3 },
  { word: "안정적", max: 3 },
  { word: "조화롭", max: 3 },
  { word: "포용", max: 3 },
  { word: "넉넉", max: 3 },
  // Phase 17 (관상학 편향 어휘 1차)
  { word: "안정", max: 3 }, // "안정감" 포함
  { word: "조화", max: 2 },
  { word: "꾸준", max: 2 },
  { word: "부드럽", max: 3 }, // Phase 20.2: 4→3 강화 (GPT에서 9회 수렴 발견)
  { word: "통찰", max: 2 },
  { word: "차분", max: 3 },
  { word: "또렷", max: 3 },
  { word: "신중", max: 3 },
  { word: "관찰력", max: 2 },
  { word: "판단력", max: 1 }, // Phase 17.5: 2 → 1로 강화
  // Phase 20.2 추가 (GPT-5.4 mini 수렴 어휘)
  { word: "단정", max: 3 },
  { word: "은근", max: 3 },
  // Phase 17.5 추가 (축 도피 어휘)
  { word: "분석", max: 2 }, // "분석", "분석력", "분석적" 포함
  { word: "명석", max: 1 },
  { word: "사려 깊", max: 1 }, // "사려 깊은/깊다"
  { word: "현실적", max: 2 },
  { word: "포용력", max: 2 },
  { word: "실행력", max: 2 },
  { word: "돋보", max: 4 }, // "돋보이는" 연속
] as const;

// ============================================================
// Phase 17.5 (2026-04-22) — 의미 축 통합 견제
// 블랙리스트는 개별 어휘 단위라 Gemini가 유의어로 도피하는 루프가 있음.
// "관찰·판단·분석·명석·사려 깊음" 축은 서로 교환 가능한 유의어군이라
// 합계 상한으로 묶어야 축 자체의 수렴이 차단됨.
// ============================================================

const INTELLECT_AXIS_WORDS: readonly string[] = [
  "관찰력",
  "판단력",
  "분석",
  "분석력",
  "명석",
  "사려 깊",
  "통찰",
  "통찰력",
  "현명",
  "지혜",
  "지적",
] as const;

const INTELLECT_AXIS_LIMIT = 3;

const countIntellectAxis = (texts: string[]): number =>
  texts.reduce((acc, text) => {
    if (!text) return acc;
    return (
      acc +
      INTELLECT_AXIS_WORDS.reduce((innerAcc, word) => {
        const matches = text.match(new RegExp(word, "g"));
        return innerAcc + (matches ? matches.length : 0);
      }, 0)
    );
  }, 0);

const assertIntellectAxisLimit = (
  texts: string[],
  sectionLabel: string
): void => {
  const count = countIntellectAxis(texts);
  if (count > INTELLECT_AXIS_LIMIT) {
    throw new Error(
      `[v3 검증 실패] Soft: ${sectionLabel}: 지성·판단 축 어휘 합계 ${count}회 ` +
        `(허용 ${INTELLECT_AXIS_LIMIT}회 이하). ` +
        `"${INTELLECT_AXIS_WORDS.join("·")}" 이 너무 자주 등장합니다. ` +
        `다른 축으로 분산하세요: ` +
        `유머(위트·여유·가벼움), 감수성(섬세·공감·감성), 활동성(추진·실행·속도), ` +
        `순발력(눈치·재치·기지), 호기심(탐구·학습욕), 표현력(언변·전달력), 직관(감각·본능).`
    );
  }
};

const countWordInTexts = (texts: string[], word: string): number =>
  texts.reduce((acc, text) => {
    if (!text) return acc;
    const matches = text.match(new RegExp(word, "g"));
    return acc + (matches ? matches.length : 0);
  }, 0);

/** Soft: 공통 어휘가 각 섹션 텍스트에서 상한(3회)을 넘으면 재시도. */
const assertVocabBlacklist = (texts: string[], sectionLabel: string): void => {
  const violations: string[] = [];
  for (const { word, max } of VOCAB_BLACKLIST) {
    const count = countWordInTexts(texts, word);
    if (count > max) {
      violations.push(`"${word}" ${count}회(허용 ${max})`);
    }
  }
  if (violations.length > 0) {
    throw new Error(
      `[v3 검증 실패] Soft: ${sectionLabel}: 반복 어휘 과다 — ${violations.join(", ")}. ` +
        `대체 어휘로 교체하세요: ` +
        `묵직→단단한 밀도·무게감, 안정적→흔들림 없는·차분한, 조화롭→맞물린·어우러진, ` +
        `꾸준→지속되는·일관된·한결같은, 포용→받아주는·넉넉한 결, 넉넉→여유로운·풍요로운·여백이 있는.`
    );
  }
};

// ============================================================
// Phase 17 (2026-04-22) — 상담가 화법 상한
// "관상에서는 ~", "관상학에서는 ~", "관상적으로는 ~" 등 상담가 인용 화법은
// 각 섹션에 1회 권장이었으나 result-report4.md에서 [종합인상]+[종합균형감]
// +body 3개에 걸쳐 평균 7회 이상 등장 → 단조로움.
// 섹션별 텍스트 기준 3회 상한으로 강화.
// ============================================================

const CONSULTANT_PHRASE_PATTERNS: readonly RegExp[] = [
  /관상에서는/g,
  /관상학에서는/g,
  /관상적으로(는|\s)/g,
  /관상학에서\s*이런/g,
  /관상학적으로/g,
] as const;

const CONSULTANT_PHRASE_LIMIT_STAGE_A = 2;
const CONSULTANT_PHRASE_LIMIT_STAGE_B = 4;
const CONSULTANT_PHRASE_LIMIT_STAGE_C = 3;

const countConsultantPhrase = (texts: string[]): number =>
  texts.reduce((acc, text) => {
    if (!text) return acc;
    return (
      acc +
      CONSULTANT_PHRASE_PATTERNS.reduce((innerAcc, pattern) => {
        const matches = text.match(pattern);
        return innerAcc + (matches ? matches.length : 0);
      }, 0)
    );
  }, 0);

const assertConsultantPhraseLimit = (
  texts: string[],
  limit: number,
  sectionLabel: string
): void => {
  const count = countConsultantPhrase(texts);
  if (count > limit) {
    throw new Error(
      `[v3 검증 실패] Soft: ${sectionLabel}: 상담가 화법 ${count}회 ` +
        `(허용 ${limit}회 이하). "관상에서는 ~", "관상학에서는 ~", ` +
        `"관상적으로는 ~" 등 인용 화법이 과다합니다. ` +
        `일부를 단정 관찰문으로 교체하세요 ` +
        `(예: "~인 인상이 드러나요", "~한 결이 엿보여요", "~쪽의 얼굴이에요").`
    );
  }
};

// ============================================================
// Phase 16 — 클리셰 종결 패턴 상한 (Option III)
// "~로 보기도 해요" / "~로 풀이하기도 해요" 등 상담가 인용형 종결 과다.
// result-report2.md에서 5명 모두 [전체 균형감] 섹션 말미가 동일 형태로 마감.
// 한 섹션 텍스트에서 1회 초과하면 재시도 유도.
// ============================================================

const CLICHE_CLOSING_PATTERNS: readonly RegExp[] = [
  /로\s*보기도\s*해(요|죠|습니다)/g,
  /로\s*풀이하기도\s*해(요|죠|습니다)/g,
  /길하게\s*보(기|는|기도)\s*해(요|죠|습니다)/g,
  /길하게\s*풀이(하|해)/g,
] as const;

const CLICHE_CLOSING_LIMIT = 1;

const countClicheClosings = (text: string): number => {
  if (!text) return 0;
  return CLICHE_CLOSING_PATTERNS.reduce((acc, pattern) => {
    const matches = text.match(pattern);
    return acc + (matches ? matches.length : 0);
  }, 0);
};

// ============================================================
// Phase 16 — bullets 클리셰 다양성 (Option IV)
// Stage B의 24개 bullets(8부위 × 3개)에서 수렴 어휘가 총 8개를 넘으면 재시도.
// ============================================================

const BULLETS_CLICHE_WORDS: readonly string[] = [
  "묵직",
  "안정",
  "조화",
  "꾸준",
  "포용",
  "균형",
  "행동력",
  "실행력",
  "넉넉",
] as const;

const BULLETS_CLICHE_LIMIT = 8;

const countBulletsCliche = (regions: Array<{ bullets: string[] }>): number => {
  let count = 0;
  regions.forEach((r) => {
    r.bullets.forEach((b) => {
      if (BULLETS_CLICHE_WORDS.some((w) => b.includes(w))) {
        count += 1;
      }
    });
  });
  return count;
};

// ============================================================
// validateSignatureOverall (Phase 11 확장)
// ============================================================

export const validateSignatureOverall = (
  resp: SignatureOverallResponse
): void => {
  const { signature, overallScore } = resp;
  ensureArrayLength(signature.coreKeywords, 4, 6, "signature.coreKeywords");
  ensureArrayLength(overallScore.highlights, 5, 12, "overallScore.highlights");

  // [Hard] Phase 21: faceAge 형식 검증
  const { faceAge } = signature;
  if (!faceAge || !faceAge.range || !faceAge.label || !faceAge.note) {
    throw new Error(
      `[v3 검증 실패] signature.faceAge: 필수 필드 누락 (range/label/note).`
    );
  }
  if (!/^\d{2}-\d{2}$/.test(faceAge.range)) {
    throw new Error(
      `[v3 검증 실패] signature.faceAge.range: "${faceAge.range}" 형식 오류. "NN-NN" (5년 대역) 형태여야 합니다.`
    );
  }
  // [Soft] faceAge 금지 어휘 (동안/노안 평가 차단)
  const ageBannedWords = [
    "동안",
    "노안",
    "실제보다",
    "어려 보",
    "어려보",
    "나이 들",
    "성숙해 보",
    "앳되",
  ];
  const faceAgeText = `${faceAge.label} ${faceAge.note}`;
  const ageViolations = ageBannedWords.filter((w) => faceAgeText.includes(w));
  if (ageViolations.length > 0) {
    throw new Error(
      `[v3 검증 실패] Soft: signature.faceAge: 동안/노안 평가 어휘 포함 (${ageViolations.join(", ")}). 중립적 표현으로 재작성 필요.`
    );
  }

  // [Soft] coreKeywords 과거 수렴 어휘 최대 1개
  const legacyCount = countLegacyKeywords(signature.coreKeywords);
  if (legacyCount > LEGACY_KEYWORD_MAX) {
    const legacyHits = signature.coreKeywords.filter((kw) =>
      LEGACY_CONVERGED_KEYWORDS.some(
        (legacy) => kw.includes(legacy) || legacy.includes(kw)
      )
    );
    throw new Error(
      `[v3 검증 실패] Soft: signature.coreKeywords: 과거 수렴 어휘 ${legacyCount}개 포함 (허용 ${LEGACY_KEYWORD_MAX}개 이하). ` +
        `사용된 과거 어휘: ${legacyHits.join(", ")}. ` +
        `[${LEGACY_CONVERGED_KEYWORDS.join(", ")}] 중 최대 1개만 허용. 부위 hint에서 새 어휘를 뽑아 교체하세요.`
    );
  }

  // [Soft] highlights 반대 결 축 최소 2개
  const reverseCount = countReverseAxisHighlights(overallScore.highlights);
  if (reverseCount < REVERSE_AXIS_MIN) {
    throw new Error(
      `[v3 검증 실패] Soft: overallScore.highlights: 반대 결 축 특성 ${reverseCount}개 (최소 ${REVERSE_AXIS_MIN}개 필요). ` +
        `주류 축(신중·안정·꾸준·포용)만 나열되지 않도록, ` +
        `활동성(추진력·실행력), 유머(위트·여유), 감수성(섬세함·공감), 순발력(눈치·재치), 호기심(탐구), 표현력(전달력) 중 ` +
        `최소 ${REVERSE_AXIS_MIN}개 포함하세요.`
    );
  }

  // [Soft] Phase 16 Option III: summary 내 클리셰 종결 과다 ("~로 보기도 해요" 등)
  const summaryClicheHits = countClicheClosings(overallScore.summary);
  if (summaryClicheHits > CLICHE_CLOSING_LIMIT) {
    throw new Error(
      `[v3 검증 실패] Soft: overallScore.summary: 클리셰 종결 패턴 ${summaryClicheHits}회 ` +
        `(허용 ${CLICHE_CLOSING_LIMIT}회 이하). ` +
        `"~로 보기도 해요", "~로 풀이하기도 해요", "길하게 보기도 해요" 등 상담가 인용형 종결이 ` +
        `한 문단에 반복되면 단조롭습니다. 1회만 남기고 나머지는 단정문·관찰문으로 교체하세요 ` +
        `(예: "이런 결이 엿보여요", "~한 인상이 드러나요", "~편이에요").`
    );
  }

  // [Soft] Phase 16 Option II: 공통 어휘 블랙리스트 (Stage A 범위)
  const stageATexts = [
    signature.subDefinition,
    signature.commonlyHeardPhrase,
    signature.commonMisread,
    overallScore.scoreOneLiner,
    overallScore.summary,
    ...overallScore.highlights.map((h) => `${h.title} ${h.body}`),
  ];
  assertVocabBlacklist(stageATexts, "signature+overallScore");

  // [Soft] Phase 17: 상담가 화법 상한 (Stage A)
  assertConsultantPhraseLimit(
    stageATexts,
    CONSULTANT_PHRASE_LIMIT_STAGE_A,
    "signature+overallScore"
  );

  // [Soft] Phase 17.5: 지성·판단 축 통합 상한 (Stage A)
  assertIntellectAxisLimit(stageATexts, "signature+overallScore");
};

// ============================================================
// validateRegionScores (Phase 11 확장)
// ============================================================

export const validateRegionScores = (
  resp: RegionScoresResponse,
  expectedCount: number
): void => {
  ensureArrayLength(
    resp.regions,
    expectedCount,
    expectedCount,
    "regionScores.regions"
  );
  resp.regions.forEach((r, i) => {
    ensureArrayLength(r.bullets, 3, 3, `regions[${i}].bullets`);
  });

  // [Soft] "A보다 B" 패턴 oneLiner 최대 3개
  const aBodaBCount = countABodaB(resp.regions);
  if (aBodaBCount > A_BODA_B_LIMIT) {
    throw new Error(
      `[v3 검증 실패] Soft: regionScores.regions: "A보다 B" 패턴 oneLiner ${aBodaBCount}개 (허용 ${A_BODA_B_LIMIT}개 이하). ` +
        `부위별 패턴 할당을 지켜 다양화하세요: ` +
        `이마·턱=A보다 B, 눈·광대=명사구, 눈썹·균형감=역설, 코=관점·시간, 입=일상 어미.`
    );
  }

  // [Soft] Phase 16 Option IV: bullets 클리셰 다양성 (24개 중 8개 초과 시 재시도)
  const bulletsClicheCount = countBulletsCliche(resp.regions);
  if (bulletsClicheCount > BULLETS_CLICHE_LIMIT) {
    throw new Error(
      `[v3 검증 실패] Soft: regionScores.regions.bullets: 수렴 어휘 포함 bullets ` +
        `${bulletsClicheCount}개 (허용 ${BULLETS_CLICHE_LIMIT}개 이하). ` +
        `8개 부위 × 3개 bullets 중 "${BULLETS_CLICHE_WORDS.join("·")}" 류 어휘가 과반을 ` +
        `차지하고 있어 부위별 차별화가 사라집니다. ` +
        `각 bullets는 부위 고유 특성을 구체적 상황으로 묘사하세요 ` +
        `(예: "첫 미팅에서 상대 말을 끝까지 듣는 편이에요", "결정은 한 박자 늦게 ` +
        `내리는 쪽이에요").`
    );
  }

  // [Soft] Phase 16 Option II: 공통 어휘 블랙리스트 (Stage B 범위)
  const allBulletsAndLines = resp.regions.flatMap((r) => [
    r.interpretation,
    ...r.bullets,
    r.oneLiner,
  ]);
  assertVocabBlacklist(allBulletsAndLines, "regionScores");

  // [Soft] Phase 17: 상담가 화법 상한 (Stage B — interpretation에서 가장 많이 나옴)
  assertConsultantPhraseLimit(
    allBulletsAndLines,
    CONSULTANT_PHRASE_LIMIT_STAGE_B,
    "regionScores"
  );

  // [Soft] Phase 17.5: 지성·판단 축 통합 상한 (Stage B)
  assertIntellectAxisLimit(allBulletsAndLines, "regionScores");
};

// ============================================================
// validateInterestAreas (Phase 11 확장)
// ============================================================

// Phase 21 (2026-04-26): MZ 톤·단락 분리 강화로 상한 살짝 상향(400→420),
// 정통 미세 영역 + 양극 축 + 상대 시점 추가로 하한도 320으로 상향.
const LOVE_BODY_MIN_LENGTH = 320;
const LOVE_BODY_MAX_LENGTH = 420;

export const validateInterestAreas = (resp: InterestAreasResponse): void => {
  ensureArrayLength(resp.interestAreas.areas, 3, 3, "interestAreas.areas");
  const expectedOrder = ["love", "money", "career"] as const;
  resp.interestAreas.areas.forEach((a, i) => {
    if (a.domain !== expectedOrder[i]) {
      throw new Error(
        `[v3 검증 실패] interestAreas.areas[${i}].domain: ${a.domain} (기대 ${expectedOrder[i]})`
      );
    }
    ensureArrayLength(a.strengths, 3, 3, `areas[${i}].strengths`);
    ensureArrayLength(a.cautions, 3, 3, `areas[${i}].cautions`);
  });

  // 시간·축적 은유 — Phase 11: 범위 확장
  const timeCheckSentences = [
    ...resp.interestAreas.areas.map((a) => a.nicknameSubtext),
    ...resp.interestAreas.areas.map((a) => a.oneLineVerdict),
    ...resp.interestAreas.areas.map((a) => a.oneLineDefinition),
    ...resp.interestAreas.areas.map((a) => a.body),
    resp.closing.finalNote,
  ];
  const totalHits = timeCheckSentences.reduce(
    (acc, text) => acc + countTimeAccumulation(text),
    0
  );
  if (totalHits > TIME_ACCUMULATION_LIMIT) {
    // [Soft] 시간·축적 은유 상한 — LLM이 구조적으로 벗어나기 어려운 편향이라
    // 최종 시도에서 실패해도 경고만 남기고 콘텐츠는 통과시킨다.
    throw new Error(
      `[v3 검증 실패] Soft: 시간·축적 은유 ${totalHits}회 등장 (허용 ${TIME_ACCUMULATION_LIMIT}회 이하). ` +
        `nicknameSubtext, oneLineVerdict, oneLineDefinition, body, finalNote 전역에서 ` +
        `"시간이 갈수록", "쌓아가는", "차곡차곡", "가까워질수록", "함께할수록" 등 시간 경과/축적 표현이 과다합니다. ` +
        `대안 은유(무게·온기·속도·빛·공간·리듬·깊이)로 교체 후 재작성해주세요.`
    );
  }

  // [Soft] 긴 구문 중복 — nicknameSubtext 3개 + finalNote
  const duplicationCheckTexts = [
    ...resp.interestAreas.areas.map((a) => a.nicknameSubtext),
    resp.closing.finalNote,
  ];
  const shared = findSharedPhrase(duplicationCheckTexts);
  if (shared) {
    throw new Error(
      `[v3 검증 실패] Soft: nicknameSubtext·finalNote 중 "${shared}" 문구가 여러 문장에 반복됩니다. ` +
        `각 문장은 서로 다른 은유·어휘로 작성해야 합니다.`
    );
  }

  // [Soft] Phase 16 Option II: 공통 어휘 블랙리스트 (Stage C 범위)
  const stageCTexts = [
    ...resp.interestAreas.areas.flatMap((a) => [
      a.oneLineDefinition,
      a.body,
      ...a.strengths,
      ...a.cautions,
      a.oneLineVerdict,
      a.characterNickname,
      a.nicknameSubtext,
    ]),
    resp.closing.finalNickname,
    resp.closing.finalNote,
    resp.closing.shareLine,
  ];
  assertVocabBlacklist(stageCTexts, "interestAreas+closing");

  // [Soft] Phase 17: 상담가 화법 상한 (Stage C — body에서 재발)
  assertConsultantPhraseLimit(
    stageCTexts,
    CONSULTANT_PHRASE_LIMIT_STAGE_C,
    "interestAreas+closing"
  );

  // [Soft] Phase 17.5: 지성·판단 축 통합 상한 (Stage C)
  assertIntellectAxisLimit(stageCTexts, "interestAreas+closing");

  // [Soft] Phase 20.7 — 연애(love) body 길이 300~400자 범위 검증.
  // 프롬프트·OpenAI schema로 1차 가드했으나 Gemini는 schema minLength를 미지원하므로
  // 런타임에서 재확인한다. 벗어나면 soft 실패로 재시도 트리거.
  // 기존 content-quality 체크(시간 은유·어휘 blacklist) 이후에 배치해, 더 의미 있는
  // 품질 에러가 먼저 드러나도록 한다.
  const [loveArea] = resp.interestAreas.areas;
  if (loveArea?.domain === "love") {
    const len = loveArea.body.length;
    if (len < LOVE_BODY_MIN_LENGTH || len > LOVE_BODY_MAX_LENGTH) {
      throw new Error(
        `[v3 검증 실패] Soft: love body 길이 ${len}자가 허용 범위(${LOVE_BODY_MIN_LENGTH}~${LOVE_BODY_MAX_LENGTH})를 벗어났습니다. ` +
          `단락 추가·압축으로 재작성해주세요.`
      );
    }
  }
};

// ============================================================
// 메인 엔트리 — 3단계 호출 + 합성
// ============================================================

interface GenerateFaceReportV3Input {
  imageBase64: string;
  mimeType: string;
  animal: AnimalMatch;
  regionScores: RegionRawScore[];
}

/**
 * v3 텍스트 리포트 생성 (3단계 파이프라인).
 *
 * 반환은 `FaceTextReportV3` — 코드 결정 필드(animalChip, totalScore, region scores)를
 * 제외한 LLM 응답 형태. 호출자(API route)가 코드 필드와 합성해 최종 `FaceReportDataV3` 구성.
 */
export const generateFaceReportV3 = async ({
  imageBase64,
  mimeType,
  animal,
  regionScores,
}: GenerateFaceReportV3Input): Promise<FaceTextReportV3> => {
  // Phase 12: 각 호출에 validator를 주입하여 실패 시 feedback과 함께 재시도.
  // 3개 호출을 병렬로 실행해 전체 지연을 줄인다. 단계 간 의존성 없음.
  // Phase 20.6: env.FACE_SPOILER_HINT_MODE에 따라 프롬프트에 주입할 파생 정보 레벨 결정.
  const hintMode = env.FACE_SPOILER_HINT_MODE;
  const expectedRegionCount = regionScores.length;
  const [stageA, stageB, stageC] = await Promise.all([
    callStage<SignatureOverallResponse>({
      imageBase64,
      mimeType,
      systemPrompt: buildSignatureOverallSystemPrompt(
        animal,
        regionScores,
        hintMode
      ),
      userPrompt: SIGNATURE_OVERALL_USER_PROMPT,
      responseSchema: SIGNATURE_OVERALL_SCHEMA,
      stageName: "signature+overall",
      maxOutputTokens: 8192,
      validator: validateSignatureOverall,
    }),
    callStage<RegionScoresResponse>({
      imageBase64,
      mimeType,
      systemPrompt: buildRegionScoresSystemPrompt(
        animal,
        regionScores,
        hintMode
      ),
      userPrompt: REGION_SCORES_USER_PROMPT,
      responseSchema: REGION_SCORES_SCHEMA,
      stageName: "regionScores",
      maxOutputTokens: 8192,
      validator: (resp) => validateRegionScores(resp, expectedRegionCount),
    }),
    callStage<InterestAreasResponse>({
      imageBase64,
      mimeType,
      systemPrompt: buildInterestAreasSystemPrompt(
        animal,
        regionScores,
        hintMode
      ),
      userPrompt: INTEREST_AREAS_USER_PROMPT,
      responseSchema: INTEREST_AREAS_SCHEMA,
      stageName: "interestAreas+closing",
      maxOutputTokens: 8192,
      validator: validateInterestAreas,
    }),
  ]);

  return {
    signature: stageA.signature,
    overallScore: stageA.overallScore,
    regionScores: {
      regions: stageB.regions,
    },
    interestAreas: stageC.interestAreas,
    closing: stageC.closing,
  };
};
