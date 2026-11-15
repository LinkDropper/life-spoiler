import {
  buildLockedQuestions,
  getCareerFields,
  getPartner,
  getVisibleTiming,
  toTimingRows,
} from "../lifetime-extras";

const partner = {
  traits: ["책임감이 강한 사람"],
  role: "큰 결정을 이끄는 쪽이에요.",
  meetingPaths: ["선배의 소개"],
};

describe("getVisibleTiming", () => {
  it("구 결과(타이밍 없음)는 빈 배열", () => {
    expect(getVisibleTiming(undefined)).toEqual([]);
  });

  it("후보도 조심할 해도 없는 주제는 뺀다", () => {
    expect(
      getVisibleTiming([
        { topic: "move", likely: [] },
        {
          topic: "love",
          likely: [{ year: 2029, reason: "공식화하기 쉬워요" }],
        },
      ]).map((t) => t.topic)
    ).toEqual(["love"]);
  });

  it("이유가 빈 연도는 빼고, 그래서 비게 된 주제도 뺀다", () => {
    expect(
      getVisibleTiming([
        {
          topic: "career",
          likely: [{ year: 2029, reason: "" }],
          caution: { year: 2031, reason: " " },
        },
      ])
    ).toEqual([]);
  });

  it("조심할 해만 있어도 주제를 남기고, 주제 순서는 연애·일·이사", () => {
    expect(
      getVisibleTiming([
        { topic: "move", likely: [{ year: 2030, reason: "이동" }] },
        {
          topic: "career",
          likely: [],
          caution: { year: 2033, reason: "마감 부담" },
        },
      ]).map((t) => t.topic)
    ).toEqual(["career", "move"]);
  });
});

describe("toTimingRows", () => {
  it("가능성이 높은 해와 조심할 해를 연도순으로 합친다", () => {
    expect(
      toTimingRows({
        topic: "career",
        likely: [
          { year: 2035, reason: "c" },
          { year: 2029, reason: "a" },
        ],
        caution: { year: 2033, reason: "b" },
      }).map((r) => [r.year, r.kind])
    ).toEqual([
      [2029, "likely"],
      [2033, "caution"],
      [2035, "likely"],
    ]);
  });
});

describe("getCareerFields / getPartner", () => {
  it("없거나 빈 값이면 그리지 않는다", () => {
    expect(getCareerFields({})).toEqual([]);
    expect(
      getCareerFields({ categories: { career: { fields: ["", " "] } } })
    ).toEqual([]);
    expect(getPartner({})).toBeNull();
    expect(
      getPartner({
        categories: { relationship: { partner: { ...partner, role: "" } } },
      })
    ).toBeNull();
    expect(
      getPartner({
        categories: {
          relationship: { partner: { ...partner, meetingPaths: [] } },
        },
      })
    ).toBeNull();
  });

  it("값이 있으면 그대로 돌려준다", () => {
    expect(
      getCareerFields({ categories: { career: { fields: ["기획"] } } })
    ).toEqual(["기획"]);
    expect(getPartner({ categories: { relationship: { partner } } })).toEqual(
      partner
    );
  });
});

describe("buildLockedQuestions", () => {
  it("구 결과는 잠금 질문이 없다 (섹션 자체를 그리지 않음)", () => {
    expect(buildLockedQuestions({})).toEqual([]);
  });

  it("데이터가 있는 질문만, 개수는 실제 데이터 기준", () => {
    expect(
      buildLockedQuestions({
        timing: [
          { topic: "love", likely: [{ year: 2029, reason: "a" }] },
          {
            topic: "career",
            likely: [
              { year: 2029, reason: "b" },
              { year: 2032, reason: "c" },
            ],
            caution: { year: 2033, reason: "d" },
          },
          { topic: "move", likely: [] },
        ],
        categories: {
          career: { fields: ["기획", "운영"] },
          relationship: { partner },
        },
      })
    ).toEqual([
      { kind: "timing", topic: "love", count: 1 },
      { kind: "timing", topic: "career", count: 2 },
      { kind: "caution", topic: "career" },
      { kind: "fields", count: 2 },
      { kind: "partner" },
    ]);
  });
});
