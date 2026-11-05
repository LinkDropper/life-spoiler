import { useTranslations } from "next-intl";

import { getRowAnchorId } from "@/libs/universe/credits";

import styles from "./SeatMap.module.css";

import type { SeatCell, SeatMapRow } from "@/libs/universe/seat-map";

interface SeatMapProps {
  rows: SeatMapRow[];
  /** 스크린 아래 자막(주최자 한줄평). 없으면 그리지 않는다 */
  caption?: string;
  /** "E8" 같은 내 좌석 번호. 있으면 "내 자리 · E8"을 보여 준다 */
  mySeatLabel?: string | null;
  /**
   * chart: 열 링크가 달린 실데이터 배치도 (role=group)
   * empty: 관객 없는 장식용 배치도 (role=img)
   */
  mode: "chart" | "empty";
  ariaLabel: string;
}

const renderSeat = (cell: SeatCell, index: number) => {
  if (cell.kind === "guest") {
    return (
      <span
        key={index}
        className={`${styles.seat} ${cell.isMine ? styles.seatMine : styles.seatTaken}`}
        aria-hidden="true"
      >
        {cell.initial}
      </span>
    );
  }

  if (cell.kind === "overflow") {
    return (
      <span
        key={index}
        className={`${styles.seat} ${styles.seatMore}`}
        aria-hidden="true"
      >
        +{cell.count}
      </span>
    );
  }

  return <span key={index} className={styles.seat} aria-hidden="true" />;
};

/**
 * 스크린 + 좌석 배치도 — 로그인 `SeatMap`과 같은 문법이다.
 * 관객이 있는 열은 통째로 링크(높이 44px)라서, 누르면 엔딩 크레딧의 그 열 첫 관객으로 간다.
 * 좌석 칸 자체(30x26)는 터치 기준에 못 미치므로 칸을 누르게 하지 않는다.
 */
export const SeatMap = ({
  rows,
  caption,
  mySeatLabel = null,
  mode,
  ariaLabel,
}: SeatMapProps) => {
  const t = useTranslations("universe.detail");
  const isChart = mode === "chart";

  return (
    <div className={styles.map}>
      <div className={styles.screen} aria-hidden="true" />
      <span className={styles.screenLabel} aria-hidden="true">
        {t("screen")}
      </span>
      {caption && <p className={styles.caption}>{caption}</p>}

      <div
        className={styles.rows}
        role={isChart ? "group" : "img"}
        aria-label={ariaLabel}
      >
        {rows.map((row) => {
          const seats = (
            <>
              <span className={styles.rowLabel} aria-hidden="true">
                {row.label}
              </span>
              {row.cells.map(renderSeat)}
            </>
          );

          if (!isChart || row.audienceCount === 0) {
            return (
              <div key={row.label} className={styles.row}>
                {seats}
              </div>
            );
          }

          return (
            <a
              key={row.label}
              className={`${styles.row} ${styles.rowLink}`}
              href={`#${getRowAnchorId(row.label)}`}
              aria-label={t("rowLinkAria", {
                row: row.label,
                count: row.audienceCount,
              })}
            >
              {seats}
            </a>
          );
        })}
      </div>

      {mySeatLabel && (
        <p className={styles.mine}>
          <span className={styles.mineSwatch} aria-hidden="true" />
          {t("mySeat", { seat: mySeatLabel })}
        </p>
      )}
    </div>
  );
};
