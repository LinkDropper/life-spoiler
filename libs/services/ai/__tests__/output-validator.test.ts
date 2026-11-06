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

    expect(violations).toEqual([
      { code: "META_PHRASE", match: "참고용입니다", path: "oneLiner" },
    ]);
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
  it("걸린 표현을 중복 없이 나열한다", () => {
    const feedback = buildViolationFeedback([
      { code: "FORBIDDEN_TERM", match: "자미", path: "a" },
      { code: "FORBIDDEN_TERM", match: "자미", path: "b" },
    ]);

    expect(feedback).toContain('"자미"');
    expect(feedback.match(/자미/g)).toHaveLength(1);
  });
});
