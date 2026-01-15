import type { BranchIndex, StemIndex } from "../types";

/**
 * 12지지 (地支)
 * 인덱스: 자(0), 축(1), 인(2), 묘(3), 진(4), 사(5), 오(6), 미(7), 신(8), 유(9), 술(10), 해(11)
 */
export const EARTHLY_BRANCHES = [
  "자",
  "축",
  "인",
  "묘",
  "진",
  "사",
  "오",
  "미",
  "신",
  "유",
  "술",
  "해",
] as const;

/**
 * 10천간 (天干)
 * 인덱스: 갑(0), 을(1), 병(2), 정(3), 무(4), 기(5), 경(6), 신(7), 임(8), 계(9)
 */
export const HEAVENLY_STEMS = [
  "갑",
  "을",
  "병",
  "정",
  "무",
  "기",
  "경",
  "신",
  "임",
  "계",
] as const;

/**
 * 지지 인덱스 맵 (한글 → 숫자)
 */
export const BRANCH_INDEX_MAP: Record<string, BranchIndex> = {
  자: 0,
  축: 1,
  인: 2,
  묘: 3,
  진: 4,
  사: 5,
  오: 6,
  미: 7,
  신: 8,
  유: 9,
  술: 10,
  해: 11,
};

/**
 * 천간 인덱스 맵 (한글 → 숫자)
 */
export const STEM_INDEX_MAP: Record<string, StemIndex> = {
  갑: 0,
  을: 1,
  병: 2,
  정: 3,
  무: 4,
  기: 5,
  경: 6,
  신: 7,
  임: 8,
  계: 9,
};
