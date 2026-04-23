import {
  INTEREST_AREAS_SCHEMA,
  REGION_SCORES_SCHEMA,
  SIGNATURE_OVERALL_SCHEMA,
  buildInterestAreasSystemPrompt,
  buildRegionScoresSystemPrompt,
  buildSignatureOverallSystemPrompt,
} from "../prompts/text-report.v3";
import type { RegionRawScore } from "../region-scorer";
import type { AnimalMatch } from "../types";

const animal: AnimalMatch = {
  primary: "dog",
  confidence: "high",
  matchedRegions: ["둥근 턱", "수평에 가까운 눈꼬리"],
  rationale:
    "둥근 턱선과 수평에 가까운 눈꼬리가 친근한 인상을 또렷하게 만들어요.",
};

const regionScores: RegionRawScore[] = [
  {
    region: "forehead",
    label: "이마",
    score: 8.2,
    rationaleHint: "이마 비율이 안정적으로 잡혀 있어 생각의 정리력이 또렷한 쪽",
    numericHint: "상부 폭 비율 0.90 · 상삼정 0.33",
  },
  {
    region: "eye",
    label: "눈",
    score: 8.7,
    rationaleHint: "눈매가 안정적으로 정돈되어 상대를 보고 판단하는 쪽",
    numericHint: "눈 가로세로비 3.80 · 눈꼬리 각도 4.0° · 눈 크기 비율 0.06",
  },
  {
    region: "brow",
    label: "눈썹",
    score: 8.1,
    rationaleHint: "눈썹 결이 정돈된 편이라 자기 기준과 매너가 읽히는 쪽",
    numericHint: "상삼정 0.33 · 눈 가로세로비 3.80",
  },
  {
    region: "nose",
    label: "코",
    score: 8.8,
    rationaleHint:
      "코가 얼굴 중심에 안정적으로 자리 잡아 현실 감각이 또렷한 쪽",
    numericHint: "코 길이 비율 0.28 · 인중 비율 0.35",
  },
  {
    region: "mouth",
    label: "입",
    score: 8.4,
    rationaleHint: "입매가 차분하고 정돈된 편이라 말의 무게감이 있는 쪽",
    numericHint: "입 폭 비율 0.40 · 인중 비율 0.35",
  },
  {
    region: "chin",
    label: "턱 / 하관",
    score: 8.6,
    rationaleHint: "턱선이 안정적으로 잡혀 있어 버티는 힘이 읽히는 쪽",
    numericHint: "턱 폭 비율 0.90 · 턱 각 비율 0.45",
  },
  {
    region: "cheekbone",
    label: "광대",
    score: 8.3,
    rationaleHint:
      "광대가 과하지 않게 자리 잡혀 있어 사회적 존재감이 무리 없이 드러나는 쪽",
    numericHint: "중삼정 0.34 · 턱 폭 비율 0.90",
  },
  {
    region: "balance",
    label: "전체 균형감",
    score: 9.0,
    rationaleHint:
      "한 군데가 튀기보다 전체가 조화롭게 잡혀 있어 안정감이 묵직한 쪽",
    numericHint: "삼정 상 0.33 / 중 0.34 / 하 0.33 · 얼굴 비율 1.05",
  },
];

describe("v3 시스템 프롬프트", () => {
  it("Stage A (signature + overallScore) 프롬프트는 동물상 이름과 핵심 지시를 포함한다", () => {
    const prompt = buildSignatureOverallSystemPrompt(animal, regionScores);
    expect(prompt).toContain("강아지상");
    expect(prompt).toContain("signature");
    expect(prompt).toContain("overallScore");
    // 프롬프트 내 한자 관상 용어가 '금지 리스트'로서만 등장하고 실제 해석 가이드로는 등장하지 않는지 확인 (heuristic)
    expect(prompt).not.toMatch(/臥蠶으로 분석하면|山根 부위를 풀이/);
  });

  it("Stage A 프롬프트에 자기인식 트리거·반전 호기심 훅 규칙이 명시되어 있다", () => {
    const prompt = buildSignatureOverallSystemPrompt(animal, regionScores);
    expect(prompt).toContain("commonlyHeardPhrase");
    expect(prompt).toContain("commonMisread");
    expect(prompt).toContain("자기인식 폭발 트리거");
    expect(prompt).toContain("반전 호기심 트리거");
  });

  it("Stage B (regionScores) 프롬프트에 8개 부위 순서가 정확히 포함", () => {
    const prompt = buildRegionScoresSystemPrompt(animal, regionScores);
    regionScores.forEach((r, i) => {
      expect(prompt).toContain(`${i + 1}. ${r.label}`);
    });
  });

  it("Stage B 프롬프트가 상담가 인용 화법 사용을 명시한다", () => {
    const prompt = buildRegionScoresSystemPrompt(animal, regionScores);
    expect(prompt).toContain("관상에서는");
    expect(prompt).toContain("따옴표");
  });

  it("Stage B 프롬프트는 부위 hint를 모두 포함한다", () => {
    const prompt = buildRegionScoresSystemPrompt(animal, regionScores);
    regionScores.forEach((r) => {
      expect(prompt).toContain(r.rationaleHint);
    });
  });

  it("Stage C (interestAreas + closing) 프롬프트에 3개 분야 순서가 명시", () => {
    const prompt = buildInterestAreasSystemPrompt(animal, regionScores);
    expect(prompt).toContain("love → money → career");
    expect(prompt).toContain("💕 연애운");
    expect(prompt).toContain("💰 재물운");
    expect(prompt).toContain("💼 직장운");
  });

  it("Stage C 프롬프트에 shareLine용 동물상 이름이 주입된다", () => {
    const prompt = buildInterestAreasSystemPrompt(animal, regionScores);
    expect(prompt).toContain("강아지상");
  });

  it("모든 스테이지 프롬프트는 FORBIDDEN_RULES 윤리 가드를 포함한다", () => {
    [
      buildSignatureOverallSystemPrompt(animal, regionScores),
      buildRegionScoresSystemPrompt(animal, regionScores),
      buildInterestAreasSystemPrompt(animal, regionScores),
    ].forEach((prompt) => {
      expect(prompt).toContain("외모 평가·차별 절대 금지");
      expect(prompt).toContain("단정 금지");
      expect(prompt).toContain("측정 수치 출력 금지");
      expect(prompt).toContain("성별·젠더 추정 금지");
    });
  });
});

describe("v3 responseSchema", () => {
  it("Stage A schema의 required 필드", () => {
    expect(SIGNATURE_OVERALL_SCHEMA.required).toEqual([
      "signature",
      "overallScore",
    ]);
    expect(SIGNATURE_OVERALL_SCHEMA.properties.signature.required).toEqual([
      "oneLineDefinition",
      "subDefinition",
      "coreKeywords",
      "commonlyHeardPhrase",
      "commonMisread",
      "faceAge",
    ]);
  });

  it("Stage B schema의 regions 항목 구조", () => {
    expect(REGION_SCORES_SCHEMA.required).toEqual(["regions"]);
    expect(REGION_SCORES_SCHEMA.properties.regions.items.required).toEqual([
      "interpretation",
      "bullets",
      "oneLiner",
    ]);
  });

  it("Stage C schema에 domain enum이 love/money/career", () => {
    const domainEnum =
      INTEREST_AREAS_SCHEMA.properties.interestAreas.properties.areas.items
        .properties.domain.enum;
    expect(domainEnum).toEqual(["love", "money", "career"]);
  });

  it("Stage C schema의 closing required 필드", () => {
    expect(INTEREST_AREAS_SCHEMA.properties.closing.required).toEqual([
      "finalNickname",
      "finalNote",
      "shareLine",
    ]);
  });
});
