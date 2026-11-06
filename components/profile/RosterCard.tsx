"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { FILMOGRAPHY_KEYS, type RosterItem } from "@/libs/profile/cast-roster";

import styles from "./RosterCard.module.css";

interface RosterCardProps {
  item: RosterItem;
  /** 생년월일 · 양력 · 성별 한 줄 */
  profileLine: string;
  /** 없으면 ⋯(관리)를 그리지 않는다 */
  onMore?: () => void;
  /** 오늘의 운세 계측처럼 누를 때 함께 할 일 */
  onOpen?: () => void;
}

/**
 * 출연진 명단의 배우 한 명: 이름 첫 글자 · 이름 · 생년월일 · 그 운세의 상태 · 필모그래피 칩.
 * 카드 전체가 상영 링크이고, ⋯(관리)는 링크 밖 버튼이다.
 */
export const RosterCard = ({
  item,
  profileLine,
  onMore,
  onOpen,
}: RosterCardProps) => {
  const t = useTranslations("profiles.roster");

  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <span className={styles.monogram} aria-hidden="true">
          {item.name.slice(0, 1)}
        </span>
        <span className={styles.who}>
          <span className={styles.nameRow}>
            <b className={styles.name}>{item.name}</b>
            {item.isOwn && <span className={styles.me}>{t("me")}</span>}
          </span>
          <span className={styles.line}>{profileLine}</span>
        </span>
        <span className={`${styles.state} ${styles[item.state]}`}>
          {item.state === "owned" || item.state === "trailer" ? (
            <span className={styles.stateCode}>{t(`state.${item.state}`)}</span>
          ) : null}
          <Link href={item.href} className={styles.open} onClick={onOpen}>
            {t(`open.${item.state}`, { name: item.name })}
          </Link>
        </span>
        {onMore && (
          <button
            type="button"
            className={styles.more}
            onClick={onMore}
            aria-label={t("moreAria", { name: item.name })}
          >
            <MoreHorizontal size={20} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className={styles.films}>
        <span className={styles.filmsLabel}>FILMOGRAPHY</span>
        <ul className={styles.chips}>
          {FILMOGRAPHY_KEYS.map((key) => {
            const isOwned = item.filmography[key];
            return (
              <li
                key={key}
                className={`${styles.chip} ${isOwned ? styles.chipOn : ""}`}
              >
                <span className={styles.srOnly}>
                  {isOwned ? t("filmOwned") : t("filmNone")}
                </span>
                {t(`films.${key}`)}
              </li>
            );
          })}
        </ul>
      </div>
    </article>
  );
};
