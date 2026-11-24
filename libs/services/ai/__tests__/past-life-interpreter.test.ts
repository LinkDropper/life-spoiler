import {
  formatCoordinatesForPrompt,
  generatePastLifeCoordinates,
} from "../past-life-seed";
import {
  pastLifeSystemPromptKo,
  pastLifeUserPromptsKo,
} from "../prompts/past-life-ko";
import type {
  GeminiMessage,
  PalaceData,
  ZiweiInterpretationRequest,
} from "../types";

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

jest.mock("../image-generator", () => ({
  generatePastLifeImage: jest.fn(async () => "https://example.test/image.png"),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const loadInterpreter = () => require("../past-life-interpreter");

const fortunePalace: PalaceData = {
  name: "복덕궁",
  branch: "사",
  mainStars: [{ name: "자미", brightness: "묘" }],
  minorStars: [],
};

const request: Omit<ZiweiInterpretationRequest, "requestType"> = {
  user: {
    gender: "male",
    lunarBirthInfo: "1990-01-01 12:00 (양력)",
    relationshipStatus: null,
    occupationStatus: null,
  },
  chart: {
    wuxingJu: "수이국",
    mingGongPosition: "자",
    shenGongPosition: "축",
    sihua: {
      hualu: { star: "탐랑", palace: "재백궁" },
      huaquan: { star: "무곡", palace: "관록궁" },
      huake: { star: "태음", palace: "부모궁" },
      huaji: { star: "거문", palace: "질액궁" },
    },
  },
  palaces: { 복덕궁: fortunePalace },
  language: "ko",
} as Omit<ZiweiInterpretationRequest, "requestType">;

const sections = (body = "고요한 숲에서 자랐어요.") => [
  { heading: "첫", body },
  { heading: "둘", body: "두 번째 이야기예요." },
  { heading: "셋", body: "세 번째 이야기예요." },
];

/** 모든 KO 요청 유형 스키마를 만족하는 응답 (zod가 남는 키는 버린다) */
const makeResponse = (body?: string): string =>
  JSON.stringify({
    existenceType: "bird",
    judgment: "판정이에요",
    subSections: sections(body),
    headline: "안데스 콘도르",
    description: "높이 나는 새였어요",
    oneLiner: "한 줄이에요",
    imagePrompt: "3D render of an Andean condor, close-up",
    events: [1, 2, 3].map((i) => ({
      period: `${i}번째 겨울`,
      event: "장면이에요",
    })),
    lastWords: "잘 지내요",
    hashtags: ["#하나", "#둘", "#셋"],
    spectrums: [1, 2, 3, 4].map(() => ({
      label: "관계",
      leftLabel: "고독",
      rightLabel: "교감",
      score: 50,
    })),
    epitaph: "바람을 기억했어요",
    title: "고원의 파수꾼",
    stats: [1, 2, 3, 4, 5].map(() => ({ label: "직감", score: 70 })),
    contrasts: [1, 2, 3].map(() => ({
      aspect: "성격",
      pastLife: "홀로 날았어요",
      presentLife: "혼자 있는 시간이 필요해요",
    })),
    lessons: [1, 2].map(() => ({
      headline: "교훈",
      bullets: ["오늘 해 볼 일이에요", "하나 더예요"],
      oneLiner: "한 줄이에요",
    })),
    era: "잉카 시대",
    location: "안데스 고원",
    atmosphere: "바람이 찼어요",
    socialRole: "무리의 길잡이",
    traces: [1, 2, 3].map(() => ({
      category: "끌림",
      trace: "높은 곳에 서면 마음이 놓여요",
      origin: "절벽 위에서 바람을 탔어요",
    })),
  });

const PROMPT_TEXT = [
  pastLifeSystemPromptKo,
  ...Object.values(pastLifeUserPromptsKo),
].join("\n");

describe("전생 KO 프롬프트", () => {
  it("~니다 지시문, 이모지 헤더, 실패 경고가 없다", () => {
    expect(PROMPT_TEXT).not.toMatch(/[가-힣]니다(?=[.\s,)]|$)/);
    expect(PROMPT_TEXT).not.toMatch(/🚨|🎯|즉시 실패|실패입니다/);
  });

  it("현생 연결은 흔적·대비·교훈과 스포일러 힌트에만 맡긴다", () => {
    expect(pastLifeUserPromptsKo.past_life_end).toContain(
      "그 생의 끝까지만 그려요"
    );
    expect(pastLifeUserPromptsKo.past_life_connections).toContain(
      "전생 속 인연을 그려요"
    );
    expect(PROMPT_TEXT).not.toContain("현생과의 연결 필수");
  });

  it("KO 좌표 안내도 해요체다", () => {
    const block = formatCoordinatesForPrompt(
      generatePastLifeCoordinates(request, "ko"),
      "ko"
    );
    expect(block).not.toMatch(/[가-힣]니다(?=[.\s,)]|$)|하세요/);
  });
});

describe("generatePastLifeInterpretation (KO)", () => {
  beforeEach(() => mockChatCompletion.mockReset());

  it("스포일러를 먼저 만들고, 탄생은 스포일러가 정한 존재를 받아 쓴다", async () => {
    mockChatCompletion.mockImplementation(async () => makeResponse());
    const { generatePastLifeInterpretation } = loadInterpreter();
    await generatePastLifeInterpretation(request, "profile-1");

    const users = mockChatCompletion.mock.calls.map(([m]) => m[1].content);
    expect(users[0]).toContain("전생 스포일러 섹션");
    const birth = users.find((u) => u.includes("탄생 섹션이에요"));
    expect(birth).toContain("전생 존재: 안데스 콘도르");
  });

  it("스포일러 스키마는 존재 유형 → judgment → 본문 → 제목 → 이미지 프롬프트 순이다", async () => {
    mockChatCompletion.mockImplementation(async () => makeResponse());
    const { generatePastLifeInterpretation } = loadInterpreter();
    await generatePastLifeInterpretation(request, "profile-1");

    const schema = mockChatCompletion.mock.calls[0][1]?.responseSchema as {
      properties: Record<string, unknown>;
    };
    const keys = Object.keys(schema.properties);
    expect(keys.slice(0, 3)).toEqual([
      "existenceType",
      "judgment",
      "subSections",
    ]);
    expect(keys.at(-1)).toBe("imagePrompt");
    expect(keys).not.toContain("summary");
  });

  it("~니다가 나오면 재생성하고, 이미지 프롬프트는 검사하지 않는다", async () => {
    mockChatCompletion.mockImplementation(async (messages) => {
      const isSpoilerFirst =
        messages.length === 2 &&
        messages[1].content.includes("전생 스포일러 섹션");
      return makeResponse(
        isSpoilerFirst ? "고요한 숲에서 자랐습니다." : "고요한 숲에서 자랐어요."
      );
    });
    const { generatePastLifeInterpretation } = loadInterpreter();
    const result = await generatePastLifeInterpretation(request, "profile-1");

    // 11개 섹션 + 스포일러 재생성 1회 (imagePrompt의 영어·별 이름 없는 문장은 검사 대상 아님)
    expect(mockChatCompletion).toHaveBeenCalledTimes(12);
    expect(JSON.stringify(result.spoiler)).not.toContain("자랐습니다");
  });
});
