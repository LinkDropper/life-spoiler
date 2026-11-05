"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import {
  ROW_ANCHOR_PREFIX,
  buildCreditsPlan,
  getRowAnchorId,
} from "@/libs/universe/credits";
import { formatSeatLabel } from "@/libs/universe/seat-map";

import styles from "./EndingCredits.module.css";

import type { CreditsEntry } from "@/libs/universe/credits";
import type { SeatMap } from "@/libs/universe/seat-map";
import type { UniverseGuestDto } from "@/libs/universe/types";

interface EndingCreditsProps {
  /** 점수 내림차순으로 정렬된 전체 목록 */
  guests: UniverseGuestDto[];
  selfStarSeed: string | null;
  seatMap: SeatMap;
  /**
   * 우주 전체가 estimated인지 (owner 시간 미상).
   * true면 모든 행이 estimated이므로 행마다 태그를 붙이지 않는다 — 고지는 1번 영역이 1회 한다.
   */
  isUniverseEstimated: boolean;
  /** 한줄평이 KO 고정임을 알리는 안내 노출 여부 (EN/JA 로케일) */
  showLocaleNotice: boolean;
  onGuestClick: (guest: UniverseGuestDto) => void;
}

const LIST_ID = "screening-credits-list";

/**
 * 4번 영역 — 엔딩 크레딧.
 *
 * 이 목록이 좌석 배치도의 공식 접근성 대체 구조다. 배치도는 열당 9석까지만
 * 그리지만 크레딧에는 전원이 나온다(5위까지만 펼치고 나머지는 접는다).
 * 좌석 배치도의 열 링크(`#screening-row-A`)가 가리키는 앵커도 여기서 단다.
 */
export const EndingCredits = ({
  guests,
  selfStarSeed,
  seatMap,
  isUniverseEstimated,
  showLocaleNotice,
  onGuestClick,
}: EndingCreditsProps) => {
  const t = useTranslations("universe.detail");
  const [isExpanded, setIsExpanded] = useState(false);
  const [scrollTargetId, setScrollTargetId] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const shouldFocusFoldedRef = useRef(false);

  const plan = buildCreditsPlan(guests, selfStarSeed);

  // 열마다 순위가 가장 높은 관객이 그 열의 앵커를 가진다
  const anchorIdByStarSeed = new Map<string, string>();
  const rowsWithAnchor = new Set<string>();
  guests.forEach((guest) => {
    const seat = seatMap.seatsByStarSeed.get(guest.starSeed);
    if (!seat || rowsWithAnchor.has(seat.rowLabel)) {
      return;
    }
    rowsWithAnchor.add(seat.rowLabel);
    anchorIdByStarSeed.set(guest.starSeed, getRowAnchorId(seat.rowLabel));
  });
  const foldedAnchorIds = new Set(
    plan.rest
      .filter((entry) => entry.isFolded)
      .map((entry) => anchorIdByStarSeed.get(entry.guest.starSeed))
      .filter((anchorId): anchorId is string => anchorId !== undefined)
  );
  const anchorIdsKey = Array.from(anchorIdByStarSeed.values()).join("|");
  const foldedAnchorIdsKey = Array.from(foldedAnchorIds).join("|");

  // 열 링크(해시 이동): 접힌 관객이면 펼친 뒤 그 자리로 간다
  useEffect(() => {
    const anchorIds = new Set(anchorIdsKey.split("|"));
    const foldedIds = new Set(foldedAnchorIdsKey.split("|"));

    const reveal = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));

      if (!id.startsWith(ROW_ANCHOR_PREFIX) || !anchorIds.has(id)) {
        return;
      }
      if (foldedIds.has(id)) {
        setIsExpanded(true);
      }
      setScrollTargetId(id);
    };

    reveal();
    window.addEventListener("hashchange", reveal);

    return () => window.removeEventListener("hashchange", reveal);
  }, [anchorIdsKey, foldedAnchorIdsKey]);

  useEffect(() => {
    if (!scrollTargetId) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    document.getElementById(scrollTargetId)?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
    setScrollTargetId(null);
  }, [scrollTargetId, isExpanded]);

  // 펼친 뒤에는 사라진 "더보기" 버튼 대신 새로 보이는 첫 행으로 포커스를 옮긴다
  useEffect(() => {
    if (!isExpanded || !shouldFocusFoldedRef.current) {
      return;
    }
    shouldFocusFoldedRef.current = false;
    listRef.current
      ?.querySelector<HTMLButtonElement>(`.${styles.folded} button`)
      ?.focus();
  }, [isExpanded]);

  const handleExpand = () => {
    shouldFocusFoldedRef.current = true;
    setIsExpanded(true);
  };

  const getSeatText = (starSeed: string): string => {
    const seat = seatMap.seatsByStarSeed.get(starSeed);

    if (!seat) {
      return "";
    }
    return formatSeatLabel(seat) ?? t("rowOnly", { row: seat.rowLabel });
  };

  const isEstimatedGuest = (guest: UniverseGuestDto): boolean =>
    !isUniverseEstimated && guest.confidence === "estimated";

  const getAriaLabel = (entry: CreditsEntry<UniverseGuestDto>): string => {
    const { guest } = entry;
    const details = [
      getSeatText(guest.starSeed),
      t("scoreTag", { score: guest.score }),
      ...(entry.isMine ? [t("meTag")] : []),
      ...(isEstimatedGuest(guest) ? [t("estimatedTag")] : []),
    ]
      .filter(Boolean)
      .join(", ");

    return t("creditAria", { rank: entry.rank, name: guest.name, details });
  };

  if (guests.length === 0) {
    return (
      <section className={styles.section}>
        <h2 className={styles.title}>{t("creditsTitle")}</h2>
        <div className={styles.empty} role="status">
          <b>{t("emptyTitle")}</b>
          <p>{t("emptyDescription")}</p>
        </div>
      </section>
    );
  }

  const [first, ...podium] = plan.best;

  const renderMeTag = () => <em className={styles.meTag}>{t("meTag")}</em>;

  const renderEstimated = (guest: UniverseGuestDto) =>
    isEstimatedGuest(guest) && (
      <small className={styles.estimated}>{t("estimatedTag")}</small>
    );

  return (
    <section className={styles.section} id="screening-credits">
      <h2 className={styles.title}>{t("creditsTitle")}</h2>

      {showLocaleNotice && (
        <p className={styles.localeNotice}>{t("localeNotice")}</p>
      )}

      <p className={styles.group}>{t("bestTitle")}</p>
      <div className={styles.best}>
        {first && (
          <button
            type="button"
            id={anchorIdByStarSeed.get(first.guest.starSeed)}
            className={`${styles.lead} ${first.isMine ? styles.mine : ""}`}
            aria-label={getAriaLabel(first)}
            onClick={() => onGuestClick(first.guest)}
          >
            <span className={styles.rankRow}>
              <b>{t("rankLabel", { rank: first.rank })}</b>
              <span className={styles.chip}>
                {getSeatText(first.guest.starSeed)}
              </span>
            </span>
            <span className={styles.leadMain}>
              <span className={styles.leadName}>
                {first.guest.name}
                {first.isMine && renderMeTag()}
              </span>
              <span className={styles.leadScore}>
                {first.guest.score}
                <small>{t("scoreUnit")}</small>
                {renderEstimated(first.guest)}
              </span>
            </span>
            <span className={styles.leadLine}>{first.guest.oneLinerKo}</span>
          </button>
        )}
        {podium.length > 0 && (
          <div
            className={`${styles.podium} ${podium.length === 1 ? styles.podiumSingle : ""}`}
          >
            {podium.map((entry) => (
              <button
                key={entry.guest.starSeed}
                type="button"
                id={anchorIdByStarSeed.get(entry.guest.starSeed)}
                className={`${styles.runner} ${entry.isMine ? styles.mine : ""}`}
                aria-label={getAriaLabel(entry)}
                onClick={() => onGuestClick(entry.guest)}
              >
                <span className={styles.rankRow}>
                  <b>{t("rankLabel", { rank: entry.rank })}</b>
                  <span className={styles.chip}>
                    {getSeatText(entry.guest.starSeed)}
                  </span>
                </span>
                <span className={styles.runnerName}>
                  {entry.guest.name}
                  {entry.isMine && renderMeTag()}
                </span>
                <span className={styles.runnerScore}>
                  {t("scoreTag", { score: entry.guest.score })}
                  {renderEstimated(entry.guest)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {plan.rest.length > 0 && (
        <>
          <p className={styles.group}>{t("othersTitle")}</p>
          <ul
            ref={listRef}
            id={LIST_ID}
            className={`${styles.list} ${isExpanded ? styles.expanded : ""}`}
          >
            {plan.rest.map((entry) => (
              <li
                key={entry.guest.starSeed}
                id={anchorIdByStarSeed.get(entry.guest.starSeed)}
                className={[
                  styles.item,
                  entry.isMine ? styles.mine : "",
                  entry.isFolded ? styles.folded : "",
                  entry.isDetached ? styles.detached : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <button
                  type="button"
                  className={styles.row}
                  aria-label={getAriaLabel(entry)}
                  onClick={() => onGuestClick(entry.guest)}
                >
                  <span className={styles.rank}>{entry.rank}</span>
                  <span className={styles.name}>
                    {entry.guest.name}
                    {entry.isMine && renderMeTag()}
                    <small className={styles.seatText}>
                      {getSeatText(entry.guest.starSeed)}
                    </small>
                    {renderEstimated(entry.guest)}
                  </span>
                  <span className={styles.score}>
                    {t("scoreTag", { score: entry.guest.score })}
                  </span>
                  <span className={styles.line}>{entry.guest.oneLinerKo}</span>
                </button>
              </li>
            ))}
          </ul>
          {plan.foldedCount > 0 && !isExpanded && (
            <button
              type="button"
              className={styles.more}
              aria-expanded={isExpanded}
              aria-controls={LIST_ID}
              onClick={handleExpand}
            >
              {t("creditsMore", { count: plan.foldedCount })}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          )}
        </>
      )}
    </section>
  );
};
