import {
  hasFortuneAccessOf,
  hasFreeAccessOf,
  hasPaidFortuneOf,
} from "../entitlement";
import type { EntitlementSource } from "../entitlement";

const NOW = "2026-10-14T00:00:00.000Z";

const fortune = (
  fortune_type: string,
  paid_at: string | null
): NonNullable<EntitlementSource["fortunes"]>[number] =>
  ({ fortune_type, paid_at }) as NonNullable<
    EntitlementSource["fortunes"]
  >[number];

const access = (
  fortune_type: string,
  expires_at: string | null
): NonNullable<EntitlementSource["profile_free_access"]>[number] =>
  ({ fortune_type, expires_at }) as NonNullable<
    EntitlementSource["profile_free_access"]
  >[number];

describe("엔타이틀먼트 판정", () => {
  it("paid_at이 있는 해당 타입만 결제로 본다", () => {
    const source: EntitlementSource = {
      fortunes: [fortune("lifetime", "2026-10-01T00:00:00Z")],
    };
    expect(hasPaidFortuneOf(source, "lifetime")).toBe(true);
    expect(hasPaidFortuneOf(source, "yearly")).toBe(false);
  });

  it("미결제(paid_at null) 행은 결제가 아니다", () => {
    const source: EntitlementSource = {
      fortunes: [fortune("lifetime", null)],
    };
    expect(hasPaidFortuneOf(source, "lifetime")).toBe(false);
  });

  it("무료 이용권은 만료 전/무기한만 유효하다", () => {
    const source: EntitlementSource = {
      profile_free_access: [
        access("lifetime", null),
        access("yearly", "2026-10-13T00:00:00Z"),
        access("past_life", "2026-10-15T00:00:00Z"),
      ],
    };
    expect(hasFreeAccessOf(source, "lifetime", NOW)).toBe(true);
    expect(hasFreeAccessOf(source, "yearly", NOW)).toBe(false);
    expect(hasFreeAccessOf(source, "past_life", NOW)).toBe(true);
  });

  it("결제 또는 무료 이용권 중 하나면 접근 가능하고, 둘 다 없으면 불가", () => {
    expect(hasFortuneAccessOf({}, "lifetime", NOW)).toBe(false);
    expect(hasFortuneAccessOf(undefined, "lifetime", NOW)).toBe(false);
    expect(
      hasFortuneAccessOf(
        { profile_free_access: [access("lifetime", null)] },
        "lifetime",
        NOW
      )
    ).toBe(true);
  });
});
