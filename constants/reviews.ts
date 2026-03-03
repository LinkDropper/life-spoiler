export const REVIEW_KEYS = [
  "r1",
  "r2",
  "r3",
  "r4",
  "r5",
  "r6",
  "r7",
] as const;

export type ReviewKey = (typeof REVIEW_KEYS)[number];
