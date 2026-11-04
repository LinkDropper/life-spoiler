/**
 * 인생 필름 장면 색 (홈 첫 화면·랜딩 인생 필름 공용).
 * 하늘 그림은 libs/landing/night-sky.ts가 그린다.
 */

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
