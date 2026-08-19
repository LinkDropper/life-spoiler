"use client";

import { useTranslations } from "next-intl";

import styles from "./UniverseOwnerSummary.module.css";

interface UniverseOwnerSummaryProps {
  ownerName: string | null;
  guestCount: number;
  /** 우주 전체가 estimated인지 (owner 시간 미상) */
  isUniverseEstimated: boolean;
  /**
   * owner 본인의 운세 한줄평 원문.
   * 엔진 테이블에서 오는 KO 데이터라 번역키를 거치지 않는다(친구 한줄평과 동일 정책).
   * 친구가 0명이거나 이름 미입력이어도 항상 채워져 있다 — 1인 명반만으로 산출되기 때문이다.
   */
  ownerOneLinerKo: string;
  /**
   * 전체 우주 중 별(친구) 개수 순위. 친구가 0명이면 null — "별을 하나라도 추가한
   * 사람"에게만 노출한다는 요구사항을 서버가 이 필드 하나로 표현한다.
   */
  guestCountRank: number | null;
}

/**
 * 1번 영역 — owner 요약 (읽기 전용).
 *
 * owner의 생년월일시는 응답에 아예 담기지 않으므로 여기서 표시할 수 없다(개인정보 B안).
 * 표시 이름이 없으면 중립 문구로 대체한다.
 *
 * owner 한줄평은 무료 바이럴 기능의 티저다. 상세 해석/복수 문장을 덧붙이지 않고
 * 딱 한 줄만 노출한다 — 유료 상품(인생 운세 등)을 잠식하지 않기 위한 CPO 확정 사항이다.
 */
export const UniverseOwnerSummary = ({
  ownerName,
  guestCount,
  isUniverseEstimated,
  ownerOneLinerKo,
  guestCountRank,
}: UniverseOwnerSummaryProps) => {
  const t = useTranslations("universe.detail");

  return (
    <section className={styles.section}>
      <div className={styles.card}>
        {/*
          별을 하나라도 보유한 우주에만 노출한다(요구사항 원문: "별을 하나라도
          추가한 사람이라면"). 카드 맨 위에 둬서 가장 먼저 읽히게 한다.
        */}
        {guestCountRank !== null && (
          <p className={styles.rankBadge}>
            {ownerName
              ? t("guestCountRankWithName", {
                  name: ownerName,
                  rank: guestCountRank,
                })
              : t("guestCountRank", { rank: guestCountRank })}
          </p>
        )}

        {/*
          h1의 heading level·텍스트는 그대로 유지한다(스크린리더/SEO).
          시각적 축소는 .eyebrow 클래스의 CSS로만 처리한다.
        */}
        <div className={styles.eyebrowRow}>
          <span className={styles.miniStar} aria-hidden="true" />
          <h1 className={styles.eyebrow}>
            {ownerName
              ? t("ownerTitle", { name: ownerName })
              : t("ownerTitleFallback")}
          </h1>
        </div>

        <p className={styles.headline}>{ownerOneLinerKo}</p>

        <p className={styles.statPill}>
          {t("guestCount", { count: guestCount })}
        </p>

        {/*
          우주 단위 고지는 여기(섹션1 배너)와 섹션3 캡션에서만 1회씩 한다.
          리스트 각 행이나 별 자체에는 반복하지 않는다. owner가 estimated여도
          한줄평 자체에는 별도 고지를 덧붙이지 않는다(중복 고지 방지).
        */}
        {isUniverseEstimated && (
          <p className={styles.estimatedBanner}>
            {t("estimatedUniverseBanner")}
          </p>
        )}
      </div>
    </section>
  );
};
