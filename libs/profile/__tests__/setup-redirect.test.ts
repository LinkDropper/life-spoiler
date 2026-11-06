import { NEW_PROFILE_TOKEN, getProfileSetupRedirect } from "../setup-redirect";

describe("getProfileSetupRedirect", () => {
  it("홈에서 왔으면 새 프로필을 고른 홈으로 돌아간다", () => {
    expect(getProfileSetupRedirect("/home", null, "p-1")).toBe(
      "/home?profile=p-1"
    );
  });

  it("다른 내부 경로는 그대로 쓴다", () => {
    expect(getProfileSetupRedirect("/fortune/daily", null, "p-1")).toBe(
      "/fortune/daily"
    );
  });

  it("외부로 새는 주소는 받지 않는다", () => {
    expect(getProfileSetupRedirect("//evil.com", null, "p-1")).toBe(
      "/profiles"
    );
    expect(getProfileSetupRedirect("https://evil.com", "yearly", "p-1")).toBe(
      "/profiles?type=yearly"
    );
  });

  it("redirect가 없으면 운세 종류에 맞는 프로필 목록으로 간다", () => {
    expect(getProfileSetupRedirect(null, "lifetime", "p-1")).toBe(
      "/profiles?type=lifetime"
    );
    expect(getProfileSetupRedirect(null, null, "p-1")).toBe("/profiles");
  });
});

describe("getProfileSetupRedirect · 새 프로필 자리", () => {
  it("redirect 안의 자리를 방금 만든 프로필 id로 바꾼다", () => {
    expect(
      getProfileSetupRedirect(
        `/compatibility/setup?a=p1&b=${NEW_PROFILE_TOKEN}`,
        null,
        "p2"
      )
    ).toBe("/compatibility/setup?a=p1&b=p2");
  });
});
