"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import styles from "./OptionSheet.module.css";

import type { KeyboardEvent, MouseEvent } from "react";

export interface OptionSheetOption {
  value: string;
  label: string;
}

interface OptionSheetProps {
  isOpen: boolean;
  title: string;
  options: OptionSheetOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

/**
 * 서비스 공용 선택 드로어 — 아래에서 올라오는 시트에서 하나를 고른다.
 * 헤더 언어 선택(LanguageDrawer)과 공용 Select가 함께 쓴다.
 * 열리면 선택된 항목으로 포커스가 가고, ↑↓로 이동, Esc·바깥 누르기로 닫힌다.
 * 포커스를 되돌리는 일은 여는 쪽(트리거)이 맡는다.
 */
export const OptionSheet = ({
  isOpen,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: OptionSheetProps) => {
  const titleId = useId();
  const [isMounted, setIsMounted] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 열려 있는 동안 뒤 페이지가 스크롤되지 않게
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // 열리면 선택된 항목(없으면 첫 항목)으로 포커스
  useEffect(() => {
    if (!isOpen || !isMounted) {
      return;
    }
    const items =
      listRef.current?.querySelectorAll<HTMLButtonElement>("[role='option']");
    const selected = Array.from(items ?? []).find(
      (item) => item.getAttribute("aria-selected") === "true"
    );
    (selected ?? items?.[0])?.focus();
  }, [isOpen, isMounted]);

  if (!isMounted || !isOpen) {
    return null;
  }

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
      return;
    }
    event.preventDefault();
    const items = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>("[role='option']") ??
        []
    );
    const index = items.findIndex((item) => item === document.activeElement);
    const step = event.key === "ArrowDown" ? 1 : -1;
    items[(index + step + items.length) % items.length]?.focus();
  };

  return createPortal(
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className={styles.header}>
          <span id={titleId} className={styles.title}>
            {title}
          </span>
        </div>

        <div className={styles.separator}>
          <hr className={styles.separatorLine} />
        </div>

        <div
          ref={listRef}
          className={styles.menuItems}
          role="listbox"
          aria-labelledby={titleId}
          onKeyDown={handleListKeyDown}
        >
          {options.map((option) => {
            const isSelected = option.value === selectedValue;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={styles.menuItem}
                onClick={() => onSelect(option.value)}
              >
                <span className={styles.label}>{option.label}</span>
                {isSelected && <CheckIcon />}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
};

const CheckIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    aria-hidden="true"
    className={styles.checkIcon}
  >
    <path
      d="M15 4.5L6.75 12.75L3 9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
