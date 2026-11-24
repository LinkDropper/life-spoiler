import { pickDefaultProfile, resolveSelectedProfile } from "../selection";
import type { ProfileWithFortunes } from "../types";

const profile = (id: string, created_at: string): ProfileWithFortunes =>
  ({ id, created_at }) as ProfileWithFortunes;

// API 응답 순서(created_at 내림차순)를 그대로 흉내 낸다
const PROFILES = [
  profile("family", "2026-09-01T00:00:00Z"),
  profile("friend", "2026-08-01T00:00:00Z"),
  profile("me", "2026-07-01T00:00:00Z"),
];

describe("홈 선택 프로필", () => {
  it("기본값은 목록 순서와 무관하게 가장 먼저 만든 프로필이다", () => {
    expect(pickDefaultProfile(PROFILES)?.id).toBe("me");
  });

  it("기억된 선택이 유효하면 그 프로필을 쓴다", () => {
    expect(resolveSelectedProfile(PROFILES, "friend")?.id).toBe("friend");
  });

  it("기억된 프로필이 삭제됐거나 다른 계정 것이면 기본값으로 돌아간다", () => {
    expect(resolveSelectedProfile(PROFILES, "deleted")?.id).toBe("me");
  });

  it("기억된 선택이 없으면 기본값이다", () => {
    expect(resolveSelectedProfile(PROFILES, null)?.id).toBe("me");
  });

  it("프로필이 없으면 선택도 없다", () => {
    expect(resolveSelectedProfile([], "me")).toBeUndefined();
  });
});
