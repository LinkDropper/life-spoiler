import { hasKoreanBatchim, pickParticle } from "../text";

describe("hasKoreanBatchim", () => {
  it("마지막 글자의 받침을 본다", () => {
    expect(hasKoreanBatchim("태음")).toBe(true);
    expect(hasKoreanBatchim("천부")).toBe(false);
    expect(hasKoreanBatchim("칠살")).toBe(true);
  });

  it("한글이 아니면 false", () => {
    expect(hasKoreanBatchim("Ziwei")).toBe(false);
    expect(hasKoreanBatchim("")).toBe(false);
  });
});

describe("pickParticle", () => {
  it("받침에 따라 조사를 고른다", () => {
    expect(pickParticle("태음", "이에요", "예요")).toBe("이에요");
    expect(pickParticle("천부", "이에요", "예요")).toBe("예요");
    expect(pickParticle("염정", "과", "와")).toBe("과");
    expect(pickParticle("자미", "과", "와")).toBe("와");
  });
});
