import {
  validateInterestAreas,
  validateRegionScores,
  validateSignatureOverall,
} from "../gemini.v3";
import type {
  InterestAreasResponse,
  RegionScoresResponse,
  SignatureOverallResponse,
} from "../prompts/text-report.v3";

const buildValidSignatureOverall = (): SignatureOverallResponse => ({
  signature: {
    oneLineDefinition: "옆에 있으면 편안해지는 묘한 든든함의 상",
    subDefinition:
      "첫인상에서 튀기보다는 볼수록 편안함이 번지는 타입으로 보이는, 묵직한 무게감이 있는 인상이에요.",
    coreKeywords: ["묵직함", "추진력", "눈치", "표현력", "신중함"],
    commonlyHeardPhrase: "'조용한데 은근 강하다'는 말, 한 번쯤 들어보셨죠?",
    commonMisread: "'차가워 보인다'는 오해, 실제와 가장 거리가 먼 부분이에요.",
    faceAge: {
      range: "25-29",
      label: "20대 후반",
      note: "첫인상 기준의 대략적인 추정이에요.",
    },
  },
  overallScore: {
    scoreOneLiner: "강렬한 한 방보다, 전체 밸런스로 이기는 상.",
    summary:
      "전체적으로 균형감 있게 잡혀 있어서 급발진형보다 신중형으로 읽히는 인상이에요. 첫인상에서 크게 튀기보다 볼수록 편안함이 번지는 타입으로 보여요.\n\n뭔가를 시작할 때도 '일단 해보자'보다 생각하고 정리한 뒤 들어가는 스타일이고, 맡은 일은 허투루 하지 않는 편이라 주변에서는 조용한데 믿음직한 사람으로 통하는 쪽이에요.",
    highlights: [
      { title: "묵직함", body: "말수는 적어도 핵심을 보는 편이에요" },
      { title: "추진력", body: "한번 정하면 끝까지 밀고 가는 쪽이에요" },
      { title: "눈치", body: "주변 상황을 빠르게 읽는 편이에요" },
      { title: "표현력", body: "한 마디를 던져도 무게가 실려요" },
      { title: "안정감", body: "큰 굴곡 없이 이어가는 분위기예요" },
      { title: "호기심", body: "새로운 영역도 기꺼이 들여다봐요" },
    ],
  },
});

const buildValidRegionScores = (): RegionScoresResponse => ({
  regions: Array.from({ length: 8 }, () => ({
    interpretation:
      "이 부위의 결이 단단히 자리한 느낌이에요. 전체 인상에서 무리 없는 리듬이 살아 있어 주변에 편안함을 주는 쪽이에요.",
    bullets: [
      "한 번 보고 판단하는 편이에요",
      "감정에 휩쓸리지 않는 쪽이에요",
      "조용하지만 정확한 편이에요",
    ],
    oneLiner: "말은 적어도, 보고 있는 건 많은 눈.",
  })),
});

interface AreaFixture {
  domain: "love" | "money" | "career";
  label: string;
  body: string;
  oneLineDefinition: string;
  oneLineVerdict: string;
  characterNickname: string;
  nicknameSubtext: string;
}

const AREA_FIXTURES: AreaFixture[] = [
  {
    domain: "love",
    label: "💕 연애운",
    oneLineDefinition: "썸은 느려도 관계에선 무게 있는 애정형",
    body: "관상에서는 이런 인상을 보통 진득한 신뢰형으로 풀이하는 편이에요.\n\n가볍게 마음을 열기보다는 상대를 천천히 관찰하는 쪽이라 썸 초반에는 템포가 느리고, 상대의 말과 행동을 충분히 살핀 뒤에야 자기 페이스를 꺼내는 모습이 자주 읽혀요.\n\n하지만 관계가 자리 잡으면 묵직하게 이어지는 특성이 있어서, 곁에 있으면 제일 안심된다는 평가를 받는 쪽이에요.",
    oneLineVerdict: "불꽃형보다, 오래 가는 신뢰형 연애운.",
    characterNickname: "무심한 듯 다정한 타입",
    nicknameSubtext: "겉은 담백, 속은 은근 깊은 쪽이에요.",
  },
  {
    domain: "money",
    label: "💰 재물운",
    oneLineDefinition: "충동보다 계산이 앞서는 실속형 흐름",
    body: "코가 얼굴 중앙에 안정적으로 자리 잡아 현실 감각이 또렷한 편이에요.\n\n충동 소비보다 한 번 더 계산하는 쪽이라 세일에 덜 흔들리고, 매달 들어오는 흐름에서 안정감을 느끼는 편이에요.\n\n큰 투자에 뛰어들기보다 리스크 관리를 중심에 두는 보수적 스타일이 돋보여요.",
    oneLineVerdict: "벼락부자형보다, 알짜배기 실속형 재물운.",
    characterNickname: "계산 장인 왕",
    nicknameSubtext: "한 번 더 따져보는 습관이 든든한 무기예요.",
  },
  {
    domain: "career",
    label: "💼 직장운",
    oneLineDefinition: "묵직한 신뢰로 자리 잡는 실무형 커리어",
    body: "눈썹 결이 정돈된 편이라 자기 원칙과 매너를 지키며 일하는 성실함이 읽혀요.\n\n회의에서 주도적으로 나서기보다는 묵묵히 자신의 역할을 다하면서 조직 내에서 신뢰를 얻는 쪽이에요.\n\n장기 프로젝트나 분석형 업무에서 두각을 드러내는 타입으로 보여요.",
    oneLineVerdict: "말보다 결과로 인정받는 직장운.",
    characterNickname: "묵묵한 플레이어",
    nicknameSubtext: "조용히 결과로 증명하는 무게감이 매력이에요.",
  },
];

const buildValidInterestAreas = (): InterestAreasResponse => {
  return {
    interestAreas: {
      areas: AREA_FIXTURES.map((fx) => ({
        domain: fx.domain,
        label: fx.label,
        oneLineDefinition: fx.oneLineDefinition,
        body: fx.body,
        strengths: [
          "흔들림이 적은 편이에요",
          "신뢰 쌓는 속도에 자기 리듬이 있는 쪽이에요",
          "지속되는 페이스가 강점이에요",
        ],
        cautions: [
          "표현이 늦어 오해받을 수 있어요",
          "속도를 놓칠 수 있어요",
          "티가 적어 손해볼 수 있어요",
        ],
        oneLineVerdict: fx.oneLineVerdict,
        characterNickname: fx.characterNickname,
        nicknameSubtext: fx.nicknameSubtext,
      })),
    },
    closing: {
      finalNickname: "조용한 강자형",
      finalNote:
        "처음엔 조용해 보여도 곁에 있을 때 '이 사람 괜찮다'는 말 듣는 얼굴이에요.",
      shareLine: "조용한 강자형 강아지상이에요. 묵직한 무게감이 매력이에요.",
    },
  };
};

describe("validateSignatureOverall", () => {
  it("유효한 응답을 통과", () => {
    expect(() =>
      validateSignatureOverall(buildValidSignatureOverall())
    ).not.toThrow();
  });

  it("극단적으로 긴 글도 통과한다 (길이 검증 제거됨)", () => {
    const bad = buildValidSignatureOverall();
    bad.overallScore.summary = "긴 문장이에요. ".repeat(200);
    bad.signature.oneLineDefinition = "짧음";
    expect(() => validateSignatureOverall(bad)).not.toThrow();
  });

  it("coreKeywords 개수가 4~6 범위를 벗어나면 실패", () => {
    const bad = buildValidSignatureOverall();
    bad.signature.coreKeywords = ["하나"];
    expect(() => validateSignatureOverall(bad)).toThrow();
  });

  it("highlights 개수가 5~12 범위를 벗어나면 실패", () => {
    const bad = buildValidSignatureOverall();
    bad.overallScore.highlights = [];
    expect(() => validateSignatureOverall(bad)).toThrow();
  });

  it("Phase 11 — coreKeywords에 과거 수렴 어휘가 2개 이상이면 실패", () => {
    const bad = buildValidSignatureOverall();
    bad.signature.coreKeywords = [
      "신중함",
      "안정감",
      "꾸준함",
      "신뢰감",
      "후반상승",
    ];
    expect(() => validateSignatureOverall(bad)).toThrow(/과거 수렴 어휘/);
  });

  it("Phase 11 — highlights에 반대 결 축 2개 미만이면 실패", () => {
    const bad = buildValidSignatureOverall();
    bad.overallScore.highlights = [
      { title: "신중함", body: "일단 보고 판단하는 편이에요" },
      { title: "안정감", body: "큰 굴곡 없이 이어가는 분위기예요" },
      { title: "포용력", body: "주변을 편안하게 하는 쪽이에요" },
      { title: "균형감", body: "튀지 않게 어우러지는 편이에요" },
      { title: "신뢰감", body: "곁에 두면 든든한 인상이에요" },
      { title: "성실함", body: "맡은 일은 끝까지 해내는 편이에요" },
    ];
    expect(() => validateSignatureOverall(bad)).toThrow(/반대 결 축/);
  });
});

describe("validateRegionScores", () => {
  it("유효한 8개 응답을 통과", () => {
    expect(() =>
      validateRegionScores(buildValidRegionScores(), 8)
    ).not.toThrow();
  });

  it("극단적으로 긴 interpretation도 통과 (길이 검증 제거됨)", () => {
    const bad = buildValidRegionScores();
    bad.regions[0].interpretation = "길이 상관없음. ".repeat(100);
    bad.regions[0].oneLiner = "짧";
    expect(() => validateRegionScores(bad, 8)).not.toThrow();
  });

  it("개수가 기대치와 다르면 실패", () => {
    expect(() => validateRegionScores(buildValidRegionScores(), 7)).toThrow();
  });

  it("bullets가 3개가 아니면 실패", () => {
    const bad = buildValidRegionScores();
    bad.regions[0].bullets = ["하나", "둘"];
    expect(() => validateRegionScores(bad, 8)).toThrow();
  });

  it("Phase 11 — 'A보다 B' 패턴 oneLiner가 4개 이상이면 실패", () => {
    const bad = buildValidRegionScores();
    bad.regions[0].oneLiner = "급함보다, 차분한 생각이 앞서는 이마.";
    bad.regions[1].oneLiner = "조급함보다, 관찰이 먼저인 눈.";
    bad.regions[2].oneLiner = "거침보다, 정돈이 우선인 눈썹.";
    bad.regions[3].oneLiner = "흐름보다, 중심이 먼저인 코.";
    expect(() => validateRegionScores(bad, 8)).toThrow(/A보다 B/);
  });
});

describe("validateInterestAreas", () => {
  it("유효한 3개 응답을 통과", () => {
    expect(() =>
      validateInterestAreas(buildValidInterestAreas())
    ).not.toThrow();
  });

  it("극단적으로 긴 body도 통과 (길이 검증 제거됨)", () => {
    const bad = buildValidInterestAreas();
    bad.interestAreas.areas[0].body = "길이 상관없음. ".repeat(100);
    bad.closing.shareLine = "짧";
    expect(() => validateInterestAreas(bad)).not.toThrow();
  });

  it("도메인 순서가 love→money→career가 아니면 실패", () => {
    const bad = buildValidInterestAreas();
    bad.interestAreas.areas.reverse();
    expect(() => validateInterestAreas(bad)).toThrow();
  });

  it("areas가 3개가 아니면 실패", () => {
    const bad = buildValidInterestAreas();
    bad.interestAreas.areas = bad.interestAreas.areas.slice(0, 2);
    expect(() => validateInterestAreas(bad)).toThrow();
  });

  it("strengths 개수가 3이 아니면 실패", () => {
    const bad = buildValidInterestAreas();
    bad.interestAreas.areas[0].strengths = ["하나", "둘"];
    expect(() => validateInterestAreas(bad)).toThrow();
  });

  it("cautions 개수가 3이 아니면 실패", () => {
    const bad = buildValidInterestAreas();
    bad.interestAreas.areas[0].cautions = ["하나", "둘", "셋", "넷"];
    expect(() => validateInterestAreas(bad)).toThrow();
  });

  it("시간·축적 은유가 상한(6회)을 크게 초과하면 실패", () => {
    const bad = buildValidInterestAreas();
    // 7회 주입 → 상한 6 초과
    bad.interestAreas.areas[0].nicknameSubtext =
      "시간이 갈수록 깊어지는 신뢰가 있어요.";
    bad.interestAreas.areas[1].nicknameSubtext =
      "차곡차곡 쌓아가는 자산이 든든해요.";
    bad.interestAreas.areas[2].nicknameSubtext =
      "오래 볼수록 진가가 드러나는 타입이에요.";
    bad.interestAreas.areas[0].oneLineVerdict = "가까워질수록 깊어지는 연애운.";
    bad.interestAreas.areas[1].oneLineVerdict =
      "쌓아 올리는 흐름이 든든한 재물운.";
    bad.closing.finalNote = "관계가 깊어질수록 믿음이 쌓여가는 인상이에요.";
    expect(() => validateInterestAreas(bad)).toThrow(/시간·축적 은유/);
  });

  it("시간·축적 은유가 상한(6회) 이하면 통과", () => {
    const bad = buildValidInterestAreas();
    bad.interestAreas.areas[0].nicknameSubtext =
      "시간이 갈수록 편안함이 묻어나요.";
    bad.interestAreas.areas[1].nicknameSubtext =
      "차곡차곡 안정적으로 관리하는 쪽이에요.";
    bad.interestAreas.areas[2].nicknameSubtext =
      "함께할수록 든든함이 배어나는 편이에요.";
    // 3회 등장 (상한 6 이하) → 통과
    expect(() => validateInterestAreas(bad)).not.toThrow();
  });

  it("Phase 11 — 범위 확장: oneLineVerdict·body에 시간 은유가 있으면 합산 카운트 증가", () => {
    const bad = buildValidInterestAreas();
    // 범위 확장이 작동해 oneLineVerdict·body도 카운트에 포함되는지 검증
    // 7회 주입 (nicknameSubtext 2 + oneLineVerdict 2 + body 2 + finalNote 1)
    bad.interestAreas.areas[0].nicknameSubtext = "시간이 갈수록 편안해요.";
    bad.interestAreas.areas[1].nicknameSubtext =
      "차곡차곡 안정적으로 관리해요.";
    bad.interestAreas.areas[0].oneLineVerdict = "가까워질수록 깊어지는 연애운.";
    bad.interestAreas.areas[1].oneLineVerdict =
      "쌓아 올리는 재물이 꾸준한 재물운.";
    bad.interestAreas.areas[0].body = "함께하는 시간 속에서 진가가 드러나요.";
    bad.interestAreas.areas[1].body = "함께할수록 신뢰가 쌓아가는 흐름이에요.";
    bad.closing.finalNote = "시간이 지날수록 깊어지는 얼굴이에요.";
    expect(() => validateInterestAreas(bad)).toThrow(/시간·축적 은유/);
  });

  it("Phase 11 — nicknameSubtext·finalNote에 긴 구문이 복붙되면 실패", () => {
    const bad = buildValidInterestAreas();
    bad.interestAreas.areas[0].nicknameSubtext =
      "함께할 때 느껴지는 묘한 든든함이 있어요.";
    bad.closing.finalNote =
      "처음엔 모르지만, 함께할 때 느껴지는 묘한 든든함이 인상에 남는 사람이에요.";
    expect(() => validateInterestAreas(bad)).toThrow(/반복됩니다/);
  });
});
