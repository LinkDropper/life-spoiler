import {
  isV3Report,
  REGION_SCORE_KEYS,
  REGION_SCORE_LABEL,
  INTEREST_DOMAIN_KEYS,
  INTEREST_DOMAIN_LABEL,
} from "../types.v3";
import type { FaceReportDataV3 } from "../types.v3";

const buildValidReport = (): FaceReportDataV3 => ({
  version: 3,
  signature: {
    oneLineDefinition: "차분하고 단정한 정석형 인상",
    subDefinition:
      "첫인상에서 튀기보다는 볼수록 신뢰감이 생기는 타입으로 보여요.",
    coreKeywords: ["신뢰감", "안정감", "신중함", "꾸준함", "후반상승"],
    commonlyHeardPhrase: "'조용한데 은근 강하다'는 말, 들어보셨죠?",
    commonMisread: "'차가워 보인다'는 오해, 실제와 가장 거리가 먼 부분이에요.",
    animalChip: { type: "dog", label: "강아지상" },
  },
  overallScore: {
    totalScore: 8.6,
    scoreOneLiner: "강렬한 한 방보다, 전체 밸런스로 이기는 상.",
    summary:
      "전체적으로 균형감 있게 잡혀 있고 좌우가 안정적으로 보여서 급발진형보다는 신중형으로 읽혀요.\n\n뭔가를 시작할 때도 '일단 해보자'보다 생각하고 정리한 뒤 들어가는 스타일이에요.",
    highlights: [
      { title: "신중함", body: "일단 보고 판단하는 편이에요" },
      { title: "안정감", body: "큰 굴곡 없이 쌓아가는 분위기예요" },
      { title: "허세 없음", body: "과시보다 꾸준함으로 가는 쪽이에요" },
      { title: "묵직함", body: "말수는 적어도 핵심을 보고 있어요" },
      { title: "후반 상승", body: "시간이 갈수록 평판이 쌓이는 편이에요" },
      { title: "책임감", body: "맡은 일은 허투루 안 하는 편이에요" },
    ],
  },
  regionScores: {
    regions: REGION_SCORE_KEYS.map((key) => ({
      region: key,
      label: REGION_SCORE_LABEL[key],
      score: 8.5,
      interpretation:
        "관상에서는 이 부위를 보통 안정과 신뢰의 축으로 읽어요. 균형감이 또렷하게 잡혀 있어 무난함을 넘은 안정감이 보이는 편이에요.",
      bullets: [
        "한 번 보고 판단하는 편이에요",
        "감정에 휩쓸리지 않는 편이에요",
        "조용하지만 정확한 쪽이에요",
      ],
      oneLiner: "말은 적어도, 보고 있는 건 많은 눈.",
    })),
  },
  interestAreas: {
    areas: INTEREST_DOMAIN_KEYS.map((domain) => ({
      domain,
      label: INTEREST_DOMAIN_LABEL[domain],
      oneLineDefinition: "불꽃형보다, 오래 가는 신뢰형 흐름",
      body:
        "가볍게 마음을 열기보다는 상대를 오래 보고 판단하는 편이에요.\n\n관계가 시작되면 가볍게 끝나지 않고 묵직하게 이어가는 쪽이에요.\n\n표현이 요란하지 않아도 안정감은 꾸준히 전달돼요.",
      strengths: [
        "바람기보다 안정감이 있어요",
        "감정 기복을 덜 만드는 편이에요",
        "오래 갈수록 진가가 드러나요",
      ],
      cautions: [
        "표현이 부족해 오해받을 수 있어요",
        "속마음을 늦게 보여줘 타이밍을 놓칠 수 있어요",
        "좋아해도 티가 적어 손해볼 수 있어요",
      ],
      oneLineVerdict: "불꽃형보다, 오래 가는 신뢰형 운.",
      characterNickname: "무심한 듯 다정한 타입",
      nicknameSubtext: "겉은 담백, 속은 은근 깊은 쪽이에요.",
    })),
  },
  closing: {
    finalNickname: "조용한 강자형",
    finalNote:
      "처음엔 조용해 보여도 시간이 갈수록 '이 사람 괜찮다'는 말 듣는 얼굴이에요.",
    shareLine: "조용한 강자형 강아지상이래요. 볼수록 진가 드러나는 타입.",
  },
});

describe("v3 상수", () => {
  it("REGION_SCORE_KEYS는 정확히 8개", () => {
    expect(REGION_SCORE_KEYS).toHaveLength(8);
  });

  it("REGION_SCORE_LABEL이 모든 키를 커버한다", () => {
    REGION_SCORE_KEYS.forEach((key) => {
      expect(REGION_SCORE_LABEL[key]).toBeTruthy();
    });
  });

  it("INTEREST_DOMAIN_KEYS는 love → money → career 순서", () => {
    expect(INTEREST_DOMAIN_KEYS).toEqual(["love", "money", "career"]);
  });

  it("INTEREST_DOMAIN_LABEL이 모든 도메인을 커버한다", () => {
    INTEREST_DOMAIN_KEYS.forEach((d) => {
      expect(INTEREST_DOMAIN_LABEL[d]).toBeTruthy();
    });
  });
});

describe("isV3Report", () => {
  it("유효한 v3 리포트를 통과시킨다", () => {
    const report = buildValidReport();
    expect(isV3Report(report)).toBe(true);
  });

  it("version이 2인 리포트를 거부한다", () => {
    const report = { ...buildValidReport(), version: 2 };
    expect(isV3Report(report)).toBe(false);
  });

  it("version 필드가 없는 객체를 거부한다", () => {
    const report = buildValidReport() as Partial<FaceReportDataV3>;
    delete report.version;
    expect(isV3Report(report)).toBe(false);
  });

  it("필수 섹션(signature)이 누락되면 거부한다", () => {
    const report = buildValidReport() as Partial<FaceReportDataV3>;
    delete report.signature;
    expect(isV3Report(report)).toBe(false);
  });

  it("필수 섹션(regionScores)이 누락되면 거부한다", () => {
    const report = buildValidReport() as Partial<FaceReportDataV3>;
    delete report.regionScores;
    expect(isV3Report(report)).toBe(false);
  });

  it("필수 섹션(interestAreas)이 누락되면 거부한다", () => {
    const report = buildValidReport() as Partial<FaceReportDataV3>;
    delete report.interestAreas;
    expect(isV3Report(report)).toBe(false);
  });

  it("null / undefined / primitive 값을 거부한다", () => {
    expect(isV3Report(null)).toBe(false);
    expect(isV3Report(undefined)).toBe(false);
    expect(isV3Report("{}")).toBe(false);
    expect(isV3Report(42)).toBe(false);
    expect(isV3Report(true)).toBe(false);
  });
});
