import {
  buildViolationFeedback,
  findOutputViolations,
} from "../output-validator";

describe("findOutputViolations", () => {
  it("운영에서 실제로 노출된 별 이름을 잡는다", () => {
    const output = {
      headline: "💫 느리게 열리나 깊게 남는 인연",
      subSections: [
        {
          heading: "마음의 결",
          body: "**자미**의 품위와 **칠살**의 결단이 함께 있어, 마음을 쉽게 내주지 않아요.",
        },
      ],
    };

    const violations = findOutputViolations(output, "ko");

    expect(violations.map((v) => v.match)).toEqual(["자미", "칠살"]);
    expect(violations[0]).toMatchObject({
      code: "FORBIDDEN_TERM",
      path: "subSections.0.body",
    });
  });

  it("궁 이름과 사화 용어를 잡는다", () => {
    const violations = findOutputViolations(
      { body: "재백궁에 화기가 걸려 있어요." },
      "ko"
    );

    expect(violations.map((v) => v.match)).toEqual(["재백궁", "화기"]);
  });

  it.each([
    "천부적인 감각이 있어요.",
    "천기누설 같은 직감이 와요.",
    "거문고처럼 낮게 울리는 목소리예요.",
    "화기애애한 자리에서 힘이 나요.",
    "소화기가 예민하게 반응해요.",
    "서양인 친구와 잘 맞아요.",
    "태양처럼 드러나는 사람이에요.",
    "올해 대운이 들어온다는 느낌이에요.",
    "유년 시절의 기억이 오래가요.",
  ])("일상 표현은 통과시킨다: %s", (body) => {
    expect(findOutputViolations({ body }, "ko")).toEqual([]);
  });

  it("나이 구간(period) 필드는 검사하지 않는다", () => {
    expect(
      findOutputViolations({ ageScenarios: [{ period: "명궁" }] }, "ko")
    ).toEqual([]);
  });

  it("메타 문구를 잡는다", () => {
    const violations = findOutputViolations(
      { oneLiner: "운세는 참고용입니다." },
      "ko"
    );

    expect(violations).toContainEqual({
      code: "META_PHRASE",
      match: "참고용입니다",
      path: "oneLiner",
    });
  });

  it("KO 본문의 '~니다' 끝맺음을 잡는다", () => {
    const violations = findOutputViolations(
      {
        subSections: [{ heading: "돈", body: "꼼꼼하게 모읍니다. 잘 써요." }],
      },
      "ko"
    );

    expect(violations).toEqual([
      {
        code: "FORMAL_ENDING",
        match: "모읍니다",
        path: "subSections.0.body",
      },
    ]);
  });

  it("해요체와 '~니다'가 아닌 말은 잡지 않는다", () => {
    expect(
      findOutputViolations({ body: "편해요. 니다라는 말은 없어요." }, "ko")
    ).toEqual([]);
    expect(findOutputViolations({ body: "Keep it simple." }, "en")).toEqual([]);
  });

  it("KO 본문에서 손님을 3인칭으로 가리키는 말을 잡는다", () => {
    const violations = findOutputViolations(
      {
        subSections: [
          { heading: "연락", body: "그래서 이 사람은 늦게 터져요." },
          { heading: "표현", body: "이런 분은 먼저 챙겨요. 이분이 편해요." },
        ],
        oneLiner: "결국 이 타입이에요.",
      },
      "ko"
    );

    expect(violations.filter((v) => v.code === "THIRD_PERSON")).toHaveLength(4);
  });

  it("3인칭 지칭과 겹치는 일상 표현은 잡지 않는다", () => {
    const violations = findOutputViolations(
      {
        body: "이런 분위기에서는 이 사람 저 사람 챙기다 이분법으로 나누지 않아요. 직설이 사람 사이를 건드려요.",
      },
      "ko"
    );

    expect(violations.filter((v) => v.code === "THIRD_PERSON")).toEqual([]);
  });

  it("KO 추상어를 잡는다", () => {
    const violations = findOutputViolations(
      {
        body: "말을 듣는 흐름이 생기고 존재감이 또렷해요. 말의 온도를 낮추면 더 멀리 가요. 체온도 높아요.",
      },
      "ko"
    );

    expect(
      violations.filter((v) => v.code === "ABSTRACT_WORD").map((v) => v.match)
    ).toEqual(["흐름", "존재감", "온도", "멀리 가"]);
  });

  it("유형 꼬리표는 모두, 판정 맺음은 섹션에 세 번째부터 잡는다", () => {
    const violations = findOutputViolations(
      {
        subSections: [
          { heading: "하나", body: "챙기는 사람이에요. 그런 타입이에요." },
          { heading: "둘", body: "먼저 묻는 사람이에요." },
          { heading: "셋", body: "늦게 서운한 사람이에요." },
        ],
      },
      "ko"
    );

    expect(
      violations
        .filter((v) => v.code === "REPEATED_JUDGMENT")
        .map((v) => [v.match, v.path])
    ).toEqual([
      ["타입이에요", "subSections.0.body"],
      ["사람이에요", "subSections.2.body"],
    ]);
  });

  it("브랜드 금지 표현과 느낌표·물음표 연속을 잡는다", () => {
    const violations = findOutputViolations(
      { headline: "소름 돋는 재물운!!", oneLiner: "대박 나요" },
      "ko"
    );

    expect(violations.map((v) => v.match)).toEqual(
      expect.arrayContaining(["소름 돋는", "!!", "대박"])
    );
    expect(violations.every((v) => v.code === "BANNED_PHRASE")).toBe(true);
  });

  it("영어·일본어 용어를 잡는다", () => {
    expect(
      findOutputViolations({ body: "Your Wealth Palace holds Wu Qu." }, "en")
        .map((v) => v.match)
        .sort()
    ).toEqual(["Wealth Palace", "Wu Qu"]);
    expect(
      findOutputViolations({ body: "財帛宮に化忌があります" }, "ja").map(
        (v) => v.match
      )
    ).toEqual(["財帛宮", "化忌"]);
  });
});

describe("buildViolationFeedback", () => {
  it("KO 피드백은 해요체 한국어로 위반 종류별로 짚는다", () => {
    const feedback = buildViolationFeedback(
      [
        { code: "FORBIDDEN_TERM", match: "천동", path: "a" },
        { code: "FORMAL_ENDING", match: "모읍니다", path: "b" },
      ],
      "ko"
    );
    expect(feedback).toContain('"천동"');
    expect(feedback).toContain('"모읍니다"');
    expect(feedback).toContain("해요체");
    expect(feedback).not.toContain("Rewrite");
  });

  it("걸린 표현을 중복 없이 나열한다", () => {
    const feedback = buildViolationFeedback([
      { code: "FORBIDDEN_TERM", match: "자미", path: "a" },
      { code: "FORBIDDEN_TERM", match: "자미", path: "b" },
    ]);

    expect(feedback).toContain('"자미"');
    expect(feedback.match(/자미/g)).toHaveLength(1);
  });
});
