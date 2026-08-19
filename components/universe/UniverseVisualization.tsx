"use client";

import { useTranslations } from "next-intl";

import { MAX_RENDERED_STARS } from "@/libs/universe/constants";
import { OWNER_STAR_VISUAL } from "@/libs/universe/star-visual";

import { UniverseOverflowBadge } from "./UniverseOverflowBadge";
import { UniverseStar } from "./UniverseStar";
import styles from "./UniverseVisualization.module.css";

import type { UniverseGuestDto } from "@/libs/universe/types";

interface UniverseVisualizationProps {
  ownerName: string | null;
  /** 점수 내림차순 정렬된 전체 목록 */
  guests: UniverseGuestDto[];
  /** 방금 등록한 본인 별의 starSeed */
  selfStarSeed: string | null;
  /** 우주 전체가 estimated인지 (owner 시간 미상) */
  isUniverseEstimated: boolean;
  /** 별/배지 탭 시 궁합 순위 목록으로 이동 */
  onSelectStar: (starSeed: string | null) => void;
}

/**
 * 3번 영역 — 우주 시각화.
 *
 * SVG/Canvas/WebGL을 쓰지 않고 DOM `<button>` + CSS로만 구현한다(접근성/번들 사이즈).
 * 별 위치는 `star_seed` 기반 결정론적 계산이라 새로고침·재정렬에도 흔들리지 않는다.
 * 시각화의 공식 접근성 대체 구조는 4번 영역의 순위 목록이므로, 여기서 숨김 리스트를
 * 이중으로 만들지 않는다.
 */
export const UniverseVisualization = ({
  ownerName,
  guests,
  selfStarSeed,
  isUniverseEstimated,
  onSelectStar,
}: UniverseVisualizationProps) => {
  const t = useTranslations("universe.detail");

  /*
    우주 제목은 이름 유무에 따라 문장 구조가 다르다("OO님의 우주" vs "누군가의 우주").
    그래서 맨 이름이 아니라 **이미 조합된 제목**을 aria 문장에 보간한다.
    맨 이름을 넣으면 이름이 없을 때 "누군가의 우주의 우주"처럼 읽힌다.
  */
  const universeTitle = ownerName
    ? t("ownerTitle", { name: ownerName })
    : t("ownerTitleFallback");

  /*
    우주 전체가 estimated면 컨테이너 aria-label에서 **1회만** 고지한다.
    개별 별 label에 넣으면 스크린리더가 30번 반복해서 읽는다.
  */
  const sectionLabel = isUniverseEstimated
    ? t("estimatedUniverseAria", { title: universeTitle })
    : t("visualizationLabel");

  const rendered = guests.slice(0, MAX_RENDERED_STARS);
  const selfIndex = selfStarSeed
    ? guests.findIndex((guest) => guest.starSeed === selfStarSeed)
    : -1;

  // 방금 등록한 본인 별이 30위 밖이어도 반드시 개별 렌더링한다.
  // 자기 별이 안 보이면 그 사용자에게는 이 기능이 실패이고 재공유 동기가 사라진다.
  const isSelfOutsideRendered = selfIndex >= MAX_RENDERED_STARS;
  const hiddenCount = Math.max(guests.length - MAX_RENDERED_STARS, 0);

  return (
    <section className={styles.section} aria-label={sectionLabel}>
      {/* 캔버스 내부가 아니라 별밭 바로 위에 둔다 */}
      {isUniverseEstimated && (
        <p className={styles.estimatedCaption} aria-hidden="true">
          {t("estimatedUniverseCaption")}
        </p>
      )}

      <div className={styles.canvas}>
        <div
          className={styles.ownerStar}
          style={
            {
              "--owner-size": `${OWNER_STAR_VISUAL.diameterPx}px`,
              "--owner-glow-blur": `${OWNER_STAR_VISUAL.glowBlurPx}px`,
              "--owner-glow-spread": `${OWNER_STAR_VISUAL.glowSpreadPx}px`,
              "--owner-glow-alpha": OWNER_STAR_VISUAL.glowAlpha,
            } as React.CSSProperties
          }
        >
          {/*
            friend 별과 같은 core+헤일로 구조(안 A)를 쓰되 강도는 고정값이다(점수 매핑이
            없으므로 크기별 calc 스케일이 아니라 friend 최대치보다 진하게 박아 위계를 만든다).
          */}
          <span className={styles.ownerCore} aria-hidden="true" />
          {/* 이름이 없으면 pill을 아예 띄우지 않는다.
              "누군가의 우주" 같은 문장을 별 이름표에 넣으면 이름처럼 읽히지 않는다. */}
          {ownerName && <span className={styles.ownerName}>{ownerName}</span>}
        </div>

        {rendered.map((guest, index) => (
          <UniverseStar
            key={guest.starSeed}
            starSeed={guest.starSeed}
            name={guest.name}
            score={guest.score}
            tier={guest.tier}
            posXRatio={guest.posXRatio}
            posYRatio={guest.posYRatio}
            rank={index + 1}
            totalCount={guests.length}
            isSelf={guest.starSeed === selfStarSeed}
            isOverflowSelf={false}
            isEstimatedIndividually={
              !isUniverseEstimated && guest.confidence === "estimated"
            }
            onSelect={onSelectStar}
          />
        ))}

        {/* 링 군집과 오버플로 본인 별을 잇는 장식선 (별보다 먼저 그려 아래에 깔린다) */}
        {isSelfOutsideRendered && (
          <span className={styles.overflowTether} aria-hidden="true" />
        )}

        {isSelfOutsideRendered && (
          <UniverseStar
            key={guests[selfIndex].starSeed}
            starSeed={guests[selfIndex].starSeed}
            name={guests[selfIndex].name}
            score={guests[selfIndex].score}
            tier={guests[selfIndex].tier}
            posXRatio={guests[selfIndex].posXRatio}
            posYRatio={guests[selfIndex].posYRatio}
            rank={selfIndex + 1}
            totalCount={guests.length}
            isSelf
            isOverflowSelf
            isEstimatedIndividually={
              !isUniverseEstimated &&
              guests[selfIndex].confidence === "estimated"
            }
            onSelect={onSelectStar}
          />
        )}

        {hiddenCount > 0 && (
          <UniverseOverflowBadge
            hiddenCount={hiddenCount}
            onSelect={() => onSelectStar(null)}
          />
        )}
      </div>

      {/* 별 크기/밝기가 곧 궁합 점수라는 걸 시각만으로는 못 읽는 사용자를 위한 범례 */}
      <p className={styles.legend}>{t("visualizationLegend")}</p>
    </section>
  );
};
