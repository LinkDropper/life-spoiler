import {
  formatAttributionForDiscord,
  parseAttributionCookie,
  parseAttributionFromUrl,
  parseVisitorId,
  readAttributionCookies,
  serializeAttribution,
} from "../attribution";
import type { Attribution } from "../attribution";

const NOW = new Date("2026-11-23T03:00:00.000Z");

const buildAttribution = (overrides: Partial<Attribution> = {}) => ({
  utmSource: "x",
  utmMedium: "social",
  utmCampaign: "2026-11-ziwei-intro",
  utmContent: null,
  utmTerm: null,
  landingPath: "/",
  referrerHost: null,
  touchedAt: NOW.toISOString(),
  ...overrides,
});

describe("parseAttributionFromUrl", () => {
  it("utm 파라미터와 랜딩 경로·외부 referrer 호스트를 뽑는다", () => {
    const url = new URL(
      "https://www.life-spoiler.com/compatibility?utm_source=x&utm_medium=social&utm_campaign=2026-11-ziwei-intro&utm_content=a&utm_term=b"
    );

    const attribution = parseAttributionFromUrl({
      url,
      referrer: "https://t.co/abc?x=1",
      now: NOW,
    });

    expect(attribution).toEqual({
      utmSource: "x",
      utmMedium: "social",
      utmCampaign: "2026-11-ziwei-intro",
      utmContent: "a",
      utmTerm: "b",
      landingPath: "/compatibility",
      referrerHost: "t.co",
      touchedAt: NOW.toISOString(),
    });
  });

  it("utm_source/medium/campaign이 모두 없으면 null", () => {
    const url = new URL("https://www.life-spoiler.com/?utm_content=a");

    expect(parseAttributionFromUrl({ url, referrer: null })).toBeNull();
  });

  it("같은 사이트(www 유무 무관) referrer는 남기지 않는다", () => {
    const url = new URL("https://www.life-spoiler.com/?utm_source=x");

    const attribution = parseAttributionFromUrl({
      url,
      referrer: "https://life-spoiler.com/home",
    });

    expect(attribution?.referrerHost).toBeNull();
  });

  it("값이 너무 길면 200자로 자른다", () => {
    const url = new URL(
      `https://www.life-spoiler.com/?utm_campaign=${"a".repeat(500)}`
    );

    const attribution = parseAttributionFromUrl({ url, referrer: null });

    expect(attribution?.utmCampaign).toHaveLength(200);
  });
});

describe("parseAttributionCookie", () => {
  it("직렬화한 값을 그대로 복원한다", () => {
    const attribution = buildAttribution({ referrerHost: "t.co" });

    expect(parseAttributionCookie(serializeAttribution(attribution))).toEqual(
      attribution
    );
  });

  it.each([
    ["빈 값", undefined],
    ["JSON 아님", "not-json"],
    ["배열", "[]"],
    ["touchedAt 누락", JSON.stringify({ utmSource: "x" })],
    ["utm 값 없음", JSON.stringify({ touchedAt: NOW.toISOString() })],
  ])("%s이면 null", (_, value) => {
    expect(parseAttributionCookie(value)).toBeNull();
  });

  it("문자열이 아닌 필드는 null로 버린다", () => {
    const value = JSON.stringify({
      ...buildAttribution(),
      utmMedium: { injected: true },
    });

    expect(parseAttributionCookie(value)?.utmMedium).toBeNull();
  });
});

describe("parseVisitorId", () => {
  it("UUID만 통과시킨다", () => {
    expect(parseVisitorId("0b7c3f1e-2a4d-4c8e-9f10-1234567890ab")).toBe(
      "0b7c3f1e-2a4d-4c8e-9f10-1234567890ab"
    );
    expect(parseVisitorId("'; drop table")).toBeNull();
    expect(parseVisitorId(undefined)).toBeNull();
  });
});

describe("readAttributionCookies", () => {
  it("쿠키에서 유입경로와 방문자 ID를 함께 읽는다", () => {
    const attribution = buildAttribution();
    const cookies: Record<string, string> = {
      ls_attr: serializeAttribution(attribution),
      ls_vid: "0b7c3f1e-2a4d-4c8e-9f10-1234567890ab",
    };

    const result = readAttributionCookies({
      get: (name) => (name in cookies ? { value: cookies[name] } : undefined),
    });

    expect(result).toEqual({
      attribution,
      visitorId: "0b7c3f1e-2a4d-4c8e-9f10-1234567890ab",
    });
  });
});

describe("formatAttributionForDiscord", () => {
  it("유입경로가 없으면 UTM 없음으로 표시한다", () => {
    expect(formatAttributionForDiscord(null, NOW)).toBe(
      "UTM 없음 (직접/미확인)"
    );
  });

  it("source/medium/campaign과 랜딩·경과 시간을 표시한다", () => {
    const attribution = buildAttribution({
      utmContent: "thread-2",
      referrerHost: "t.co",
      touchedAt: "2026-11-21T03:00:00.000Z",
    });

    expect(formatAttributionForDiscord(attribution, NOW)).toBe(
      "`x / social / 2026-11-ziwei-intro`\ncontent: thread-2\n랜딩 / · referrer t.co · 2일 전 유입"
    );
  });

  it("비어 있는 utm 값은 -로 표시한다", () => {
    const attribution = buildAttribution({
      utmMedium: null,
      utmCampaign: null,
      landingPath: null,
      touchedAt: "2026-11-23T02:30:00.000Z",
    });

    expect(formatAttributionForDiscord(attribution, NOW)).toBe(
      "`x / - / -`\n30분 전 유입"
    );
  });
});
