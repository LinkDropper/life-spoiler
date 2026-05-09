import {
  formatCoordinatesForPrompt,
  generatePastLifeCoordinates,
  categoryLabelToExistenceType,
} from "../past-life-seed";
import type { PalaceData, ZiweiInterpretationRequest } from "../types";

// 테스트 헬퍼: 다양한 입력을 만드는 샘플 빌더
const makeRequest = (
  overrides: Partial<{
    lunarBirthInfo: string;
    gender: "male" | "female";
    relationshipStatus: string | null;
    occupationStatus: string | null;
    fortuneFirstStar: string;
    fortuneBrightness: string;
    huajiPalace: string;
    hualuPalace: string;
  }> = {}
): Omit<ZiweiInterpretationRequest, "requestType"> => {
  const fortunePalace: PalaceData = {
    name: "복덕궁",
    branch: "사",
    mainStars: [
      {
        name: overrides.fortuneFirstStar ?? "자미",
        brightness: overrides.fortuneBrightness ?? "묘",
      },
    ],
    minorStars: [],
  };

  return {
    user: {
      gender: overrides.gender ?? "male",
      lunarBirthInfo:
        overrides.lunarBirthInfo ?? "1990-01-01 12:00 (양력)",
      relationshipStatus:
        (overrides.relationshipStatus as "solo" | null | undefined) ?? null,
      occupationStatus:
        (overrides.occupationStatus as "employed" | null | undefined) ?? null,
    },
    chart: {
      wuxingJu: "수이국",
      mingGongPosition: "자",
      shenGongPosition: "축",
      sihua: {
        hualu: { star: "탐랑", palace: overrides.hualuPalace ?? "재백궁" },
        huaquan: { star: "무곡", palace: "관록궁" },
        huake: { star: "태음", palace: "부모궁" },
        huaji: { star: "거문", palace: overrides.huajiPalace ?? "질액궁" },
      },
    },
    palaces: { 복덕궁: fortunePalace },
  };
};

describe("generatePastLifeCoordinates", () => {
  it("같은 사용자에 대해서는 결정론적으로 같은 좌표를 반환한다", () => {
    const req = makeRequest({ lunarBirthInfo: "1990-05-15 08:30 (음력)" });
    const a = generatePastLifeCoordinates(req, "ko");
    const b = generatePastLifeCoordinates(req, "ko");
    expect(a).toEqual(b);
  });

  it("locale에 따라 좌표 라벨이 번역된다", () => {
    const req = makeRequest({ lunarBirthInfo: "1990-05-15 08:30 (음력)" });
    const ko = generatePastLifeCoordinates(req, "ko");
    const en = generatePastLifeCoordinates(req, "en");
    const ja = generatePastLifeCoordinates(req, "ja");

    // 같은 입력이면 같은 인덱스 → 라벨만 다름 (모두 비어있지 않음)
    for (const coord of [ko, en, ja]) {
      expect(coord.region).toBeTruthy();
      expect(coord.era).toBeTruthy();
      expect(coord.category).toBeTruthy();
    }
    // 라벨 자체는 다른 언어
    expect(ko.region).not.toBe(en.region);
    expect(ja.region).not.toBe(en.region);
  });

  it("100명의 가상 사용자에 걸쳐 카테고리 분포가 5종 이상 등장한다", () => {
    const categories = new Set<string>();
    const stars = ["자미", "태양", "탐랑", "천동", "칠살", "파군", "천부", "거문", "천량"];
    for (let i = 0; i < 100; i++) {
      const req = makeRequest({
        lunarBirthInfo: `1990-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")} ${String(i % 24).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}`,
        gender: i % 2 === 0 ? "male" : "female",
        fortuneFirstStar: stars[i % stars.length],
      });
      const c = generatePastLifeCoordinates(req, "ko");
      categories.add(c.category);
    }
    expect(categories.size).toBeGreaterThanOrEqual(5);
  });

  it("100명의 가상 사용자에 걸쳐 지역 분포가 8종 이상 등장한다 (15개 지역)", () => {
    const regions = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const req = makeRequest({
        lunarBirthInfo: `199${i % 10}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")} ${String(i % 24).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`,
      });
      regions.add(generatePastLifeCoordinates(req, "ko").region);
    }
    expect(regions.size).toBeGreaterThanOrEqual(8);
  });

  it("칠살·파군이 복덕궁에 있으면 드라마성이 격변쪽으로 편향된다", () => {
    const dramaScores: number[] = [];
    const dramaOrder = [
      "놀라우리만치 평온한 일생",
      "은은한 굴곡",
      "전형적인 산과 골",
      "격렬한 시련과 전성기",
      "찰나의 격변·이른 끝맺음",
    ];

    for (let i = 0; i < 50; i++) {
      const req = makeRequest({
        lunarBirthInfo: `1990-01-${String((i % 28) + 1).padStart(2, "0")} 12:00`,
        fortuneFirstStar: i % 2 === 0 ? "칠살" : "파군",
        fortuneBrightness: "함",
      });
      const c = generatePastLifeCoordinates(req, "ko");
      dramaScores.push(dramaOrder.indexOf(c.drama));
    }

    const avgStorm = dramaScores.reduce((a, b) => a + b, 0) / dramaScores.length;

    const calmScores: number[] = [];
    for (let i = 0; i < 50; i++) {
      const req = makeRequest({
        lunarBirthInfo: `1990-01-${String((i % 28) + 1).padStart(2, "0")} 12:00`,
        fortuneFirstStar: i % 2 === 0 ? "천동" : "천부",
        fortuneBrightness: "묘",
        hualuPalace: "복덕궁",
      });
      const c = generatePastLifeCoordinates(req, "ko");
      calmScores.push(dramaOrder.indexOf(c.drama));
    }
    const avgCalm = calmScores.reduce((a, b) => a + b, 0) / calmScores.length;

    expect(avgStorm).toBeGreaterThan(avgCalm);
  });
});

describe("formatCoordinatesForPrompt", () => {
  it("KO/EN/JA 모두 6개 축 라벨이 포함된다", () => {
    const req = makeRequest();
    const ko = formatCoordinatesForPrompt(
      generatePastLifeCoordinates(req, "ko"),
      "ko"
    );
    const en = formatCoordinatesForPrompt(
      generatePastLifeCoordinates(req, "en"),
      "en"
    );
    const ja = formatCoordinatesForPrompt(
      generatePastLifeCoordinates(req, "ja"),
      "ja"
    );

    expect(ko).toContain("무대");
    expect(ko).toContain("시대");
    expect(ko).toContain("드라마성");
    expect(en).toContain("Stage");
    expect(en).toContain("Era");
    expect(en).toContain("Dramaturgy");
    expect(ja).toContain("舞台");
    expect(ja).toContain("時代");
    expect(ja).toContain("ドラマ性");
  });
});

describe("categoryLabelToExistenceType", () => {
  const cases: [string, string][] = [
    ["인간", "human"],
    ["Human", "human"],
    ["人間", "human"],
    ["포유류 (육상)", "mammal"],
    ["Land mammal", "mammal"],
    ["陸棲哺乳類", "mammal"],
    ["조류", "bird"],
    ["Bird", "bird"],
    ["鳥類", "bird"],
    ["파충류·양서류", "reptile"],
    ["Reptile / amphibian", "reptile"],
    ["어류·해양생물", "fish"],
    ["Fish / marine creature", "fish"],
    ["곤충·절지류", "insect"],
    ["꽃·풀·관목", "plant"],
    ["교목·고목", "plant"],
    ["균류·이끼", "fungi"],
    ["Fungi / moss", "fungi"],
    ["광물·암석", "mineral"],
    ["Mineral / rock", "mineral"],
    ["기상 현상 (바람·구름·비)", "weather"],
    ["지형·지질 (강·산·동굴)", "landform"],
    ["unknown gibberish", "human"], // 폴백
  ];
  it.each(cases)("'%s' → %s", (label, expected) => {
    expect(categoryLabelToExistenceType(label)).toBe(expected);
  });
});
