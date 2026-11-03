/**
 * 인생 필름 한 칸의 "스틸컷" — 대운궁에 앉은 별로 그린 작은 별자리.
 *
 * 같은 명반이면 늘 같은 그림이 나오도록 궁 이름·시작 나이로 시드를 만든다.
 * 주성은 크게, 잔별은 작게 찍고 가까운 별끼리 선으로 잇는다.
 */

export interface StillStar {
  x: number;
  y: number;
  r: number;
  isMain: boolean;
}

export interface FilmStill {
  stars: StillStar[];
  lines: Array<[number, number]>;
}

/** SVG viewBox 크기 (4:3 스틸) */
export const STILL_WIDTH = 120;
export const STILL_HEIGHT = 90;

const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

/** mulberry32 — 시드가 같으면 같은 수열 */
const createRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const createFilmStill = (
  seedKey: string,
  mainStarCount: number
): FilmStill => {
  const random = createRandom(hashString(seedKey));
  const minorCount = 5 + Math.floor(random() * 4);
  const margin = 14;

  const place = (isMain: boolean): StillStar => ({
    x: margin + random() * (STILL_WIDTH - margin * 2),
    y: margin + random() * (STILL_HEIGHT - margin * 2),
    r: isMain ? 2.6 + random() * 0.8 : 0.7 + random() * 0.8,
    isMain,
  });

  const stars = [
    ...Array.from({ length: mainStarCount }, () => place(true)),
    ...Array.from({ length: minorCount }, () => place(false)),
  ];

  // 왼쪽에서 오른쪽으로 정렬해 이으면 별자리처럼 한 줄기 흐름이 생긴다
  const order = stars
    .map((star, index) => ({ star, index }))
    .sort((a, b) => a.star.x - b.star.x)
    .map(({ index }) => index);

  const lines: Array<[number, number]> = [];
  for (let i = 1; i < order.length; i += 1) {
    // 너무 멀리 떨어진 별은 잇지 않아 선이 화면을 가로지르지 않게 한다
    const a = stars[order[i - 1]];
    const b = stars[order[i]];
    if (Math.hypot(a.x - b.x, a.y - b.y) < 48) {
      lines.push([order[i - 1], order[i]]);
    }
  }

  return { stars, lines };
};

/**
 * 대운궁이 보는 삶의 영역별 장면 색.
 * 돈은 금빛, 연애는 분홍, 일은 푸른빛처럼 궁의 성격을 색으로 바로 읽히게 한다.
 */
export const PALACE_TINTS: Record<string, string> = {
  명궁: "#c4b5ff",
  형제궁: "#8ad6c8",
  부처궁: "#ffa8c5",
  자녀궁: "#ffc39e",
  재백궁: "#ffd77a",
  질액궁: "#9fe3b4",
  천이궁: "#9cd2ff",
  교우궁: "#ff9e8f",
  관록궁: "#93b1ff",
  전택궁: "#e9b97a",
  복덕궁: "#d8a6ff",
  부모궁: "#b9cf9a",
};

export const DEFAULT_TINT = "#ffe7a3";
