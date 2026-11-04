import {
  SCREENING_TIMELINE,
  decideScreeningVariant,
  getMinimumScreeningMs,
  isScreeningDestination,
  isPlainLeftClick,
  toPathname,
} from "../screening-policy";

const env = (overrides = {}) => ({
  hasScreenedThisSession: false,
  prefersReducedMotion: false,
  ...overrides,
});

describe("decideScreeningVariant", () => {
  it("모션 줄이기면 어떤 진입이든 연출 없음", () => {
    expect(
      decideScreeningVariant("ticket", env({ prefersReducedMotion: true }))
    ).toBe("none");
    expect(
      decideScreeningVariant("hero", env({ prefersReducedMotion: true }))
    ).toBe("none");
  });

  it("관람권은 누를 때마다 약식", () => {
    expect(decideScreeningVariant("ticket", env())).toBe("short");
    expect(
      decideScreeningVariant("ticket", env({ hasScreenedThisSession: true }))
    ).toBe("short");
  });

  it("본편 다시 보기·시간표는 세션 첫 회만 약식, 이후 바로 이동", () => {
    expect(decideScreeningVariant("hero", env())).toBe("short");
    expect(
      decideScreeningVariant("timetable", env({ hasScreenedThisSession: true }))
    ).toBe("none");
  });
});

describe("SCREENING_TIMELINE", () => {
  it("준비가 바로 끝나면 1.2초 안에 끝난다 (일부러 붙잡지 않는다)", () => {
    expect(getMinimumScreeningMs(SCREENING_TIMELINE)).toBeLessThanOrEqual(1200);
  });

  it("이동은 오버레이가 다 덮인 뒤, 걷히기 전에 시작한다", () => {
    expect(SCREENING_TIMELINE.navigateAt).toBeGreaterThanOrEqual(
      SCREENING_TIMELINE.fadeInMs
    );
    expect(SCREENING_TIMELINE.navigateAt).toBeLessThan(
      SCREENING_TIMELINE.readyAt
    );
  });

  it("타이틀은 걷히기 전에 뜬다", () => {
    expect(SCREENING_TIMELINE.projectorAt).toBeLessThanOrEqual(
      SCREENING_TIMELINE.titleAt
    );
    expect(SCREENING_TIMELINE.titleAt).toBeLessThan(SCREENING_TIMELINE.readyAt);
  });
});

describe("isPlainLeftClick / toPathname", () => {
  const click = (overrides = {}) => ({
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    defaultPrevented: false,
    ...overrides,
  });

  it("수정 키나 가운데 클릭은 가로채지 않는다", () => {
    expect(isPlainLeftClick(click())).toBe(true);
    expect(isPlainLeftClick(click({ metaKey: true }))).toBe(false);
    expect(isPlainLeftClick(click({ ctrlKey: true }))).toBe(false);
    expect(isPlainLeftClick(click({ button: 1 }))).toBe(false);
  });

  it("쿼리·해시를 뗀 경로", () => {
    expect(toPathname("/fortune/yearly/preview/abc?x=1#top")).toBe(
      "/fortune/yearly/preview/abc"
    );
  });
});

describe("isScreeningDestination", () => {
  it("운세 예고편·본편으로 갈 때만 상영관 입장을 쓴다", () => {
    expect(isScreeningDestination("/fortune/lifetime/abc")).toBe(true);
    expect(isScreeningDestination("/fortune/yearly/preview/abc")).toBe(true);
    expect(isScreeningDestination("/fortune/past-life/preview/abc?x=1")).toBe(
      true
    );
    expect(isScreeningDestination("/fortune/yearly_2027/abc")).toBe(true);
    expect(isScreeningDestination("/compatibility/abc/fortune/preview")).toBe(
      true
    );
    expect(isScreeningDestination("/compatibility/abc/fortune/result")).toBe(
      true
    );
  });

  it("그 밖의 로딩 화면에는 쓰지 않는다", () => {
    expect(isScreeningDestination("/fortune/daily/abc")).toBe(false);
    expect(isScreeningDestination("/fortune/lifetime/share/abc")).toBe(false);
    expect(isScreeningDestination("/compatibility")).toBe(false);
    expect(isScreeningDestination("/compatibility/abc/fortune/share")).toBe(
      false
    );
    expect(isScreeningDestination("/face-spoiler/profiles")).toBe(false);
    expect(isScreeningDestination("/profile/setup")).toBe(false);
    expect(isScreeningDestination("/universe/create")).toBe(false);
  });
});
