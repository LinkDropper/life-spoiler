import { buildAccessLogRow } from "../access-log";

const VISITOR_ID = "0b7c3f1e-2a4d-4c8e-9f10-1234567890ab";

const buildParams = (
  overrides: Partial<Parameters<typeof buildAccessLogRow>[0]> = {}
) => ({
  url: new URL("https://www.life-spoiler.com/home"),
  referrer: null,
  visitorId: VISITOR_ID,
  isNewVisitor: false,
  locale: "ko",
  rawDeviceType: undefined,
  country: "KR",
  ...overrides,
});

describe("buildAccessLogRow", () => {
  it("경로·로케일·국가·기기 종류를 담는다", () => {
    expect(buildAccessLogRow(buildParams())).toEqual({
      visitor_id: VISITOR_ID,
      is_new_visitor: false,
      path: "/home",
      referrer_host: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      locale: "ko",
      device_type: "desktop",
      country: "KR",
    });
  });

  it("쿼리스트링은 버리고 utm_* 값만 남긴다", () => {
    const row = buildAccessLogRow(
      buildParams({
        url: new URL(
          "https://www.life-spoiler.com/?utm_source=youtube&utm_medium=social&utm_campaign=2026-11-test&email=a@b.com"
        ),
        isNewVisitor: true,
      })
    );

    expect(row).toMatchObject({
      path: "/",
      is_new_visitor: true,
      utm_source: "youtube",
      utm_medium: "social",
      utm_campaign: "2026-11-test",
    });
    expect(JSON.stringify(row)).not.toContain("a@b.com");
  });

  it("외부 referrer는 호스트만, 같은 사이트 referrer는 남기지 않는다", () => {
    expect(
      buildAccessLogRow(
        buildParams({ referrer: "https://www.youtube.com/watch?v=abc" })
      ).referrer_host
    ).toBe("www.youtube.com");
    expect(
      buildAccessLogRow(
        buildParams({ referrer: "https://life-spoiler.com/compatibility" })
      ).referrer_host
    ).toBeNull();
  });

  it.each([
    ["mobile", "mobile"],
    ["tablet", "tablet"],
    [undefined, "desktop"],
    ["smarttv", "desktop"],
  ])("기기 종류 %s → %s", (rawDeviceType, expected) => {
    expect(buildAccessLogRow(buildParams({ rawDeviceType })).device_type).toBe(
      expected
    );
  });

  it("국가·로케일 헤더가 없으면 null", () => {
    const row = buildAccessLogRow(buildParams({ country: null, locale: null }));

    expect(row.country).toBeNull();
    expect(row.locale).toBeNull();
  });
});
