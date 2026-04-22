import { NextRequest } from "next/server";

const mockMaybeSingle = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockFrom = jest.fn();
const mockCreateServerClient = jest.fn();
const mockSaveFortune = jest.fn();
const mockGetFortune = jest.fn();
const mockGetCachedResult = jest.fn();
const mockSetCachedResult = jest.fn();
const mockGenerateChartHash = jest.fn();
const mockGenerateFullInterpretation = jest.fn();
const mockCreateFallbackInterpretation = jest.fn();
const mockGenerateZiweiChart = jest.fn();
const mockCalculateDayun = jest.fn();
const mockCalculateAllDayunScores = jest.fn();
const mockCalculateSihua = jest.fn();
const mockIdentifyGeokGuk = jest.fn();

jest.mock("@/libs/supabase", () => ({
  createServerClient: mockCreateServerClient,
  saveFortune: mockSaveFortune,
  getFortune: mockGetFortune,
  getCachedResult: mockGetCachedResult,
  setCachedResult: mockSetCachedResult,
  generateChartHash: mockGenerateChartHash,
}));

jest.mock("@/libs/services/ai", () => ({
  generateFullInterpretation: mockGenerateFullInterpretation,
  createFallbackInterpretation: mockCreateFallbackInterpretation,
}));

jest.mock("@/libs/zi-wei-dou-shu/core", () => ({
  generateZiweiChart: mockGenerateZiweiChart,
}));

jest.mock("@/libs/zi-wei-dou-shu/calculators", () => ({
  calculateDayun: mockCalculateDayun,
  calculateAllDayunScores: mockCalculateAllDayunScores,
  calculateSihua: mockCalculateSihua,
  identifyGeokGuk: mockIdentifyGeokGuk,
}));

jest.mock("@/libs/zi-wei-dou-shu/constants/branches", () => ({
  EARTHLY_BRANCHES: [
    "자",
    "축",
    "인",
    "묘",
    "진",
    "사",
    "오",
    "미",
    "신",
    "유",
    "술",
    "해",
  ],
}));

jest.mock("@/i18n/config", () => ({
  defaultLocale: "ko",
  locales: ["ko", "en"],
}));

import { POST } from "../route";

const palaces = [
  "명궁",
  "형제궁",
  "부처궁",
  "자녀궁",
  "재백궁",
  "질액궁",
  "천이궁",
  "노복궁",
  "관록궁",
  "전택궁",
  "복덕궁",
  "부모궁",
].map((name, i) => ({
  name,
  branch: i,
  mainStars: i === 0 ? [{ name: "자미", brightness: "묘" }] : [],
  minorStars: [],
}));

const validBody = {
  name: "홍길동",
  birthDate: "1990-05-15",
  birthTime: "12:00",
  gender: "male",
  calendarType: "solar",
};

const createRequest = (body: Record<string, unknown>): NextRequest =>
  new NextRequest("http://localhost/api/interpret", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

const setupMocks = () => {
  mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ select: mockSelect });
  mockCreateServerClient.mockReturnValue({ from: mockFrom });

  mockSaveFortune.mockResolvedValue(true);
  mockGetFortune.mockResolvedValue(null);
  mockGetCachedResult.mockResolvedValue(null);
  mockSetCachedResult.mockResolvedValue(undefined);
  mockGenerateChartHash.mockReturnValue("test-hash");

  mockGenerateFullInterpretation.mockResolvedValue({
    summary: "test",
    categories: {},
  });
  mockCreateFallbackInterpretation.mockReturnValue({
    summary: "fallback",
    categories: {},
  });

  mockGenerateZiweiChart.mockReturnValue({
    input: validBody,
    lunarDate: { year: 1990, month: 5, day: 15, isLeapMonth: false },
    palaces,
    sihua: {
      hualu: "자미",
      huaquan: "천기",
      huake: "태양",
      huaji: "무곡",
    },
    wuxingJu: 2,
    mingGong: 0,
    shenGong: 6,
  });

  mockCalculateDayun.mockReturnValue({ periods: [] });
  mockCalculateAllDayunScores.mockReturnValue({ periods: [] });
  mockCalculateSihua.mockReturnValue({
    hualu: "자미",
    huaquan: "천기",
    huake: "태양",
    huaji: "무곡",
  });
  mockIdentifyGeokGuk.mockReturnValue([]);
};

describe("/api/interpret 프로필 검증", () => {
  beforeEach(() => {
    setupMocks();
  });

  it("존재하지 않는 profileId로 요청 시 saveFortune을 호출하지 않는다", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const request = createRequest({
      ...validBody,
      profileId: "non-existent-uuid",
    });

    const response = await POST(request);
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(mockSaveFortune).not.toHaveBeenCalled();
  });

  it("존재하는 profileId로 요청 시 saveFortune을 호출한다", async () => {
    const existingProfileId = "existing-profile-uuid";
    mockMaybeSingle.mockResolvedValue({
      data: { id: existingProfileId },
      error: null,
    });

    const request = createRequest({
      ...validBody,
      profileId: existingProfileId,
    });

    const response = await POST(request);
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(mockSaveFortune).toHaveBeenCalledWith(
      expect.objectContaining({ profileId: existingProfileId })
    );
  });

  it("profileId가 없으면 프로필 검증을 건너뛴다", async () => {
    const request = createRequest(validBody);

    const response = await POST(request);
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(mockFrom).not.toHaveBeenCalledWith("profiles");
    expect(mockSaveFortune).not.toHaveBeenCalled();
  });
});
