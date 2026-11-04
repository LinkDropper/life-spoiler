import styles from "./GuestFactors.module.css";

import type { UniverseGuestDto } from "@/libs/universe/types";

interface GuestFactorsProps {
  factors: UniverseGuestDto["factors"];
}

/** 궁합 근거 줄 목록 (축 이름 + 기여도 + 판정 문장). 내 관람권과 드로어가 공유한다 */
export const GuestFactors = ({ factors }: GuestFactorsProps) => (
  <ul className={styles.list}>
    {factors.map((factor) => (
      <li key={factor.label} className={styles.item}>
        <b className={styles.label}>{factor.label}</b>
        {/*
          "시간 정보" 안내 factor는 delta가 항상 0이다(계산에 기여하지 않는
          UX 유도용 문구) — 의미 없는 "+0"을 보여주지 않는다.
        */}
        {factor.delta !== 0 && (
          <em
            className={`${styles.delta} ${factor.delta < 0 ? styles.negative : ""}`}
          >
            {factor.delta > 0
              ? `+${factor.delta}`
              : `−${Math.abs(factor.delta)}`}
          </em>
        )}
        <p className={styles.detail}>{factor.detail}</p>
      </li>
    ))}
  </ul>
);
