import { INTEREST_DOMAIN_KEYS } from "../types.v3";

/**
 * Phase 20 (2026-04-22) — OpenAI structured outputs용 strict JSON Schema.
 *
 * OpenAI `response_format: { type: "json_schema", strict: true }`는
 * Gemini의 responseSchema 대비 다음을 **강제**한다:
 * 1. 모든 object에 `additionalProperties: false`
 * 2. object의 `required`에 **모든 키**가 포함되어야 함 (optional 불가)
 * 3. 중첩된 모든 object에 위 두 규칙 재귀 적용
 *
 * 현재 `text-report.v3.ts` 의 Gemini 스키마는 위 규칙을 충족하지 않으므로
 * OpenAI 호출 시 그대로 쓰면 400 에러. 본 파일이 strict 변형을 제공한다.
 *
 * 응답 구조는 gemini.v3 / openai.v3 양쪽 모두 동일하므로 기존 validator
 * (`validateSignatureOverall` 등)를 그대로 재사용할 수 있다.
 */

export const SIGNATURE_OVERALL_SCHEMA_STRICT = {
  type: "object",
  additionalProperties: false,
  properties: {
    signature: {
      type: "object",
      additionalProperties: false,
      properties: {
        oneLineDefinition: { type: "string" },
        subDefinition: { type: "string" },
        coreKeywords: {
          type: "array",
          items: { type: "string" },
        },
        commonlyHeardPhrase: { type: "string" },
        commonMisread: { type: "string" },
        faceAge: {
          type: "object",
          additionalProperties: false,
          properties: {
            range: { type: "string" },
            label: { type: "string" },
            note: { type: "string" },
          },
          required: ["range", "label", "note"],
        },
      },
      required: [
        "oneLineDefinition",
        "subDefinition",
        "coreKeywords",
        "commonlyHeardPhrase",
        "commonMisread",
        "faceAge",
      ],
    },
    overallScore: {
      type: "object",
      additionalProperties: false,
      properties: {
        scoreOneLiner: { type: "string" },
        summary: { type: "string" },
        highlights: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              body: { type: "string" },
            },
            required: ["title", "body"],
          },
        },
      },
      required: ["scoreOneLiner", "summary", "highlights"],
    },
  },
  required: ["signature", "overallScore"],
} as const;

export const REGION_SCORES_SCHEMA_STRICT = {
  type: "object",
  additionalProperties: false,
  properties: {
    regions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          interpretation: { type: "string" },
          bullets: {
            type: "array",
            items: { type: "string" },
          },
          oneLiner: { type: "string" },
        },
        required: ["interpretation", "bullets", "oneLiner"],
      },
    },
  },
  required: ["regions"],
} as const;

export const INTEREST_AREAS_SCHEMA_STRICT = {
  type: "object",
  additionalProperties: false,
  properties: {
    interestAreas: {
      type: "object",
      additionalProperties: false,
      properties: {
        areas: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              domain: {
                type: "string",
                enum: INTEREST_DOMAIN_KEYS,
              },
              label: { type: "string" },
              oneLineDefinition: { type: "string" },
              // Phase 21: body 길이 가드. 실제 범위는 분야별로 다름
              // (love: 320~420, money·career: 280~360). 스키마는 3개 도메인 공통
              // loose bound(280~420)만 강제하고, love의 tight range는 프롬프트와
              // 런타임 validator에서 추가로 검증한다.
              body: { type: "string", minLength: 280, maxLength: 420 },
              strengths: {
                type: "array",
                items: { type: "string" },
              },
              cautions: {
                type: "array",
                items: { type: "string" },
              },
              oneLineVerdict: { type: "string" },
              characterNickname: { type: "string" },
              nicknameSubtext: { type: "string" },
            },
            required: [
              "domain",
              "label",
              "oneLineDefinition",
              "body",
              "strengths",
              "cautions",
              "oneLineVerdict",
              "characterNickname",
              "nicknameSubtext",
            ],
          },
        },
      },
      required: ["areas"],
    },
    closing: {
      type: "object",
      additionalProperties: false,
      properties: {
        finalNickname: { type: "string" },
        finalNote: { type: "string" },
        shareLine: { type: "string" },
      },
      required: ["finalNickname", "finalNote", "shareLine"],
    },
  },
  required: ["interestAreas", "closing"],
} as const;
