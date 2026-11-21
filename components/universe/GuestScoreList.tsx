"use client";

import { useTranslations } from "next-intl";

import { getTierLabelKo } from "@/libs/universe/tier";

import styles from "./GuestScoreList.module.css";

import type { UniverseGuestDto } from "@/libs/universe/types";

interface GuestScoreListProps {
  /** 점수 내림차순 정렬된 전체 목록 */
  guests: UniverseGuestDto[];
  selfStarSeed: string | null;
  /**
   * 우주 전체가 estimated인지 (owner 시간 미상).
   *
   * true면 모든 행이 estimated이므로 **행마다 태그를 붙이지 않는다.**
   * 별 30개에 같은 태그가 전부 붙으면 정보가 아니라 벽지가 된다.
   * 이 경우 고지는 섹션1 배너와 섹션3 캡션이 우주 단위로 1회만 담당한다.
   */
  isUniverseEstimated: boolean;
  /** 한줄평/등급이 KO 고정임을 알리는 안내 노출 여부 (EN/JA 로케일) */
  showLocaleNotice: boolean;
  onShareClick: () => void;
  /** 항목 클릭 시 궁합 정보를 간략히 보여주는 드로어를 연다 */
  onGuestClick: (guest: UniverseGuestDto) => void;
}

/**
 * 4번 영역 — 궁합 점수·한줄평 리스트.
 *
 * 이 목록이 우주 시각화의 **공식 접근성 대체 구조**다. 별도 숨김 리스트를 이중으로
 * 만들지 않고, 여기서 순위/이름/등급/점수/한줄평을 전부 텍스트로 제공한다.
 * 시각화에는 최대 30명만 렌더링되지만 이 목록에는 전원이 나온다.
 */
export const GuestScoreList = ({
  guests,
  selfStarSeed,
  isUniverseEstimated,
  showLocaleNotice,
  onShareClick,
  onGuestClick,
}: GuestScoreListProps) => {
  const t = useTranslations("universe.detail");

  if (guests.length === 0) {
    return (
      <section className={styles.section} id="universe-ranking">
        <h2 className={styles.title}>{t("listTitle")}</h2>
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>{t("emptyTitle")}</p>
          <p className={styles.emptyDescription}>{t("emptyDescription")}</p>
          <button
            type="button"
            className={styles.emptyShare}
            onClick={onShareClick}
          >
            {t("shareButton")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section} id="universe-ranking">
      <h2 className={styles.title}>{t("listTitle")}</h2>

      {showLocaleNotice && (
        <p className={styles.localeNotice}>{t("localeNotice")}</p>
      )}

      <ol className={styles.list}>
        {guests.map((guest, index) => {
          const isSelf = guest.starSeed === selfStarSeed;
          // 우주 전체가 estimated면 배너/캡션이 이미 고지했으므로 행에는 붙이지 않는다.
          // 이 친구 한 명만 시간 미상일 때만 태그 칩을 노출한다.
          const showEstimatedTag =
            !isUniverseEstimated && guest.confidence === "estimated";
          // 1~3위만 카드/배지로 강조한다. 순위 숫자는 listItemMeta 문장에 이미
          // 있으므로 배지는 장식(aria-hidden)이고 중복 안내하지 않는다.
          const topRank = index < 3 ? index + 1 : null;

          return (
            <li
              key={guest.starSeed}
              id={`guest-${guest.starSeed}`}
              className={`${styles.item} ${isSelf ? styles.selfItem : ""} ${topRank ? styles[`topRank${topRank}`] : ""}`}
            >
              {/*
                항목 전체를 버튼으로 감싸 궁합 정보 드로어를 연다(GuestDetailDrawer).
                li는 스크롤 타겟(id)과 카드 배경을 유지하고, 인터랙션은 button이 담당한다
                — li 자체를 클릭 가능하게 만들면 스크린리더/키보드 포커스가 애매해진다.
              */}
              <button
                type="button"
                className={styles.itemButton}
                onClick={() => onGuestClick(guest)}
              >
                <div className={styles.itemHeader}>
                  <p className={styles.itemHeading}>
                    {topRank && (
                      <span
                        className={`${styles.rankBadge} ${styles[`rankBadge${topRank}`]}`}
                        aria-hidden="true"
                      >
                        {topRank}
                      </span>
                    )}
                    {isSelf && (
                      <span className={styles.meBadge}>{t("meLabel")}</span>
                    )}
                    {t("listItemMeta", {
                      rank: index + 1,
                      name: guest.name,
                      tier: getTierLabelKo(guest.tier),
                    })}
                    {showEstimatedTag && (
                      <span className={styles.estimatedTag}>
                        {t("estimatedTag")}
                      </span>
                    )}
                  </p>
                  {/* 궁합 점수는 우측 상단에 태그처럼 별도로 노출한다 */}
                  <span className={styles.scoreTag}>
                    {t("scoreTag", { score: guest.score })}
                  </span>
                </div>
                <p className={styles.oneLiner}>{guest.oneLinerKo}</p>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
};
