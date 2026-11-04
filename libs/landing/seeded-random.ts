/**
 * 같은 입력이면 늘 같은 그림이 나오게 하는 시드 난수.
 * 인생 필름 밤하늘(libs/landing/night-sky.ts)이 쓴다.
 */

/** FNV-1a 32비트 해시 */
export const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

/** mulberry32 — 시드가 같으면 같은 수열 */
export const createRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
