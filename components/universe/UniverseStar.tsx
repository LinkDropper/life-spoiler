"use client";

import { useTranslations } from "next-intl";

import { getStarPlacement, getStarVisual } from "@/libs/universe/star-visual";
import { getTierLabelKo } from "@/libs/universe/tier";

import styles from "./UniverseStar.module.css";

interface UniverseStarProps {
  starSeed: string;
  name: string;
  /** 정수, 실사용 범위 12~99 */
  score: number;
  /** 등급 슬러그 — aria-label에는 한국어 라벨로 노출 */
  tier: string;
  /**
   * 등록 시점에 서버가 산출해 DB에 영구 저장한 좌표(컨테이너 기준 비율, 0~1).
   * 오버플로 본인 별은 이 값을 무시하고 항상 고정 궤도를 렌더에 쓴다.
   */
  posXRatio: number;
  posYRatio: number;
  /** 표시용 1-based 순위 */
  rank: number;
  totalCount: number;
  /** 방금 등록한 본인 별 */
  isSelf: boolean;
  /** 30위 밖인데도 개별 렌더링되는 본인 별 */
  isOverflowSelf: boolean;
  /**
   * 이 친구 **한 명만** 시간 미상인 경우 (우주 전체 estimated는 제외).
   *
   * 우주 전체가 estimated면 섹션3 컨테이너 aria-label이 1회 고지하므로
   * 여기서 반복하지 않는다. 반복하면 스크린리더가 30번 읽는다.
   */
  isEstimatedIndividually: boolean;
  onSelect: (starSeed: string) => void;
}

/**
 * 개별 친구 별.
 *
 * 별의 크기/밝기는 점수에서 연속적으로 파생된다. **본인 별이라고 해서 크기를
 * 부풀리지 않는다** — 점수를 속여 크게 보이면 "궁합 점수가 곧 서사"라는 신뢰가 깨진다.
 * 본인 식별은 크기가 아니라 outline/pulse/aria-label 접두라는 별도 레이어로 한다.
 *
 * 시각 레이어는 `.core` span(및 그 `::before`/`::after`)으로 분리하고
 * 버튼 자체는 44px 히트 영역을 유지한다.
 */
export const UniverseStar = ({
  starSeed,
  name,
  score,
  tier,
  posXRatio,
  posYRatio,
  rank,
  totalCount,
  isSelf,
  isOverflowSelf,
  isEstimatedIndividually,
  onSelect,
}: UniverseStarProps) => {
  const t = useTranslations("universe.detail");

  const visual = getStarVisual(score);
  const placement = getStarPlacement(
    starSeed,
    { xRatio: posXRatio, yRatio: posYRatio },
    isOverflowSelf
  );
  /*
    스파이크/플레어 형태 강도를 직경(10~32px)에서 0~1로 정규화한다.
    CSS calc()의 길이÷길이 나눗셈(Values Level 4)에 기대는 대신 여기서 직접 계산해
    구형 WebKit 등에서도 항상 동작하게 한다. getStarVisual 자체는 건드리지 않고
    이미 나온 diameterPx만 소비한다.
  */
  const shapeIntensity = (visual.diameterPx - 10) / 22;

  const description = t("starLabel", {
    name,
    score,
    tier: getTierLabelKo(tier),
    total: totalCount,
    rank,
  });
  const baseLabel = isSelf ? `${t("meLabel")} ${description}` : description;
  const ariaLabel = isEstimatedIndividually
    ? `${baseLabel}, ${t("estimatedStarAria")}`
    : baseLabel;

  const handleClick = () => {
    onSelect(starSeed);
  };

  return (
    <button
      type="button"
      className={`${styles.star} ${isSelf ? styles.self : ""}`}
      style={
        {
          "--star-left": `${placement.leftRatio * 100}%`,
          "--star-top": `${placement.topRatio * 100}%`,
          "--star-size": `${visual.diameterPx}px`,
          "--star-opacity": visual.coreOpacity,
          "--star-glow-blur": `${visual.glowBlurPx}px`,
          "--star-glow-spread": `${visual.glowSpreadPx}px`,
          "--star-glow-alpha": visual.glowAlpha,
          "--star-twinkle-delay": `${placement.twinkleDelaySeconds}s`,
          "--star-float-delay": `${placement.floatDelaySeconds}s`,
          "--star-shape-intensity": shapeIntensity,
        } as React.CSSProperties
      }
      onClick={handleClick}
      aria-label={ariaLabel}
    >
      {/*
        시각 레이어를 실제 DOM 요소로 분리한다 (기존에는 button::before였다).
        core 자신이 ::before(비대칭 캐치라이트 점) pseudo-element를 더 가져
        원 하나짜리 형태에서 "반짝이는 별"로 읽히게 한다.
      */}
      <span className={styles.core} aria-hidden="true" />
      <span className={styles.name} aria-hidden="true">
        {name}
      </span>
    </button>
  );
};
