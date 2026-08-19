import { describe, expect, it } from "@jest/globals";

import {
  CANVAS_HEIGHT_PX,
  CANVAS_WIDTH_PX,
  computeGuestPlacement,
} from "../placement";
import {
  getStarVisual,
  OVERFLOW_SELF_ANGLE_RADIANS,
  OVERFLOW_SELF_RADIUS_RATIO,
  OWNER_STAR_VISUAL,
} from "../star-visual";

import type { PlacedStar, StarPosition } from "../placement";

/**
 * 겹침/이탈 회귀 방지.
 *
 * 랜덤 배치로 전환된 뒤에도 아래 불변식은 약화시키지 않는다:
 * (1) 별끼리 겹치지 않는다, (2) 별/라벨이 캔버스를 벗어나지 않는다,
 * (3) 오버플로 본인 별 궤도와 겹치지 않는다, (4) 배치는 어떤 상황에서도 좌표를 반환한다
 * (등록 실패 없음), (5) 새 별 배치가 기존 별 좌표를 바꾸지 않는다.
 *
 * 판정 좌표계는 기존 회귀 테스트가 쓰던 375px 뷰포트 기준 캔버스(335×352px)를 그대로 쓴다.
 */
const toPixels = (position: StarPosition) => ({
  x: position.xRatio * CANVAS_WIDTH_PX,
  y: position.yRatio * CANVAS_HEIGHT_PX,
});

const OWNER_RADIUS_PX = OWNER_STAR_VISUAL.diameterPx / 2;
/** 정의역 상한(99점)에서의 반지름 — 최악 케이스(전원 최대 크기) 검증용 */
const MAX_SCORE_RADIUS_PX = getStarVisual(99).diameterPx / 2;
/** 이름 라벨: max-width 56px + 좌우 padding 6px씩, 가운데 정렬 */
const LABEL_HALF_WIDTH_PX = (56 + 12) / 2;

const OVERFLOW_ORBIT_PX = toPixels({
  xRatio:
    0.5 + Math.cos(OVERFLOW_SELF_ANGLE_RADIANS) * OVERFLOW_SELF_RADIUS_RATIO,
  yRatio:
    0.5 + Math.sin(OVERFLOW_SELF_ANGLE_RADIANS) * OVERFLOW_SELF_RADIUS_RATIO,
});

const OWNER_CENTER_PX = { x: CANVAS_WIDTH_PX / 2, y: CANVAS_HEIGHT_PX / 2 };

describe("computeGuestPlacement", () => {
  it("최대 크기(99점) 30명을 순차 배치해도 서로/owner/오버플로 궤도와 겹치지 않는다 (최악 케이스)", () => {
    for (let trial = 0; trial < 5; trial += 1) {
      const placed: PlacedStar[] = [];

      for (let index = 0; index < 30; index += 1) {
        const position = computeGuestPlacement(placed, 99);
        const candidatePx = toPixels(position);

        for (const existing of placed) {
          const existingPx = toPixels(existing);
          const distance = Math.hypot(
            candidatePx.x - existingPx.x,
            candidatePx.y - existingPx.y
          );

          expect(distance).toBeGreaterThan(MAX_SCORE_RADIUS_PX * 2);
        }

        const ownerDistance = Math.hypot(
          candidatePx.x - OWNER_CENTER_PX.x,
          candidatePx.y - OWNER_CENTER_PX.y
        );
        expect(ownerDistance).toBeGreaterThan(
          OWNER_RADIUS_PX + MAX_SCORE_RADIUS_PX
        );

        const overflowDistance = Math.hypot(
          candidatePx.x - OVERFLOW_ORBIT_PX.x,
          candidatePx.y - OVERFLOW_ORBIT_PX.y
        );
        expect(overflowDistance).toBeGreaterThan(MAX_SCORE_RADIUS_PX * 2);

        placed.push({ ...position, score: 99 });
      }
    }
  });

  it("모든 별과 이름 라벨이 캔버스 안에 들어간다", () => {
    const placed: PlacedStar[] = [];

    for (let index = 0; index < 30; index += 1) {
      const position = computeGuestPlacement(placed, 99);
      const { x, y } = toPixels(position);

      expect(x - LABEL_HALF_WIDTH_PX).toBeGreaterThan(0);
      expect(x + LABEL_HALF_WIDTH_PX).toBeLessThan(CANVAS_WIDTH_PX);
      expect(y - MAX_SCORE_RADIUS_PX).toBeGreaterThan(0);
      expect(y + MAX_SCORE_RADIUS_PX).toBeLessThan(CANVAS_HEIGHT_PX);

      placed.push({ ...position, score: 99 });
    }
  });

  it("고밀도(48명 초과) 우주에서도 등록 자체는 절대 실패하지 않는다", () => {
    const placed: PlacedStar[] = [];

    // "48명 부근부터 완화가 시작된다"는 확인된 한계를 넘겨 60명까지 채운다.
    // 겹침 완화 구간에서는 비겹침을 더 이상 요구하지 않지만, 유효한 좌표는
    // 항상 반환되어야 한다(등록 실패 없음).
    for (let index = 0; index < 60; index += 1) {
      const position = computeGuestPlacement(placed, 99);

      expect(Number.isFinite(position.xRatio)).toBe(true);
      expect(Number.isFinite(position.yRatio)).toBe(true);
      expect(position.xRatio).toBeGreaterThanOrEqual(0);
      expect(position.xRatio).toBeLessThanOrEqual(1);
      expect(position.yRatio).toBeGreaterThanOrEqual(0);
      expect(position.yRatio).toBeLessThanOrEqual(1);

      placed.push({ ...position, score: 99 });
    }
  });

  it("새 별 배치는 기존 별 목록을 변형하지 않는다 (기존 별 좌표 불변)", () => {
    const existing: PlacedStar[] = [
      { xRatio: 0.3, yRatio: 0.3, score: 80 },
      { xRatio: 0.7, yRatio: 0.7, score: 50 },
    ];
    const snapshot = existing.map((star) => ({ ...star }));

    computeGuestPlacement(existing, 60);

    expect(existing).toEqual(snapshot);
  });

  it("빈 우주(첫 친구)에서도 owner/오버플로 궤도를 피해 좌표를 반환한다", () => {
    const position = computeGuestPlacement([], 50);
    const candidatePx = toPixels(position);

    const ownerDistance = Math.hypot(
      candidatePx.x - OWNER_CENTER_PX.x,
      candidatePx.y - OWNER_CENTER_PX.y
    );
    expect(ownerDistance).toBeGreaterThan(OWNER_RADIUS_PX);

    const overflowDistance = Math.hypot(
      candidatePx.x - OVERFLOW_ORBIT_PX.x,
      candidatePx.y - OVERFLOW_ORBIT_PX.y
    );
    expect(overflowDistance).toBeGreaterThan(0);
  });
});
