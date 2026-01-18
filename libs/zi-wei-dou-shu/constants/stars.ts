import type { BranchIndex, StemIndex } from "../types";

/**
 * 14주성 목록
 */
export const MAIN_STAR_NAMES = [
  "자미",
  "천기",
  "태양",
  "무곡",
  "천동",
  "염정",
  "천부",
  "태음",
  "탐랑",
  "거문",
  "천상",
  "천량",
  "칠살",
  "파군",
] as const;

export type MainStarName = (typeof MAIN_STAR_NAMES)[number];

/**
 * 자미 계열 주성 오프셋
 * 자미성 위치 기준 역행
 */
export const ZIWEI_GROUP_OFFSETS: Record<string, number> = {
  자미: 0,
  천기: -1,
  태양: -2,
  무곡: -3,
  천동: -4,
  염정: -5,
};

/**
 * 천부 계열 주성 오프셋
 * 천부성 위치 기준 순행
 *
 * @출처 삼합파(三合派)
 * @구결 "天府太陰順貪狼，巨門天相與天梁，七殺空三是破軍"
 * @검증일 2026-01-18
 *
 * 파군 오프셋 = 10 (칠살 6 + 공백 3칸 + 1 = 10)
 * @학파차이 일부 학파에서는 파군을 +4로 보는 경우 있음
 */
export const TIANFU_GROUP_OFFSETS: Record<string, number> = {
  천부: 0,
  태음: 1,
  탐랑: 2,
  거문: 3,
  천상: 4,
  천량: 5,
  칠살: 6,
  파군: 10, // 七殺空三是破軍: 칠살 후 3칸 공백
};

/**
 * 자미성 → 천부성 위치 변환 테이블
 * 인(寅)-신(申) 축 대칭
 */
export const TIANFU_FROM_ZIWEI: Record<BranchIndex, BranchIndex> = {
  0: 4, // 자 → 진
  1: 3, // 축 → 묘
  2: 2, // 인 → 인
  3: 1, // 묘 → 축
  4: 0, // 진 → 자
  5: 11, // 사 → 해
  6: 10, // 오 → 술
  7: 9, // 미 → 유
  8: 8, // 신 → 신
  9: 7, // 유 → 미
  10: 6, // 술 → 오
  11: 5, // 해 → 사
};

/**
 * 보좌성 목록
 */
export const MINOR_STAR_NAMES = [
  "좌보",
  "우필",
  "문창",
  "문곡",
  "천괴",
  "천월",
  "화성",
  "영성",
  "양인",
  "타라",
  "지겁",
  "지공",
  "천마",
  "홍란",
  "천희",
] as const;

export type MinorStarName = (typeof MINOR_STAR_NAMES)[number];

/**
 * 천괴 위치 테이블 (연간 기준)
 */
export const TIANKUI_TABLE: Record<StemIndex, BranchIndex> = {
  0: 1, // 갑 → 축
  1: 0, // 을 → 자
  2: 11, // 병 → 해
  3: 11, // 정 → 해
  4: 1, // 무 → 축
  5: 0, // 기 → 자
  6: 6, // 경 → 오
  7: 6, // 신 → 오
  8: 3, // 임 → 묘
  9: 3, // 계 → 묘
};

/**
 * 천월 위치 테이블 (연간 기준)
 */
export const TIANYUE_TABLE: Record<StemIndex, BranchIndex> = {
  0: 7, // 갑 → 미
  1: 8, // 을 → 신
  2: 9, // 병 → 유
  3: 9, // 정 → 유
  4: 7, // 무 → 미
  5: 8, // 기 → 신
  6: 4, // 경 → 진
  7: 4, // 신 → 진
  8: 5, // 임 → 사
  9: 5, // 계 → 사
};

/**
 * 양인 위치 테이블 (연간 기준)
 */
export const QINGYANG_TABLE: Record<StemIndex, BranchIndex> = {
  0: 3, // 갑 → 묘
  1: 4, // 을 → 진
  2: 6, // 병 → 오
  3: 7, // 정 → 미
  4: 6, // 무 → 오
  5: 7, // 기 → 미
  6: 9, // 경 → 유
  7: 10, // 신 → 술
  8: 0, // 임 → 자
  9: 1, // 계 → 축
};

/**
 * 타라 위치 테이블 (연간 기준)
 */
export const TUOLUO_TABLE: Record<StemIndex, BranchIndex> = {
  0: 1, // 갑 → 축
  1: 2, // 을 → 인
  2: 4, // 병 → 진
  3: 5, // 정 → 사
  4: 4, // 무 → 진
  5: 5, // 기 → 사
  6: 7, // 경 → 미
  7: 8, // 신 → 신
  8: 10, // 임 → 술
  9: 11, // 계 → 해
};

/**
 * 천마 위치 테이블 (연지 기준)
 */
export const TIANMA_TABLE: Record<BranchIndex, BranchIndex> = {
  0: 2, // 자 → 인
  1: 11, // 축 → 해
  2: 8, // 인 → 신
  3: 5, // 묘 → 사
  4: 2, // 진 → 인
  5: 11, // 사 → 해
  6: 8, // 오 → 신
  7: 5, // 미 → 사
  8: 2, // 신 → 인
  9: 11, // 유 → 해
  10: 8, // 술 → 신
  11: 5, // 해 → 사
};
