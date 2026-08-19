import { describe, expect, it } from "@jest/globals";

import { getStarPlacement, getStarVisual } from "../star-visual";

describe("getStarVisual", () => {
  it("정의역 하한/상한에서 designer 확정 수치표와 일치한다", () => {
    expect(getStarVisual(12)).toEqual({
      diameterPx: 10,
      coreOpacity: 0.55,
      glowBlurPx: 4,
      glowSpreadPx: 0,
      glowAlpha: 0.25,
    });

    expect(getStarVisual(99)).toEqual({
      diameterPx: 32,
      coreOpacity: 1,
      // 55~80 구간 변별력을 직경이 아니라 glow로 옮겨 blur 상한을 20 → 28로 넓혔다.
      // 직경을 키우면 겹칠 때 렌더링 버그처럼 보이지만 glow가 겹치는 건 성운처럼 읽힌다.
      glowBlurPx: 28,
      glowSpreadPx: 4,
      glowAlpha: 0.7,
    });
  });

  it("직경은 동결이고 glow만 넓어졌다", () => {
    // 직경이 바뀌면 배치 겹침 계산이 통째로 무효가 되므로 회귀를 여기서 잡는다.
    expect(getStarVisual(12).diameterPx).toBe(10);
    expect(getStarVisual(99).diameterPx).toBe(32);
    expect(getStarVisual(12).glowBlurPx).toBe(4);
    expect(getStarVisual(99).glowBlurPx).toBe(28);
  });

  it("tier 경계 대표값이 확정 수치표와 일치한다", () => {
    expect(getStarVisual(41).diameterPx).toBe(14);
    expect(getStarVisual(58).diameterPx).toBe(18);
    expect(getStarVisual(77).diameterPx).toBe(24);
    expect(getStarVisual(89).diameterPx).toBe(28);
  });

  it("정의역 밖 점수는 clamp한다", () => {
    expect(getStarVisual(0)).toEqual(getStarVisual(12));
    expect(getStarVisual(100)).toEqual(getStarVisual(99));
  });

  it("점수가 높을수록 별이 단조 증가한다", () => {
    // 크기가 서사이므로 역전이 생기면 낮은 점수가 더 커 보인다.
    let previous = 0;
    for (let score = 12; score <= 99; score += 1) {
      const { diameterPx } = getStarVisual(score);
      expect(diameterPx).toBeGreaterThanOrEqual(previous);
      previous = diameterPx;
    }
  });

  it("소유자 별(44px)보다 항상 작다", () => {
    for (let score = 12; score <= 99; score += 1) {
      expect(getStarVisual(score).diameterPx).toBeLessThan(44);
    }
  });
});

/**
 * getStarPlacement는 더 이상 좌표를 계산하지 않는다 — 좌표는 등록 시점에
 * `libs/universe/placement.ts`가 산출해 DB에 저장하고, 여기서는 그 값을 렌더
 * 좌표로 그대로 전달할 뿐이다 (겹침/캔버스 이탈 불변식 검증은 `placement.test.ts`가 담당).
 * 이 파일에서는 "재계산하지 않는다"와 "twinkle/float 위상은 여전히 seed 기반
 * 결정론적"이라는 계약만 검증한다.
 */
describe("getStarPlacement", () => {
  it("일반 별은 전달받은 좌표를 그대로 렌더 좌표로 돌려준다", () => {
    const placement = getStarPlacement("a1b2c3d4e5f6a7b8", {
      xRatio: 0.3,
      yRatio: 0.62,
    });

    expect(placement.leftRatio).toBe(0.3);
    expect(placement.topRatio).toBe(0.62);
  });

  it("같은 시드/좌표면 항상 같은 결과를 준다 (새로고침에도 별이 안 흔들린다)", () => {
    const first = getStarPlacement("a1b2c3d4e5f6a7b8", {
      xRatio: 0.4,
      yRatio: 0.5,
    });
    const second = getStarPlacement("a1b2c3d4e5f6a7b8", {
      xRatio: 0.4,
      yRatio: 0.5,
    });

    expect(first).toEqual(second);
  });

  it("좌표가 달라도 같은 시드면 애니메이션 위상은 같다", () => {
    const a = getStarPlacement("a1b2c3d4e5f6a7b8", {
      xRatio: 0.1,
      yRatio: 0.1,
    });
    const b = getStarPlacement("a1b2c3d4e5f6a7b8", {
      xRatio: 0.9,
      yRatio: 0.9,
    });

    expect(a.twinkleDelaySeconds).toBe(b.twinkleDelaySeconds);
    expect(a.floatDelaySeconds).toBe(b.floatDelaySeconds);
  });

  it("시드가 다르면 애니메이션 위상이 갈린다", () => {
    const a = getStarPlacement("a1b2c3d4e5f6a7b8", {
      xRatio: 0.5,
      yRatio: 0.5,
    });
    const b = getStarPlacement("ffffffffffffffff", {
      xRatio: 0.5,
      yRatio: 0.5,
    });

    expect(a.twinkleDelaySeconds).not.toBeCloseTo(b.twinkleDelaySeconds, 5);
  });

  it("애니메이션 위상은 음수 delay로 어긋난다", () => {
    const placement = getStarPlacement("a1b2c3d4e5f6a7b8", {
      xRatio: 0.5,
      yRatio: 0.5,
    });

    expect(placement.twinkleDelaySeconds).toBeLessThanOrEqual(0);
    expect(placement.floatDelaySeconds).toBeLessThanOrEqual(0);
  });

  it("오버플로 본인 별은 전달받은 좌표를 무시하고 항상 같은 자리(40°)에 고정된다", () => {
    // 시드도, 전달된 좌표도 달라야 "무시하고 고정"이 검증된다.
    const a = getStarPlacement(
      "a1b2c3d4e5f6a7b8",
      { xRatio: 0.1, yRatio: 0.1 },
      true
    );
    const b = getStarPlacement(
      "ffffffffffffffff",
      { xRatio: 0.9, yRatio: 0.9 },
      true
    );

    expect(a.leftRatio).toBeCloseTo(b.leftRatio, 10);
    expect(a.topRatio).toBeCloseTo(b.topRatio, 10);

    // 위치는 고정이지만 반짝임 위상은 시드별로 달라 개성이 남는다
    expect(a.twinkleDelaySeconds).not.toBeCloseTo(b.twinkleDelaySeconds, 5);

    // ring2(0.375)보다 확실히 바깥
    const distance = Math.hypot(a.leftRatio - 0.5, a.topRatio - 0.5);
    expect(distance).toBeGreaterThan(0.38);
  });
});
