"use client";

import styles from "./KeywordGrid.module.css";

interface KeywordGridProps {
  /** 키워드 8개 배열 */
  keywords: string[];
  /** 한줄 표현 */
  oneLiner: string;
  /** 이름 */
  name: string;
  /** 미리보기 모드 (3행 블러 처리) */
  isPreview?: boolean;
}

/**
 * 3x3 키워드 그리드 컴포넌트
 *
 * @description
 * - 8개의 키워드를 3x3 그리드로 배치
 * - 중앙에는 한줄 표현과 이름 표시
 * - 키워드에는 # 접두사 추가
 */
const PREVIEW_PLACEHOLDER = "미리보기 방지";

export default function KeywordGrid({
  keywords,
  oneLiner,
  name,
  isPreview = false,
}: KeywordGridProps) {
  // 8개 키워드를 3x3 그리드에 배치 (중앙 제외)
  // 0 1 2
  // 3 X 4
  // 5 6 7
  const gridKeywords = [
    keywords[0] ?? "",
    keywords[1] ?? "",
    keywords[2] ?? "",
    keywords[3] ?? "",
    // 중앙 (index 4)은 한줄 표현
    keywords[4] ?? "",
    keywords[5] ?? "",
    keywords[6] ?? "",
    keywords[7] ?? "",
  ];

  // 미리보기 모드일 때 3행(높은 우선순위)은 플레이스홀더로 대체
  const row3Keywords = isPreview
    ? [PREVIEW_PLACEHOLDER, PREVIEW_PLACEHOLDER, PREVIEW_PLACEHOLDER]
    : [gridKeywords[0], gridKeywords[1], gridKeywords[2]];

  return (
    <div className={styles.grid}>
      {/* 1행 - 낮은 우선순위 */}
      <div className={styles.cell}>
        <span className={styles.tag}>#{gridKeywords[5]}</span>
      </div>
      <div className={styles.cell}>
        <span className={styles.tag}>#{gridKeywords[6]}</span>
      </div>
      <div className={styles.cell}>
        <span className={styles.tag}>#{gridKeywords[7]}</span>
      </div>

      {/* 2행 - 중간 */}
      <div className={styles.cell}>
        <span className={styles.tag}>#{gridKeywords[3]}</span>
      </div>
      <div className={styles.cellCenter}>
        <span className={styles.oneLiner}>{oneLiner}</span>
        <span className={styles.name}>{name}</span>
      </div>
      <div className={styles.cell}>
        <span className={styles.tag}>#{gridKeywords[4]}</span>
      </div>

      {/* 3행 - 높은 우선순위 (미리보기 시 블러) */}
      <div className={`${styles.cell} ${isPreview ? styles.cellBlurred : ""}`}>
        <span className={styles.tag}>#{row3Keywords[0]}</span>
      </div>
      <div className={`${styles.cell} ${isPreview ? styles.cellBlurred : ""}`}>
        <span className={styles.tag}>#{row3Keywords[1]}</span>
      </div>
      <div className={`${styles.cell} ${isPreview ? styles.cellBlurred : ""}`}>
        <span className={styles.tag}>#{row3Keywords[2]}</span>
      </div>
    </div>
  );
}
