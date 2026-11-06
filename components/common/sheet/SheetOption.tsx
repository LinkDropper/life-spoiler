"use client";

import { Check } from "lucide-react";

import styles from "./SheetRows.module.css";

interface SheetOptionProps {
  label: string;
  /** 라벨 아래 보조 한 줄 (예: 생년월일) */
  description?: string;
  /** 라벨의 언어 (언어 목록처럼 행마다 언어가 다를 때) */
  lang?: string;
  isSelected: boolean;
  /** aria-disabled로 두어 포커스는 받되 누를 수 없다 */
  isDisabled?: boolean;
  /** 시트가 열릴 때 처음 포커스를 받는 행 */
  isInitialFocus?: boolean;
  onSelect: () => void;
}

/** 시트 목록의 선택 행 한 줄 */
export const SheetOption = ({
  label,
  description,
  lang,
  isSelected,
  isDisabled = false,
  isInitialFocus = false,
  onSelect,
}: SheetOptionProps) => {
  const handleClick = () => {
    if (!isDisabled) {
      onSelect();
    }
  };

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      aria-disabled={isDisabled || undefined}
      data-autofocus={isInitialFocus ? "" : undefined}
      lang={lang}
      className={`${styles.row} ${description ? styles.rowTwoLine : ""}`}
      onClick={handleClick}
    >
      <span className={styles.label}>
        {label}
        {description && (
          <span className={styles.description}>{description}</span>
        )}
      </span>
      {isSelected && (
        <Check
          size={20}
          strokeWidth={2.4}
          className={styles.check}
          aria-hidden="true"
        />
      )}
    </button>
  );
};
