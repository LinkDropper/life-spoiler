import { forwardRef } from "react";

import { BRANCH_GRID_POSITIONS } from "./palace-layout";
import styles from "./PalaceGrid.module.css";

import type { ChartSnapshotCell } from "@/libs/landing/chart-snapshot";

interface PalaceGridProps {
  cells: ChartSnapshotCell[];
  /** 강조할 궁 (스크롤 단계나 선택 시진에 따라 바뀐다) */
  highlightBranch?: number | null;
  /** 명궁 자리 — 별빛색 테두리로 늘 표시 */
  mingBranch?: number | null;
  centerLabel: string;
  ariaLabel: string;
  /** 3D 별이 칸을 채우는 장면에선 칸 배경을 비워 둔다 */
  isOverlay?: boolean;
  className?: string;
}

export const PalaceGrid = forwardRef<HTMLOListElement, PalaceGridProps>(
  (
    {
      cells,
      highlightBranch = null,
      mingBranch = null,
      centerLabel,
      ariaLabel,
      isOverlay = false,
      className,
    },
    ref
  ) => (
    <ol
      ref={ref}
      className={[styles.grid, isOverlay ? styles.overlay : "", className]
        .filter(Boolean)
        .join(" ")}
      aria-label={ariaLabel}
    >
      {cells.map((cell) => {
        const position = BRANCH_GRID_POSITIONS[cell.branch];
        const isHighlighted = cell.branch === highlightBranch;
        const isMing = cell.branch === mingBranch;
        return (
          <li
            key={cell.branch}
            className={[
              styles.cell,
              isMing ? styles.ming : "",
              isHighlighted ? styles.highlighted : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ gridRow: position.row, gridColumn: position.col }}
            aria-current={isHighlighted || undefined}
          >
            <span className={styles.palaceName}>{cell.palaceName}</span>
            <span className={styles.stars}>{cell.mainStars.join(" ")}</span>
          </li>
        );
      })}
      <li className={styles.center} aria-hidden="true">
        {centerLabel}
      </li>
    </ol>
  )
);

PalaceGrid.displayName = "PalaceGrid";
