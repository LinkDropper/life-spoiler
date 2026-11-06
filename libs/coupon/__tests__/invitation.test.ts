import {
  formatInvitationDate,
  getInvitationHref,
  sortInvitations,
  type CouponInvitation,
} from "../invitation";

const coupon = (
  id: string,
  status: CouponInvitation["status"]
): CouponInvitation => ({
  id,
  code: `CODE-${id}`,
  benefitType: "free_fortune",
  fortuneType: "lifetime",
  discountPercent: null,
  status,
  validUntil: null,
  campaignName: null,
  createdAt: "2026-11-01T00:00:00Z",
});

describe("sortInvitations", () => {
  it("쓸 수 있는 초대장부터, 같은 상태는 원래 순서", () => {
    const sorted = sortInvitations([
      coupon("1", "used"),
      coupon("2", "active"),
      coupon("3", "expired"),
      coupon("4", "active"),
    ]);
    expect(sorted.map((item) => item.id)).toEqual(["2", "4", "1", "3"]);
  });
});

describe("getInvitationHref", () => {
  it("운세마다 입구로 보낸다", () => {
    expect(getInvitationHref("past_life")).toBe("/profiles?type=past-life");
    expect(getInvitationHref("compatibility")).toBe("/compatibility");
    expect(getInvitationHref("all")).toBe("/home");
  });

  it("모르는 운세는 홈으로", () => {
    expect(getInvitationHref("face")).toBe("/home");
  });
});

describe("formatInvitationDate", () => {
  it("날짜를 점으로 잇고, 없거나 잘못되면 null", () => {
    expect(formatInvitationDate("2026-12-31T00:00:00")).toBe("2026.12.31");
    expect(formatInvitationDate(null)).toBeNull();
    expect(formatInvitationDate("not-a-date")).toBeNull();
  });
});
