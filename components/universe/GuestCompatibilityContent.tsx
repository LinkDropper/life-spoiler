"use client";

import { useTranslations } from "next-intl";

import { getTierLabelKo } from "@/libs/universe/tier";

import styles from "./GuestCompatibilityContent.module.css";

import type { UniverseGuestDto } from "@/libs/universe/types";

interface GuestCompatibilityContentProps {
  guest: UniverseGuestDto;
  /** 호출부 chrome에 맞춘 여백 등 추가 스타일 (예: 드로어 닫기 버튼 여백) */
  className?: string;
}

/**
 * 이름/점수/등급/한줄평/추정치 안내/factors breakdown을 보여주는 순수 콘텐츠.
 *
 * `GuestDetailDrawer`(궁합 순위 클릭 시 바텀시트)와 재방문 게스트에게 보여주는
 * 인라인 궁합 카드가 이 콘텐츠를 공유한다. chrome(배경/닫기버튼/애니메이션)은
 * 각 호출부가 담당하고, 이 컴포넌트는 콘텐츠만 그린다.
 */
export const GuestCompatibilityContent = ({
  guest,
  className,
}: GuestCompatibilityContentProps) => {
  const t = useTranslations("universe.detail");

  return (
    <div className={className}>
      <p className={styles.name}>{guest.name}</p>

      <div className={styles.scoreRow}>
        <span className={styles.score}>
          {t("scoreTag", { score: guest.score })}
        </span>
        <span className={styles.tier}>{getTierLabelKo(guest.tier)}</span>
      </div>

      <p className={styles.oneLiner}>{guest.oneLinerKo}</p>

      {guest.confidence === "estimated" && (
        <p className={styles.estimatedNote}>{t("estimatedStarAria")}</p>
      )}

      {guest.factors.length > 0 && (
        <div className={styles.factorsSection}>
          <p className={styles.factorsTitle}>{t("drawerFactorsTitle")}</p>
          <ul className={styles.factorList}>
            {guest.factors.map((factor) => (
              <li key={factor.label} className={styles.factorItem}>
                <div className={styles.factorHeader}>
                  <span className={styles.factorLabel}>{factor.label}</span>
                  {/*
                    "시간 정보" 안내 factor는 delta가 항상 0이다(계산에 기여하지
                    않는 UX 유도용 문구) — 의미 없는 "+0" 배지를 보여주지 않는다.
                  */}
                  {factor.delta !== 0 && (
                    <span
                      className={`${styles.factorDelta} ${factor.delta > 0 ? styles.factorDeltaPositive : styles.factorDeltaNegative}`}
                    >
                      {factor.delta > 0 ? `+${factor.delta}` : factor.delta}
                    </span>
                  )}
                </div>
                <p className={styles.factorDetail}>{factor.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
