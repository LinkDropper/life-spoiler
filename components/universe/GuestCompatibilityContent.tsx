"use client";

import { useTranslations } from "next-intl";

import { formatSeatLabel } from "@/libs/universe/seat-map";

import { GuestFactors } from "./GuestFactors";
import styles from "./GuestCompatibilityContent.module.css";

import type { GuestSeat } from "@/libs/universe/seat-map";
import type { UniverseGuestDto } from "@/libs/universe/types";

interface GuestCompatibilityContentProps {
  guest: UniverseGuestDto;
  seat: GuestSeat | null;
  /** 이름 제목의 id (드로어가 aria-labelledby로 가리킨다) */
  titleId: string;
  className?: string;
}

/**
 * 이름/점수/좌석/한줄평/추정치 안내/factors breakdown을 보여주는 드로어 콘텐츠.
 * 등급 라벨은 쓰지 않는다 — 열(좌석 번호)이 등급을 대신한다.
 * chrome(배경/닫기버튼/애니메이션)은 `GuestDetailDrawer`가 담당한다.
 */
export const GuestCompatibilityContent = ({
  guest,
  seat,
  titleId,
  className,
}: GuestCompatibilityContentProps) => {
  const t = useTranslations("universe.detail");
  const seatText = seat
    ? (formatSeatLabel(seat) ?? t("rowOnly", { row: seat.rowLabel }))
    : null;

  return (
    <div className={className}>
      <h2 id={titleId} className={styles.name}>
        {guest.name}
      </h2>

      <div className={styles.scoreRow}>
        <span className={styles.score}>
          {t("scoreTag", { score: guest.score })}
        </span>
        {seatText && <span className={styles.seat}>{seatText}</span>}
      </div>

      <p className={styles.oneLiner}>{guest.oneLinerKo}</p>

      {guest.confidence === "estimated" && (
        <p className={styles.estimatedNote}>{t("estimatedNote")}</p>
      )}

      {guest.factors.length > 0 && (
        <div className={styles.factorsSection}>
          <p className={styles.factorsTitle}>{t("drawerFactorsTitle")}</p>
          <GuestFactors factors={guest.factors} />
        </div>
      )}
    </div>
  );
};
