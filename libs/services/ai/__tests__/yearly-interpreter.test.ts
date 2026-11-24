import { calculateDayun } from "@/libs/zi-wei-dou-shu/calculators";
import { calculateYearlyFortune } from "@/libs/zi-wei-dou-shu/calculators/yearly";
import {
  buildYearlyFactSheet,
  YEARLY_SECTIONS,
} from "@/libs/zi-wei-dou-shu/calculators/yearly-facts";
import { generateZiweiChart } from "@/libs/zi-wei-dou-shu/core";

import { buildRequestFactSheet } from "../lifetime-request";
import { findOutputViolations } from "../output-validator";
import { koPrompts } from "../prompts/ko";
import type {
  GeminiMessage,
  YearlyInterpretationRequest,
  YearlyInterpretationType,
} from "../types";
import { formatYearlyFactBlockKo, rankMonthTones } from "../yearly-fact-format";

const mockChatCompletion = jest.fn<
  Promise<string>,
  [GeminiMessage[], { responseSchema?: unknown }?]
>();

jest.mock("../provider", () => ({
  chatCompletion: (...args: [GeminiMessage[], { responseSchema?: unknown }?]) =>
    mockChatCompletion(...args),
  parseJsonResponse: (text: string) => JSON.parse(text),
  CURRENT_MODEL_NAME: "test-model",
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const loadInterpreter = () => require("../yearly-interpreter");

const TARGET_YEAR = 2026;
const CURRENT_AGE = 23;

const chart = generateZiweiChart({
  name: "테스트",
  birthDate: "2003-08-08",
  birthTime: "16:40",
  gender: "male",
  calendarType: "solar",
});
const dayun = calculateDayun(chart, 100, "ko");
const yearly = calculateYearlyFortune(chart, TARGET_YEAR, CURRENT_AGE);
const factSheet = buildYearlyFactSheet(
  buildRequestFactSheet(chart, dayun),
  yearly.sihua,
  yearly.peachBlossom,
  CURRENT_AGE
);

const buildRequest = (): Omit<YearlyInterpretationRequest, "requestType"> => ({
  user: {
    gender: "male",
    lunarBirthInfo: "2003년 7월 11일",
    currentAge: CURRENT_AGE,
    relationshipStatus: "solo",
    occupationStatus: "student",
  },
  chart: { wuxingJu: "화6국", mingGongPosition: "인" },
  targetYear: TARGET_YEAR,
  yearlySihua: {
    yearStemName: yearly.sihua.yearStemName,
    yearBranchName: yearly.sihua.yearBranchName,
    hualu: yearly.sihua.hualu,
    huaquan: yearly.sihua.huaquan,
    huake: yearly.sihua.huake,
    huaji: yearly.sihua.huaji,
  },
  monthlyFortunes: yearly.monthlyFortunes.map((m) => ({
    month: m.month,
    monthStemName: m.monthStemName,
    monthBranchName: m.monthBranchName,
    score: m.score,
    theme: m.theme,
  })),
  factSheet,
  engineScores: {
    wealth: yearly.scores.wealth,
    career: yearly.scores.career,
    relationship: yearly.scores.relationship,
    health: yearly.scores.health,
  },
  language: "ko",
});

const subSections = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    heading: `소제목${i}`,
    body: `본문 ${i}이에요.`,
  }));

/** 모든 요청 유형 스키마를 만족하는 응답 (zod가 남는 키는 버린다) */
const makeResponse = (body = "올해는 돈이 잘 붙어요.", n = 4): string =>
  JSON.stringify({
    judgment: "판정이에요",
    subSections: [{ heading: "첫", body }, ...subSections(n - 1)],
    headline: "🌱 올해 헤드라인",
    description: "설명이에요",
    oneLiner: "한 줄이에요",
    tags: ["태그하나", "태그둘"],
    score: 80,
    monthlyFortunes: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      bullets: ["불릿 하나예요", "불릿 둘이에요"],
      headline: `🌱 ${i + 1}월`,
      oneLiner: "한 줄이에요",
    })),
  });

describe("올해 사실 시트", () => {
  it("올해 사화가 떨어진 궁을 섹션별 주장으로 만든다", () => {
    const yearIds = YEARLY_SECTIONS.flatMap((s) =>
      factSheet.year[s].map((c) => c.id)
    );
    const sihuaIds = yearIds.filter((id) => /^year:화/.test(id));
    expect(sihuaIds.length).toBe(4);
    expect(yearIds).toContain(`year:화기@${yearly.sihua.huaji.palace}`);
  });

  it("타고난 바탕은 섹션당 2개 이하다", () => {
    for (const s of YEARLY_SECTIONS) {
      expect(factSheet.natal[s].length).toBeLessThanOrEqual(2);
    }
  });

  it("지금 나이가 든 대운 구간을 고른다", () => {
    expect(factSheet.decade?.startAge).toBeLessThanOrEqual(CURRENT_AGE);
    expect(factSheet.decade?.endAge).toBeGreaterThanOrEqual(CURRENT_AGE);
  });
});

describe("올해 KO 데이터 블록", () => {
  const types: YearlyInterpretationType[] = [
    "yearly_overview",
    "yearly_core",
    "yearly_wealth",
    "yearly_career",
    "yearly_relationship",
    "yearly_health",
    "yearly_monthly",
  ];
  const context = {
    targetYear: TARGET_YEAR,
    currentAge: CURRENT_AGE,
    gender: "남성",
    relationshipLabel: "솔로",
    occupationLabel: "학생",
    engineScores: buildRequest().engineScores,
    monthlyFortunes: buildRequest().monthlyFortunes,
  };

  it.each(types)("%s: 별·궁·사화 이름과 영어 헤더가 없다", (type) => {
    const block = formatYearlyFactBlockKo(factSheet, type, context);
    expect(
      findOutputViolations({ block }, "ko").filter(
        (v) => v.code === "FORBIDDEN_TERM"
      )
    ).toEqual([]);
    expect(block).not.toMatch(/Main Stars|Yearly Sihua|hualu|Natal/);
  });

  it("손님 나이는 대상 연도의 나이로 적는다", () => {
    const block = formatYearlyFactBlockKo(factSheet, "yearly_wealth", context);
    expect(block).toContain(`${TARGET_YEAR}년 나이: 만 ${CURRENT_AGE}세`);
  });

  it("월별 블록은 엔진 점수 순위로 달 톤을 준다", () => {
    const block = formatYearlyFactBlockKo(factSheet, "yearly_monthly", context);
    expect(block.match(/좋은 달/g)?.length).toBeGreaterThanOrEqual(2);
    // 엔진 월 테마("변화의 기운" 등)는 추상어라 넘기지 않는다
    expect(block).not.toContain("기운");
  });

  it("rankMonthTones: 동점은 같은 톤으로 묶고, 점수가 모두 같으면 보통", () => {
    const toMonths = (scores: number[]) =>
      scores.map((score, i) => ({
        month: i + 1,
        monthStemName: "",
        monthBranchName: "",
        score,
        theme: "",
      }));
    const tied = rankMonthTones(toMonths([75, 75, 75, 70, 70, 67, 67, 67]));
    expect([1, 2, 3].map((m) => tied.get(m))).toEqual([
      "좋은 달",
      "좋은 달",
      "좋은 달",
    ]);
    expect(tied.get(4)).toBe("보통");
    expect(tied.get(8)).toBe("조심할 달");
    const flat = rankMonthTones(toMonths([60, 60, 60, 60]));
    expect([...flat.values()].every((t) => t === "보통")).toBe(true);
  });

  it("rankMonthTones: 위 2개 좋은 달, 아래 2개 조심할 달", () => {
    const tones = rankMonthTones(
      [50, 70, 60, 40, 55, 65, 52, 30, 58, 61, 45, 51].map((score, i) => ({
        month: i + 1,
        monthStemName: "",
        monthBranchName: "",
        score,
        theme: "",
      }))
    );
    expect(tones.get(2)).toBe("좋은 달");
    expect(tones.get(6)).toBe("좋은 달");
    expect(tones.get(8)).toBe("조심할 달");
    expect(tones.get(4)).toBe("조심할 달");
    expect(tones.get(1)).toBe("보통");
  });
});

describe("올해 KO 프롬프트", () => {
  it("예전 공통 블록(금지 목록·별 해설 표·감정 대비)을 쓰지 않는다", () => {
    expect(koPrompts.yearlySystemPrompt).not.toMatch(/🚨|성계별|감정 대비/);
    expect(koPrompts.yearlySystemPrompt).not.toMatch(
      /[가-힣]니다(?=[.\s,)]|$)/
    );
  });

  it("섹션 지시에 추상어 라벨(흐름·기운·에너지)과 ~니다가 없다", () => {
    const all = Object.values(koPrompts.yearlyUserPrompts).join("\n");
    expect(all).not.toMatch(/흐름|기운|에너지/);
    expect(all).not.toMatch(/[가-힣]니다(?=[.\s,)]|$)/);
  });
});

describe("generateYearlyInterpretation (KO 사실 시트)", () => {
  beforeEach(() => mockChatCompletion.mockReset());

  it("KO 요청은 judgment를 맨 앞, headline을 본문 뒤에 둔 스키마로 보낸다", async () => {
    mockChatCompletion.mockImplementation(async (_messages, options) => {
      const schema = options?.responseSchema as {
        properties: Record<string, { minItems?: number }>;
      };
      const n = schema.properties.subSections?.minItems ?? 4;
      return makeResponse("올해는 돈이 잘 붙어요.", n);
    });
    const { generateYearlyInterpretation } = loadInterpreter();
    await generateYearlyInterpretation(buildRequest());

    const overviewSchema = mockChatCompletion.mock.calls[0][1]
      ?.responseSchema as { properties: Record<string, unknown> };
    const keys = Object.keys(overviewSchema.properties);
    expect(keys[0]).toBe("judgment");
    expect(keys.indexOf("subSections")).toBeLessThan(keys.indexOf("headline"));
    expect(keys).not.toContain("summary");
  });

  it("KO 요청은 원본 명반 텍스트 대신 사실 시트를 보낸다", async () => {
    mockChatCompletion.mockImplementation(async (_messages, options) => {
      const schema = options?.responseSchema as {
        properties: Record<string, { minItems?: number }>;
      };
      return makeResponse(
        undefined,
        schema.properties.subSections?.minItems ?? 4
      );
    });
    const { generateYearlyInterpretation } = loadInterpreter();
    await generateYearlyInterpretation(buildRequest());

    const user = mockChatCompletion.mock.calls[0][0][1].content;
    expect(user).toContain("사실 시트");
    expect(user).not.toContain("Yearly Sihua");
  });

  it("~니다가 나오면 1회 재생성한다", async () => {
    let calls = 0;
    mockChatCompletion.mockImplementation(async (_messages, options) => {
      calls += 1;
      const schema = options?.responseSchema as {
        properties: Record<string, { minItems?: number }>;
      };
      const n = schema.properties.subSections?.minItems ?? 4;
      return makeResponse(
        calls === 1 ? "올해는 돈이 잘 붙습니다." : "올해는 돈이 잘 붙어요.",
        n
      );
    });
    const { generateYearlyInterpretation } = loadInterpreter();
    const result = await generateYearlyInterpretation(buildRequest());

    // 7개 섹션 + 첫 응답 재생성 1회
    expect(mockChatCompletion).toHaveBeenCalledTimes(8);
    expect(JSON.stringify(result)).not.toContain("붙습니다");
  });
});
