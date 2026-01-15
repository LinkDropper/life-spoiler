import type { StemIndex } from "../types";
import type { SihuaResult } from "../types";

/**
 * 사화성 테이블
 * 연간(年干)에 따라 어떤 별에 사화가 붙는지 결정
 *
 * - 화록(化祿): 재물, 기회 증가
 * - 화권(化權): 권력, 지위 상승
 * - 화과(化科): 명예, 학업 향상
 * - 화기(化忌): 막힘, 어려움 (부정적)
 */
export const SIHUA_TABLE: Record<StemIndex, SihuaResult> = {
  // 갑(甲)
  0: { hualu: "염정", huaquan: "파군", huake: "무곡", huaji: "태양" },
  // 을(乙)
  1: { hualu: "천기", huaquan: "천량", huake: "자미", huaji: "태음" },
  // 병(丙)
  2: { hualu: "천동", huaquan: "천기", huake: "문창", huaji: "염정" },
  // 정(丁)
  3: { hualu: "태음", huaquan: "천동", huake: "천기", huaji: "거문" },
  // 무(戊)
  4: { hualu: "탐랑", huaquan: "태음", huake: "우필", huaji: "천기" },
  // 기(己)
  5: { hualu: "무곡", huaquan: "탐랑", huake: "천량", huaji: "문곡" },
  // 경(庚)
  6: { hualu: "태양", huaquan: "무곡", huake: "태음", huaji: "천동" },
  // 신(辛)
  7: { hualu: "거문", huaquan: "태양", huake: "문곡", huaji: "문창" },
  // 임(壬)
  8: { hualu: "천량", huaquan: "자미", huake: "좌보", huaji: "무곡" },
  // 계(癸)
  9: { hualu: "파군", huaquan: "거문", huake: "태음", huaji: "탐랑" },
};
