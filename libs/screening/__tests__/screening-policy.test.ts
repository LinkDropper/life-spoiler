import {
  SCREENING_TIMELINE,
  getMinimumScreeningMs,
  isScreeningDestination,
  parseScreeningDestination,
  isPlainLeftClick,
  toPathname,
} from "../screening-policy";

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

describe("오늘의 운세·작품 판별", () => {
  it("오늘의 운세도 운세를 보러 가는 이동이다", () => {
    expect(isScreeningDestination("/fortune/daily/abc")).toBe(true);
  });

  it("경로에서 어떤 운세인지, 예고편인지 알아낸다", () => {
    expect(parseScreeningDestination("/fortune/yearly/preview/abc")).toEqual({
      kind: "yearly",
      isPreview: true,
    });
    expect(parseScreeningDestination("/fortune/past-life/abc?tab=1")).toEqual({
      kind: "pastLife",
      isPreview: false,
    });
    expect(parseScreeningDestination("/fortune/yearly_2027/abc")).toEqual({
      kind: "yearly2027",
      isPreview: false,
    });
    expect(parseScreeningDestination("/fortune/daily/abc")).toEqual({
      kind: "daily",
      isPreview: false,
    });
    expect(
      parseScreeningDestination("/compatibility/abc/fortune/preview")
    ).toEqual({ kind: "compatibility", isPreview: true });
    expect(parseScreeningDestination("/payment/lifetime/abc")).toBeNull();
  });
});
