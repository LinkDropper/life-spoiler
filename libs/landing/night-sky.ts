import { createRandom, hashString } from "./seeded-random";

/**
 * 대운 한 장면의 밤하늘 (홈 히어로 필름 칸, docs/home-redesign-2026-11.md E안).
 *
 * 같은 명반이면 늘 같은 하늘이 나오도록 궁 이름·시작 나이로 시드를 만든다.
 * 대운궁 색 성운 + 은하수 띠 + 잔별 170개 + 중간 별 6개 위에, 그 궁의 주성을
 * 빛 번짐·십자 광채로 띄우고 가까운 별과 별자리 선으로 잇는다.
 * 그리는 일은 컴포넌트가 하고, 여기서는 좌표만 만든다(테스트할 수 있게).
 */

export const SKY_WIDTH = 320;
export const SKY_HEIGHT = 210;

const FIELD_STAR_COUNT = 170;
const MID_STAR_COUNT = 6;
/** 성운에 섞는 보조색 (랜딩 밤하늘의 보라·남색) */
const NEBULA_PURPLE = "#6e4cb4";
const NEBULA_NAVY = "#24407a";

export interface SkyCloud {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  color: string;
  opacity: number;
  rotate: number;
}

export interface SkyStar {
  x: number;
  y: number;
  r: number;
  opacity: number;
  isWarm: boolean;
}

export interface SkyPoint {
  x: number;
  y: number;
}

export interface SkyMainStar extends SkyPoint {
  name: string;
}

export interface NightSky {
  clouds: SkyCloud[];
  milkyWayRotate: number;
  fieldStars: SkyStar[];
  midStars: SkyPoint[];
  mainStars: SkyMainStar[];
  /** 왼쪽에서 오른쪽으로 이은 별자리 선 */
  constellation: SkyPoint[];
}

export const createNightSky = (
  seedKey: string,
  tint: string,
  starNames: string[]
): NightSky => {
  const random = createRandom(hashString(seedKey));

  const clouds = (
    [
      [tint, 0.42],
      [NEBULA_PURPLE, 0.35],
      [NEBULA_NAVY, 0.4],
      [tint, 0.22],
    ] as const
  ).map(([color, opacity]) => ({
    cx: (0.15 + random() * 0.7) * SKY_WIDTH,
    cy: (0.2 + random() * 0.6) * SKY_HEIGHT,
    rx: 50 + random() * 70,
    ry: 24 + random() * 36,
    color,
    opacity,
    rotate: -30 + random() * 60,
  }));

  const milkyWayRotate = -24 + random() * 10;

  // 작은 별일수록 많게(세제곱 분포), 8%는 따뜻한 색
  const fieldStars = Array.from({ length: FIELD_STAR_COUNT }, () => ({
    x: random() * SKY_WIDTH,
    y: random() * SKY_HEIGHT,
    r: 0.2 + random() ** 3 * 0.8,
    opacity: 0.2 + random() * 0.75,
    isWarm: random() < 0.08,
  }));

  const midStars = Array.from({ length: MID_STAR_COUNT }, () => ({
    x: (0.1 + random() * 0.8) * SKY_WIDTH,
    y: (0.15 + random() * 0.7) * SKY_HEIGHT,
  }));

  // 주성은 타임코드(왼쪽 위)·상영 표시(오른쪽 위)·자막(아래)을 피한 가운데 띠에 놓는다
  const mainStars = starNames.map((name, index) => ({
    name,
    x:
      (0.3 +
        (starNames.length === 1 ? 0.22 : index * 0.38) +
        (random() - 0.5) * 0.08) *
      SKY_WIDTH,
    y: (0.34 + random() * 0.22) * SKY_HEIGHT,
  }));

  const anchors =
    mainStars.length > 0
      ? mainStars
      : [{ x: SKY_WIDTH / 2, y: SKY_HEIGHT * 0.45 }];
  const [firstAnchor] = anchors;
  const nearest = [...midStars]
    .sort(
      (a, b) =>
        Math.hypot(a.x - firstAnchor.x, a.y - firstAnchor.y) -
        Math.hypot(b.x - firstAnchor.x, b.y - firstAnchor.y)
    )
    .slice(0, 3);
  const constellation = [
    ...anchors.map(({ x, y }) => ({ x, y })),
    ...nearest,
  ].sort((a, b) => a.x - b.x);

  return {
    clouds,
    milkyWayRotate,
    fieldStars,
    midStars,
    mainStars,
    constellation,
  };
};
