"use client";

import styles from "./SheetRows.module.css";

import type { KeyboardEvent, ReactNode } from "react";

interface SheetListProps {
  /** 스크린리더가 읽는 목록 이름 (보통 시트 제목) */
  label: string;
  /** 여러 개를 고르는 목록 (궁합 프로필 선택) */
  isMultiple?: boolean;
  children: ReactNode;
}

/** 시트 안 선택 목록. ↑↓·Home·End로 행을 옮겨 다닌다 */
export const SheetList = ({
  label,
  isMultiple = false,
  children,
}: SheetListProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) {
      return;
    }
    event.preventDefault();
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>("[role='option']")
    );
    if (items.length === 0) {
      return;
    }
    const index = items.findIndex((item) => item === document.activeElement);
    let nextIndex = 0;
    if (event.key === "ArrowDown") {
      nextIndex = (index + 1) % items.length;
    } else if (event.key === "ArrowUp") {
      nextIndex = (index - 1 + items.length) % items.length;
    } else if (event.key === "End") {
      nextIndex = items.length - 1;
    }
    items[nextIndex]?.focus();
  };

  return (
    <div
      className={styles.list}
      role="listbox"
      aria-label={label}
      aria-multiselectable={isMultiple || undefined}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
};
