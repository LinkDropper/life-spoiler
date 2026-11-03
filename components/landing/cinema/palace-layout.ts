/**
 * 명반의 지지별 고정 위치 (4x4 바깥 테두리, 1부터 시작).
 * `components/fortune/ZiweiChartGrid.tsx`와 같은 배치다. 그 파일은 클라이언트
 * 컴포넌트 모듈이라 상수만 따로 떼어 여기 둔다.
 */
export const BRANCH_GRID_POSITIONS: Record<
  number,
  { row: number; col: number }
> = {
  0: { row: 4, col: 3 },
  1: { row: 4, col: 2 },
  2: { row: 4, col: 1 },
  3: { row: 3, col: 1 },
  4: { row: 2, col: 1 },
  5: { row: 1, col: 1 },
  6: { row: 1, col: 2 },
  7: { row: 1, col: 3 },
  8: { row: 1, col: 4 },
  9: { row: 2, col: 4 },
  10: { row: 3, col: 4 },
  11: { row: 4, col: 4 },
};
