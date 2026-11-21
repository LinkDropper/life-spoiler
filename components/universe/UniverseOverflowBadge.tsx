"use client";

import { useTranslations } from "next-intl";

import styles from "./UniverseOverflowBadge.module.css";

interface UniverseOverflowBadgeProps {
  /** 개별 렌더링되지 않은 친구 수 */
  hiddenCount: number;
  onSelect: () => void;
}

/**
 * 개별 렌더링 상한(30명)을 넘은 친구들을 나타내는 +N 배지.
 * 탭하면 전원이 텍스트로 나열된 궁합 순위 목록으로 이동한다.
 */
export const UniverseOverflowBadge = ({
  hiddenCount,
  onSelect,
}: UniverseOverflowBadgeProps) => {
  const t = useTranslations("universe.detail");

  return (
    <button
      type="button"
      className={styles.badge}
      onClick={onSelect}
      aria-label={t("overflowBadgeLabel", { count: hiddenCount })}
    >
      <span aria-hidden="true">
        {t("overflowBadge", { count: hiddenCount })}
      </span>
    </button>
  );
};
