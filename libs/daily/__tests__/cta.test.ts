import { resolveDailyCta } from "../cta";

describe("resolveDailyCta", () => {
  it("인생운세 미구매면 인생운세 CTA", () => {
    expect(
      resolveDailyCta({ cautionCategory: "money", hasLifetime: false })
    ).toEqual({ category: "money", product: "lifetime" });
  });

  it("인생운세 구매자면 올해운세/궁합 링크로 대체", () => {
    expect(
      resolveDailyCta({ cautionCategory: "work", hasLifetime: true })
    ).toEqual({ category: "work", product: "yearly_compatibility" });
  });

  it("건강이 주의 포인트여도 CTA는 건강 카테고리에 묶이지 않는다", () => {
    expect(
      resolveDailyCta({ cautionCategory: "health", hasLifetime: false })
    ).toEqual({ category: "overall", product: "lifetime" });
    expect(
      resolveDailyCta({ cautionCategory: "health", hasLifetime: true })
    ).toEqual({ category: "overall", product: "yearly_compatibility" });
  });
});
