import { describe, expect, it } from "@jest/globals";

import {
  normalizeBirthTimeForStorage,
  toEngineBirthTime,
  toTimeBranch,
} from "../birth-time";
import { UniverseError } from "../errors";

describe("toTimeBranch", () => {
  it("각 시진 구간의 대표 시각을 올바른 시진으로 변환한다", () => {
    expect(toTimeBranch("00:30")).toBe("자");
    expect(toTimeBranch("01:00")).toBe("축");
    expect(toTimeBranch("03:00")).toBe("인");
    expect(toTimeBranch("12:00")).toBe("오");
    expect(toTimeBranch("21:00")).toBe("해");
  });

  it("자시가 자정을 걸치는 경계를 정확히 처리한다", () => {
    // 자시는 23:00~00:59로 하루를 걸친다. 이 경계가 어긋나면
    // 명궁이 통째로 밀려 모든 판정축이 틀어진다.
    expect(toTimeBranch("22:59")).toBe("해");
    expect(toTimeBranch("23:00")).toBe("자");
    expect(toTimeBranch("23:59")).toBe("자");
    expect(toTimeBranch("00:00")).toBe("자");
    expect(toTimeBranch("00:59")).toBe("자");
    expect(toTimeBranch("01:00")).toBe("축");
  });

  it("Postgres TIME 반환 형태(HH:mm:ss)도 그대로 받는다", () => {
    expect(toTimeBranch("14:30:00")).toBe("미");
  });

  it("형식이 어긋나면 검증 에러를 던진다", () => {
    expect(() => toTimeBranch("25:00")).toThrow(UniverseError);
    expect(() => toTimeBranch("abc")).toThrow(UniverseError);
    expect(() => toTimeBranch("")).toThrow(UniverseError);
  });
});

describe("toEngineBirthTime", () => {
  it("시간 미상이면 unknown을 넘겨 엔진이 시진을 전수 열거하게 한다", () => {
    expect(toEngineBirthTime(null, true)).toBe("unknown");
  });

  it("시간을 알면 시진으로 변환한다", () => {
    expect(toEngineBirthTime("14:30:00", false)).toBe("미");
  });

  it("시간 미상이 아닌데 값이 없으면 기본값으로 덮지 않고 드러낸다", () => {
    // 기본 시각을 대입하면 틀린 명궁이 틀린 주성으로 연쇄되어
    // "틀린 값을 확신 있게" 제시하게 된다.
    expect(() => toEngineBirthTime(null, false)).toThrow(UniverseError);
  });
});

describe("normalizeBirthTimeForStorage", () => {
  it("시간 미상이면 null로 저장한다", () => {
    expect(normalizeBirthTimeForStorage("14:30", true)).toBeNull();
    expect(normalizeBirthTimeForStorage(undefined, true)).toBeNull();
  });

  it("HH:mm으로 통일해 저장한다", () => {
    expect(normalizeBirthTimeForStorage("14:30", false)).toBe("14:30");
    expect(normalizeBirthTimeForStorage("14:30:00", false)).toBe("14:30");
  });

  it("시간 미상이 아닌데 값이 없거나 형식이 틀리면 에러", () => {
    expect(() => normalizeBirthTimeForStorage(undefined, false)).toThrow(
      UniverseError
    );
    expect(() => normalizeBirthTimeForStorage("99:99", false)).toThrow(
      UniverseError
    );
  });
});
