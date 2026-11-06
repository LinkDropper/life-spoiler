"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import type { CompatibilityLineupItem } from "@/libs/fortune/compatibility-screen";
import { getStarImagePath } from "@/libs/utils";

import { getRelationshipLabel } from "./utils";
import styles from "./LineupCard.module.css";

interface LineupCardProps {
  item: CompatibilityLineupItem;
  onMore: () => void;
}

/**
 * 공동 주연작 한 편: 두 주성 그림 · 두 이름 · 장르 · 케미 점수 · 본편 한 줄.
 * 카드 전체가 상영 링크이고, ⋯(관리)는 링크 밖 버튼이다.
 */
export const LineupCard = ({ item, onMore }: LineupCardProps) => {
  const t = useTranslations("compatibility.lineup");
  const tCard = useTranslations("compatibility.card");
  const tC = useTranslations("fortune.screen.compatibility");
  const relation =
    item.relationshipType === "custom" && item.relationshipCustom
      ? item.relationshipCustom
      : getRelationshipLabel(item.relationshipType, tCard);

  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <span
          className={`${styles.badge} ${item.isOwned ? styles.badgeOwned : styles.badgeTrailer}`}
        >
          {item.isOwned ? t("owned") : t("trailer")}
        </span>
        <span className={styles.genre}>
          {tC(`genre.${item.genre}`)} · {relation}
        </span>
        <button
          type="button"
          className={styles.more}
          onClick={onMore}
          aria-label={t("moreAria", { a: item.nameA, b: item.nameB })}
        >
          <MoreHorizontal size={20} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.cast}>
        <span className={styles.stars} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element -- 주성 그림(정적 PNG) */}
          <img
            src={getStarImagePath(item.starKeyA ?? "")}
            alt=""
            width={56}
            height={31}
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- 주성 그림(정적 PNG) */}
          <img
            src={getStarImagePath(item.starKeyB ?? "")}
            alt=""
            width={56}
            height={31}
          />
        </span>
        <span className={styles.names}>
          <b>
            <span className={styles.nameA}>{item.nameA}</span>
            <span className={styles.times} aria-hidden="true">
              {" "}
              ×{" "}
            </span>
            <span className={styles.nameB}>{item.nameB}</span>
          </b>
          <span className={styles.costar}>CO-STARRING</span>
        </span>
        <span className={styles.score}>
          <span>CHEMISTRY</span>
          <b className={item.score === null ? styles.scoreEmpty : undefined}>
            {item.score ?? "?"}
          </b>
        </span>
      </div>

      {item.headline ? (
        <p className={styles.line}>“{item.headline}”</p>
      ) : (
        <p className={`${styles.line} ${styles.lineEmpty}`}>
          {t("noScoreLine")}
        </p>
      )}

      {/* 카드 전체를 덮는 상영 링크 (⋯ 버튼만 위에 남는다) */}
      <Link href={item.href} className={styles.open}>
        {item.isOwned ? t("openOwned") : t("openTrailer")}
        <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
};
