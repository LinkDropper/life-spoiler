import { isV2Report } from "../types";
import type { FaceReportData } from "../types";

const buildValidReport = (): FaceReportData => ({
  version: 2,
  animalMatch: {
    primary: "dog",
    confidence: "high",
    matchedRegions: ["둥근 얼굴", "올라간 입꼬리"],
    rationale:
      "둥근 얼굴 윤곽에 입꼬리가 자연스럽게 올라가 있어 친근한 기운이 강하게 잡혀요.",
  },
  firstImpression: {
    headline: "편안한 첫인상",
    description: "문을 열자마자 긴장이 풀리는 분위기예요.",
    summary: "부드럽고 둥근 윤곽이 대화의 문턱을 낮춰줍니다.",
    vibeTags: ["따뜻함", "편안함"],
    intensity: "strong",
  },
  observation: {
    headline: "사진에서 관찰된 것",
    content: "얼굴 윤곽은 전반적으로 둥근 편이고 이목구비가 균형 잡혀 있어요.",
    features: [
      {
        region: "faceShape",
        axis: "shape",
        value: "둥근 편",
        intensity: "strong",
      },
      { region: "eye", axis: "shape", value: "둥근 편", intensity: "balanced" },
      { region: "brow", axis: "density", value: "보통", intensity: "balanced" },
      {
        region: "noseTip",
        axis: "shape",
        value: "둥근 편",
        intensity: "balanced",
      },
      {
        region: "mouthCorner",
        axis: "tilt",
        value: "살짝 올라감",
        intensity: "strong",
      },
      {
        region: "chin",
        axis: "shape",
        value: "둥근 편",
        intensity: "balanced",
      },
      {
        region: "cheekbone",
        axis: "prominence",
        value: "평평한 편",
        intensity: "subtle",
      },
      {
        region: "forehead",
        axis: "width",
        value: "넓은 편",
        intensity: "balanced",
      },
    ],
  },
  traits: {
    headline: "숨은 매력",
    strengths: "첫 만남에서 상대가 경계를 내려놓기 쉬워요.",
    hiddenSide: "가까워지면 의외로 고집을 부리는 순간이 있어요.",
    tags: ["친화력", "끈기"],
    intensity: "balanced",
  },
  fortune: {
    headline: "일과 재물의 리듬",
    workFlow: "협업이 필요한 환경에서 페이스를 잘 만듭니다.",
    wealthFlow: "큰 기복보다는 꾸준한 흐름을 유지합니다.",
    tags: ["협업형", "꾸준함"],
    intensity: "balanced",
  },
  relationship: {
    headline: "어울리는 사람",
    content: "감정을 천천히 열어가는 편이라 긴 호흡의 관계가 잘 맞아요.",
    idealType: "말보다 분위기로 배려하는 사람과 잘 맞습니다.",
    shareableQuote: "천천히 스며드는 온기가 결국 제일 오래 남아요.",
    tags: ["은근", "다정"],
    intensity: "strong",
  },
  actions: [
    {
      title: "첫 5분 페이스",
      detail: "대화 시작 5분 동안은 질문을 더 많이 던져보세요.",
    },
    {
      title: "주간 기록",
      detail: "이번 주의 작은 기쁨을 한 줄로 메모해 두세요.",
    },
    {
      title: "짧은 산책",
      detail: "점심 직후 10분 산책으로 에너지를 리셋하세요.",
    },
  ],
  shareLine: "오늘 만난 강아지상, 분위기까지 데려가는 사람이에요.",
});

describe("isV2Report", () => {
  it("유효한 v2 리포트를 통과시킨다", () => {
    const report = buildValidReport();
    expect(isV2Report(report)).toBe(true);
  });

  it("version 필드가 없는 객체를 거부한다", () => {
    const legacy = { profile: { headline: "h" }, shareLine: "x" };
    expect(isV2Report(legacy)).toBe(false);
  });

  it("version이 2가 아니면 거부한다", () => {
    const report = { ...buildValidReport(), version: 1 };
    expect(isV2Report(report)).toBe(false);
  });

  it("필수 섹션이 누락되면 거부한다", () => {
    const report = buildValidReport() as Partial<FaceReportData>;
    delete report.animalMatch;
    expect(isV2Report(report)).toBe(false);
  });

  it("null/undefined/primitive 값을 거부한다", () => {
    expect(isV2Report(null)).toBe(false);
    expect(isV2Report(undefined)).toBe(false);
    expect(isV2Report("{}")).toBe(false);
    expect(isV2Report(42)).toBe(false);
  });
});
