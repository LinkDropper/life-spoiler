import { DailyError } from "../errors";
import {
  DAILY_SERVICE_START_DATE,
  isDateInServiceRange,
  isValidDateString,
  resolveKstDate,
  toKstDateString,
} from "../kst-date";

describe("toKstDateString", () => {
  it("UTC 14:59:59는 같은 날(KST 23:59:59)이다", () => {
    expect(toKstDateString(new Date("2026-10-13T14:59:59.999Z"))).toBe(
      "2026-10-13"
    );
  });

  it("UTC 15:00:00은 KST 다음 날 00:00이다", () => {
    expect(toKstDateString(new Date("2026-10-13T15:00:00.000Z"))).toBe(
      "2026-10-14"
    );
  });

  it("월말 UTC 15:00은 다음 달 1일이 된다", () => {
    expect(toKstDateString(new Date("2026-10-31T15:00:00.000Z"))).toBe(
      "2026-11-01"
    );
  });

  it("연말 UTC 15:00은 다음 해 1월 1일이 된다", () => {
    expect(toKstDateString(new Date("2026-12-31T15:00:00.000Z"))).toBe(
      "2027-01-01"
    );
  });
});

describe("isValidDateString", () => {
  it("실제 존재하는 날짜만 허용한다", () => {
    expect(isValidDateString("2026-10-14")).toBe(true);
    expect(isValidDateString("2028-02-29")).toBe(true);
    expect(isValidDateString("2026-02-29")).toBe(false);
    expect(isValidDateString("2026-13-01")).toBe(false);
    expect(isValidDateString("2026-1-1")).toBe(false);
    expect(isValidDateString("<script>")).toBe(false);
    expect(isValidDateString(undefined)).toBe(false);
  });
});

describe("resolveKstDate", () => {
  const now = new Date("2026-10-13T15:00:00.000Z");

  it("오버라이드가 없으면 KST 오늘을 쓴다", () => {
    expect(resolveKstDate({ now, nodeEnv: "development" })).toBe("2026-10-14");
  });

  it("production에서는 오버라이드를 무시한다", () => {
    expect(
      resolveKstDate({ now, override: "2026-11-01", nodeEnv: "production" })
    ).toBe("2026-10-14");
  });

  it("production이 아니면 오버라이드를 허용한다", () => {
    expect(
      resolveKstDate({ now, override: "2026-11-01", nodeEnv: "development" })
    ).toBe("2026-11-01");
  });

  it("production이 아닐 때 형식이 틀린 오버라이드는 에러로 드러낸다", () => {
    expect(() =>
      resolveKstDate({ now, override: "2026-02-30", nodeEnv: "development" })
    ).toThrow(DailyError);
  });
});

describe("isDateInServiceRange", () => {
  it("서비스 시작일부터 오늘까지만 허용한다", () => {
    expect(isDateInServiceRange(DAILY_SERVICE_START_DATE, "2026-10-20")).toBe(
      true
    );
    expect(isDateInServiceRange("2026-10-20", "2026-10-20")).toBe(true);
    expect(isDateInServiceRange("2026-10-13", "2026-10-20")).toBe(false);
    expect(isDateInServiceRange("2026-10-21", "2026-10-20")).toBe(false);
  });
});
