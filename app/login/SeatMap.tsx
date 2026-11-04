"use client";

import { useTranslations } from "next-intl";

import styles from "./SeatMap.module.css";

const ROWS = ["A", "B", "C", "D", "E", "F"] as const;
const SEATS_PER_ROW = 9;
/** 장식용 "내 자리". 사용자 데이터와 관계없이 모두에게 같은 자리다 */
const MY_ROW = "E";
const MY_SEAT_INDEX = 4;

/**
 * 로그인 = 상영관에 내 자리 잡기. 스크린을 향한 좌석 배치도에서 한 자리만 빛난다.
 * 장식이라 스크린리더에는 한 문장으로만 읽힌다.
 */
export const SeatMap = () => {
  const t = useTranslations("login");

  return (
    <div className={styles.map} role="img" aria-label={t("seatMapAriaLabel")}>
      <div className={styles.screen} aria-hidden="true">
        <span className={styles.screenLabel}>{t("screen")}</span>
      </div>
      <div className={styles.rows} aria-hidden="true">
        {ROWS.map((row, rowIndex) => (
          <div key={row} className={styles.row}>
            <span className={styles.rowLabel}>{row}</span>
            {Array.from({ length: SEATS_PER_ROW }, (_, index) => {
              const isMine = row === MY_ROW && index === MY_SEAT_INDEX;
              return (
                <span
                  key={index}
                  className={isMine ? styles.mySeat : styles.seat}
                  // 뒤로 갈수록 조금씩 밝게
                  style={
                    isMine ? undefined : { opacity: 0.55 + rowIndex * 0.08 }
                  }
                />
              );
            })}
            <span className={styles.rowLabel} />
          </div>
        ))}
      </div>
      <p className={styles.legend} aria-hidden="true">
        <span className={styles.legendSeat} />
        {t("mySeat")}
      </p>
    </div>
  );
};
