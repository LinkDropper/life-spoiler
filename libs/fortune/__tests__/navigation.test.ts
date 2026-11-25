import {
  getFortuneHref,
  getProfileSetupHref,
  isFortuneRouteType,
  toDbFortuneType,
} from "../navigation";
import type { EntitlementSource } from "../entitlement";

type Fortune = NonNullable<EntitlementSource["fortunes"]>[number];
type FreeAccess = NonNullable<EntitlementSource["profile_free_access"]>[number];

const paid = (fortune_type: string): Fortune =>
  ({ fortune_type, paid_at: "2026-10-01T00:00:00Z" }) as Fortune;

const freeAccess = (fortune_type: string): FreeAccess =>
  ({ fortune_type, expires_at: null }) as FreeAccess;

const profile = (
  fortunes: Fortune[] = [],
  profile_free_access: FreeAccess[] = []
) => ({ id: "p1", fortunes, profile_free_access });

describe("운세 경로 결정", () => {
  it("결제한 운세는 본편으로 바로 간다", () => {
    expect(getFortuneHref(profile([paid("lifetime")]), "lifetime")).toBe(
      "/fortune/lifetime/p1"
    );
  });

  it("결제하지 않은 운세는 예고편으로 간다", () => {
    expect(getFortuneHref(profile([paid("lifetime")]), "yearly")).toBe(
      "/fortune/yearly/preview/p1"
    );
  });

  it("무료 이용권이 있으면 본편으로 간다", () => {
    expect(
      getFortuneHref(profile([], [freeAccess("yearly_2027")]), "yearly_2027")
    ).toBe("/fortune/yearly_2027/p1");
  });

  it("전생은 경로는 past-life, 결제 판정은 DB 값 past_life로 한다", () => {
    expect(toDbFortuneType("past-life")).toBe("past_life");
    expect(getFortuneHref(profile([paid("past_life")]), "past-life")).toBe(
      "/fortune/past-life/p1"
    );
  });

  it("오늘의 운세는 무료라 결과로 직행한다", () => {
    expect(getFortuneHref(profile(), "daily")).toBe("/fortune/daily/p1");
  });

  it("프로필이 없으면 운세 이름을 붙여 프로필 입력으로 보낸다", () => {
    expect(getProfileSetupHref("yearly")).toBe("/profile/setup?type=yearly");
    expect(getProfileSetupHref()).toBe("/profile/setup");
  });

  it("알 수 없는 type 파라미터는 운세 종류로 받지 않는다", () => {
    expect(isFortuneRouteType("past-life")).toBe(true);
    expect(isFortuneRouteType("past_life")).toBe(false);
    expect(isFortuneRouteType(null)).toBe(false);
  });
});
