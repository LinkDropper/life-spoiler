import { splitArticleTitle } from "../article-title";

describe("splitArticleTitle", () => {
  it("KO/EN/JA 조항 제목을 번호와 이름으로 나눈다", () => {
    expect(splitArticleTitle("제1조 (목적)")).toEqual({
      number: "제1조",
      name: "목적",
    });
    expect(splitArticleTitle("Article 6 (Withdrawal and Refund)")).toEqual({
      number: "Article 6",
      name: "Withdrawal and Refund",
    });
    expect(splitArticleTitle("第1条（目的）")).toEqual({
      number: "第1条",
      name: "目的",
    });
  });

  it("꼴이 다르면 제목 전체를 이름으로 둔다", () => {
    expect(splitArticleTitle("부칙")).toEqual({ number: null, name: "부칙" });
  });
});
