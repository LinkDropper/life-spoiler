"use client";

import { useTranslations } from "next-intl";

import { formatSeatLabel } from "@/libs/universe/seat-map";

import { GuestFactors } from "./GuestFactors";
import styles from "./MyCompatibilitySummary.module.css";
import { ScreeningTicket } from "./ScreeningTicket";

import type { GuestSeat } from "@/libs/universe/seat-map";
import type { UniverseGuestDto } from "@/libs/universe/types";

interface MyCompatibilitySummaryProps {
  guest: UniverseGuestDto;
  ownerName: string | null;
  seat: GuestSeat | null;
  /** 이미 입장한 조합을 다시 제출한 경우의 안내 */
  showDuplicateNotice: boolean;
}

/**
 * 2번 영역 — 참여 기록 쿠키로 "이미 입장함"이 확인된 방문자에게 입력 폼 대신
 * 보여 주는 내 관람권. 방금 입장을 마친 직후에도 같은 자리에서 이 관람권이 대신한다.
 * 좌석 대신 점수가 크게 나오고, 좌석 번호는 꼬리표에 찍힌다.
 */
export const MyCompatibilitySummary = ({
  guest,
  ownerName,
  seat,
  showDuplicateNotice,
}: MyCompatibilitySummaryProps) => {
  const t = useTranslations("universe.detail");
  const title = ownerName
    ? t("myCompatibilityTitle", { name: ownerName })
    : t("myCompatibilityTitleFallback");
  const seatText = seat
    ? (formatSeatLabel(seat) ?? t("rowOnly", { row: seat.rowLabel }))
    : undefined;

  return (
    <section className={styles.section} id="screening-ticket">
      <h2 className={styles.title}>{title}</h2>

      {showDuplicateNotice && (
        <p className={styles.notice} role="status">
          {t("duplicateNotice")}
        </p>
      )}

      <ScreeningTicket
        isTorn
        kind={t("ticketKind")}
        title={guest.name}
        score={{ value: guest.score, unit: t("scoreUnit") }}
        note={guest.confidence === "estimated" ? t("estimatedNote") : undefined}
        stubLabel={t("ticketSeat")}
        stubValue={seatText}
      />

      <p className={styles.oneLiner}>{guest.oneLinerKo}</p>

      {guest.factors.length > 0 && (
        <details className={styles.factors} open>
          <summary className={styles.summary}>
            {t("drawerFactorsTitle")}
            <svg
              className={styles.caret}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m18 15-6-6-6 6" />
            </svg>
          </summary>
          <GuestFactors factors={guest.factors} />
        </details>
      )}
    </section>
  );
};
