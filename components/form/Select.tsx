"use client";

import { useCallback, useRef, useState } from "react";

import { OptionSheet } from "./OptionSheet";
import styles from "./Select.module.css";

import type { OptionSheetOption } from "./OptionSheet";

export type SelectOption = OptionSheetOption;

interface SelectProps {
  label: string;
  name: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  /** 화면에는 라벨을 숨기고 스크린리더에만 읽힌다 */
  isLabelHidden?: boolean;
  /**
   * field: Input과 같은 입력칸 모양(기본)
   * plain: 테두리·배경 없이 primary 글자만 (제목 앞머리처럼 쓰는 곳)
   */
  variant?: "field" | "plain";
  /** 드로어 제목. 없으면 label을 쓴다 */
  sheetTitle?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * 서비스 공용 셀렉트.
 * 트리거는 Input과 같은 디자인 토큰(높이 52px, 테두리, 둥근 모서리 8px)이고,
 * 옵션은 헤더 언어 선택과 같은 하단 드로어(OptionSheet)로 연다.
 * 네이티브 옵션 목록은 OS가 그려 서비스 스타일을 입힐 수 없어서 직접 그린다.
 * 트리거는 포커스·눌림 상태에서 모양이 바뀌지 않는다(디자인 결정).
 */
export const Select = ({
  label,
  name,
  value,
  options,
  onChange,
  isLabelHidden = false,
  variant = "field",
  sheetTitle,
  disabled,
  className,
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = options.find((option) => option.value === value);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // 닫히면 연 버튼으로 포커스를 돌려준다
    triggerRef.current?.focus();
  }, []);

  const handleSelect = (nextValue: string) => {
    if (nextValue !== value) {
      onChange(nextValue);
    }
    handleClose();
  };

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(" ")}>
      <span
        className={isLabelHidden ? styles.srOnly : styles.label}
        aria-hidden="true"
      >
        {label}
      </span>
      <button
        ref={triggerRef}
        id={name}
        type="button"
        className={`${styles.trigger} ${variant === "plain" ? styles.plain : ""}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        // 라벨과 지금 고른 값을 함께 읽는다 (예: "상영할 프로필 고르기, 지수님의 인생")
        aria-label={selected ? `${label}, ${selected.label}` : label}
        disabled={disabled}
        onClick={() => setIsOpen(true)}
      >
        <span className={styles.value}>{selected?.label ?? ""}</span>
        <svg
          className={styles.chevron}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path
            d="M4 6l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <OptionSheet
        isOpen={isOpen}
        title={sheetTitle ?? label}
        options={options}
        selectedValue={value}
        onSelect={handleSelect}
        onClose={handleClose}
      />
    </div>
  );
};
