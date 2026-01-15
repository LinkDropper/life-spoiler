import { PALACE_ORDER } from "../constants";
import type { BranchIndex, StemIndex } from "../types";

/**
 * 명궁 위치 계산
 *
 * 공식: 인(寅)궁에서 시작하여 월수만큼 순행, 시진만큼 역행
 * (2 + lunarMonth - 1 - timeBranch + 12) % 12
 *
 * @param lunarMonth 음력 월 (1-12)
 * @param timeBranch 시진 인덱스 (0-11)
 * @returns 명궁이 위치한 지지 인덱스
 */
export const calculateMingGong = (
  lunarMonth: number,
  timeBranch: BranchIndex
): BranchIndex => {
  const position = (2 + lunarMonth - 1 - timeBranch + 12) % 12;
  return position as BranchIndex;
};

/**
 * 신궁 위치 계산
 *
 * 공식: 인(寅)궁에서 시작하여 월수만큼 순행, 시진만큼 순행
 * (2 + lunarMonth - 1 + timeBranch) % 12
 */
export const calculateShenGong = (
  lunarMonth: number,
  timeBranch: BranchIndex
): BranchIndex => {
  const position = (2 + lunarMonth - 1 + timeBranch) % 12;
  return position as BranchIndex;
};

/**
 * 12궁 배치 (명궁 위치 기준 반시계 방향)
 *
 * @param mingGongBranch 명궁 지지 인덱스
 * @returns 궁 이름 → 지지 인덱스 매핑
 */
export const arrangePalaces = (
  mingGongBranch: BranchIndex
): Map<string, BranchIndex> => {
  const palaces = new Map<string, BranchIndex>();

  PALACE_ORDER.forEach((palace, index) => {
    // 반시계 방향 = 지지 인덱스 감소
    const branch = ((((mingGongBranch - index) % 12) + 12) % 12) as BranchIndex;
    palaces.set(palace, branch);
  });

  return palaces;
};

/**
 * 궁의 천간 계산 (연간 기준)
 *
 * 연간에 따른 인(寅)궁의 천간:
 * - 갑/기년 → 인궁이 병(丙)
 * - 을/경년 → 인궁이 무(戊)
 * - 병/신년 → 인궁이 경(庚)
 * - 정/임년 → 인궁이 임(壬)
 * - 무/계년 → 인궁이 갑(甲)
 */
export const getPalaceStem = (
  yearStem: StemIndex,
  palaceBranch: BranchIndex
): StemIndex => {
  const yinStemByYearStem: Record<number, StemIndex> = {
    0: 2, // 갑 → 병
    5: 2, // 기 → 병
    1: 4, // 을 → 무
    6: 4, // 경 → 무
    2: 6, // 병 → 경
    7: 6, // 신 → 경
    3: 8, // 정 → 임
    8: 8, // 임 → 임
    4: 0, // 무 → 갑
    9: 0, // 계 → 갑
  };

  const yinStem = yinStemByYearStem[yearStem];
  // 인(寅)궁부터 순행하며 천간 배치
  const offset = (palaceBranch - 2 + 12) % 12;
  return ((yinStem + offset) % 10) as StemIndex;
};
