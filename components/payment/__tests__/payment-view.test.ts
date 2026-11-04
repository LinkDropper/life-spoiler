import {
  formatPaymentAmount,
  getProductNameKey,
  isPaymentFortuneType,
  resolveAmountDisplay,
} from "../payment-view";

describe("resolveAmountDisplay", () => {
  it("할인이 없으면 정가만 보여 준다", () => {
    expect(
      resolveAmountDisplay({
        isForeign: false,
        firstPaymentApplied: false,
        couponApplied: false,
      })
    ).toEqual({ originalAmount: null, amount: 990, benefit: null });
  });

  it("첫 결제 이벤트는 정가에 취소선을 긋고 100원을 보여 준다", () => {
    expect(
      resolveAmountDisplay({
        isForeign: false,
        firstPaymentApplied: true,
        couponApplied: false,
      })
    ).toEqual({ originalAmount: 990, amount: 100, benefit: "firstPayment" });
  });

  it("쿠폰이 적용되면 이벤트 여부와 무관하게 정가 -> 0원이다", () => {
    expect(
      resolveAmountDisplay({
        isForeign: false,
        firstPaymentApplied: true,
        couponApplied: true,
      })
    ).toEqual({ originalAmount: 990, amount: 0, benefit: "coupon" });
  });

  it("해외 로케일은 달러 정가이고 첫 결제 이벤트가 적용되지 않는다", () => {
    expect(
      resolveAmountDisplay({
        isForeign: true,
        firstPaymentApplied: true,
        couponApplied: false,
      })
    ).toEqual({ originalAmount: null, amount: 0.99, benefit: null });
  });

  it("해외 로케일 쿠폰은 $0.99 -> $0이다", () => {
    expect(
      resolveAmountDisplay({
        isForeign: true,
        firstPaymentApplied: false,
        couponApplied: true,
      })
    ).toEqual({ originalAmount: 0.99, amount: 0, benefit: "coupon" });
  });
});

describe("formatPaymentAmount", () => {
  it("국내 금액은 천 단위 구분과 접미사를 붙인다", () => {
    expect(formatPaymentAmount(1990, false, "원")).toBe("1,990원");
    expect(formatPaymentAmount(0, false, "원")).toBe("0원");
  });

  it("해외 금액은 소수점 둘째 자리까지 달러로 쓴다", () => {
    expect(formatPaymentAmount(0.99, true, "")).toBe("$0.99");
    expect(formatPaymentAmount(0, true, "")).toBe("$0.00");
  });
});

describe("isPaymentFortuneType", () => {
  it("결제 가능한 운세 유형만 통과시킨다", () => {
    expect(isPaymentFortuneType("past_life")).toBe(true);
    expect(isPaymentFortuneType("compatibility")).toBe(true);
    expect(isPaymentFortuneType("daily")).toBe(false);
    expect(isPaymentFortuneType(null)).toBe(false);
  });
});

describe("getProductNameKey", () => {
  it("운세 유형별 상품명 키를 돌려준다", () => {
    expect(getProductNameKey("yearly")).toBe("productNameYearly");
    expect(getProductNameKey("yearly_2027")).toBe("productNameYearly2027");
    expect(getProductNameKey("past_life")).toBe("productNamePastLife");
    expect(getProductNameKey("compatibility")).toBe("productNameCompatibility");
    expect(getProductNameKey("lifetime")).toBe("productNameLifetime");
  });
});
