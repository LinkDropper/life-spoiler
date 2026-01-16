/**
 * 점수 계산 관련 상수
 */

/** 카테고리별 점수 타입 */
export interface CategoryScores {
  wealth: number;
  career: number;
  relationship: number;
  health: number;
}

/**
 * 궁별 카테고리 가중치
 *
 * 각 궁이 어떤 카테고리에 더 큰 영향을 미치는지 정의
 */
export const PALACE_CATEGORY_WEIGHTS: Record<string, CategoryScores> = {
  명궁: { wealth: 1.0, career: 1.2, relationship: 1.0, health: 1.0 },
  형제궁: { wealth: 0.8, career: 1.0, relationship: 1.2, health: 0.8 },
  부처궁: { wealth: 0.9, career: 0.8, relationship: 1.5, health: 0.9 },
  자녀궁: { wealth: 0.8, career: 0.9, relationship: 1.3, health: 0.9 },
  재백궁: { wealth: 1.5, career: 1.1, relationship: 0.8, health: 0.8 },
  질액궁: { wealth: 0.7, career: 0.8, relationship: 0.9, health: 1.5 },
  천이궁: { wealth: 1.1, career: 1.2, relationship: 1.0, health: 0.9 },
  교우궁: { wealth: 1.0, career: 1.1, relationship: 1.3, health: 0.8 },
  관록궁: { wealth: 1.2, career: 1.5, relationship: 0.9, health: 0.9 },
  전택궁: { wealth: 1.3, career: 0.9, relationship: 1.0, health: 1.0 },
  복덕궁: { wealth: 1.0, career: 0.9, relationship: 1.1, health: 1.2 },
  부모궁: { wealth: 0.9, career: 1.1, relationship: 1.0, health: 1.1 },
};
