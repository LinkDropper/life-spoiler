"use client";

import { useTranslations } from "next-intl";

import { formatSeatLabel } from "@/libs/universe/seat-map";

import { SeatMap } from "./SeatMap";
import styles from "./ScreeningHero.module.css";

import type {
  GuestSeat,
  SeatMap as SeatMapData,
} from "@/libs/universe/seat-map";

interface ScreeningHeroProps {
  ownerName: string | null;
  /** 주최자 한줄평 — 스크린 자막. 엔진 KO 데이터라 번역키를 거치지 않는다 */
  ownerOneLinerKo: string;
  guestCount: number;
  /** 전체 시사회 중 붐비는 순위. 관객이 0명이면 null */
  guestCountRank: number | null;
  /** 우주 전체가 estimated인지 (owner 시간 미상) — 안내는 여기서 1회만 한다 */
  isUniverseEstimated: boolean;
  seatMap: SeatMapData;
  mySeat: GuestSeat | null;
}

/**
 * 1번 영역 — 스크린 + 좌석 배치도.
 * 주최자는 좌석에 앉지 않는다: 스크린 자체가 주최자의 상영작이라
 * 곡선 스크린 위에 제목, 아래에 한줄평 자막을 둔다.
 */
export const ScreeningHero = ({
  ownerName,
  ownerOneLinerKo,
  guestCount,
  guestCountRank,
  isUniverseEstimated,
  seatMap,
  mySeat,
}: ScreeningHeroProps) => {
  const t = useTranslations("universe.detail");

  const title = ownerName
    ? t("ownerTitle", { name: ownerName })
    : t("ownerTitleFallback");
  const mySeatLabel = mySeat ? formatSeatLabel(mySeat) : null;

  const seatedRows = seatMap.rows.filter((row) => row.audienceCount > 0);
  const seatMapAriaLabel =
    seatedRows.length === 0
      ? t("seatMapAriaEmpty")
      : [
          t("seatMapAria", {
            rows: seatedRows
              .map((row) =>
                t("seatMapRowSummary", {
                  row: row.label,
                  count: row.audienceCount,
                })
              )
              .join(", "),
          }),
          ...seatedRows
            .filter((row) => row.overflowCount > 0)
            .map((row) =>
              t("seatMapOverflowAria", {
                row: row.label,
                count: row.overflowCount,
              })
            ),
          ...(mySeatLabel ? [t("seatMapMineAria", { seat: mySeatLabel })] : []),
        ].join(" ");

  return (
    <section className={styles.hero}>
      <h1 className={styles.title}>{title}</h1>

      <SeatMap
        rows={seatMap.rows}
        caption={ownerOneLinerKo}
        mySeatLabel={mySeatLabel}
        mode="chart"
        ariaLabel={seatMapAriaLabel}
      />

      <p className={styles.legend}>{t("seatLegend")}</p>
      {guestCount > 0 && <p className={styles.hint}>{t("seatHint")}</p>}

      <div className={styles.info}>
        <b className={styles.count}>
          {t("audienceCount", { count: guestCount })}
        </b>
        {guestCountRank !== null && (
          <>
            <i className={styles.divider} aria-hidden="true" />
            <span>{t("audienceRank", { rank: guestCountRank })}</span>
          </>
        )}
      </div>

      {/*
        우주 단위 고지는 여기 1회만 한다. 크레딧 행마다 반복하면 같은 태그가
        전 행에 붙어 정보가 아니라 벽지가 된다.
      */}
      {isUniverseEstimated && (
        <p className={styles.notice}>{t("estimatedUniverseBanner")}</p>
      )}
    </section>
  );
};
