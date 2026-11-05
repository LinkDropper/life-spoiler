"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import screen from "./screen.module.css";
import styles from "./ScreenSheet.module.css";

import type { KeyboardEvent, MouseEvent } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ScreenSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** 제목 위 영문 라벨 (SHARE · POSTER · REVIEW · ASK THE EXPERT) */
  eyebrow: string;
  title: string;
  /** 제목 아래 한 줄 (질문 시트: 남은 횟수) */
  headerExtra?: ReactNode;
  /** 보내는 중·저장 중에는 바깥 누르기·Esc로 닫히지 않는다 */
  isBusy?: boolean;
  /** 질문 시트처럼 내용이 늘어나는 시트: 화면 높이의 82%로 고정 */
  tall?: boolean;
  children: ReactNode;
}

/**
 * 운세 화면 위에 뜨는 상영관 시트 (공유 · 포스터 공유 · 관람평 · 질문 공통).
 * 대화상자로 읽히고, 열리면 시트로 포커스가 가고 Tab은 시트 안에서만 돈다.
 * Esc·바깥 누르기로 닫히고, 닫히면 연 버튼으로 포커스가 돌아간다.
 */
export const ScreenSheet = ({
  isOpen,
  onClose,
  eyebrow,
  title,
  headerExtra,
  isBusy = false,
  tall = false,
  children,
}: ScreenSheetProps) => {
  const tCommon = useTranslations("common");
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 열려 있는 동안 뒤 페이지가 스크롤되지 않게, 닫히면 연 버튼으로 포커스 복귀
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
      opener?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isMounted) {
      sheetRef.current?.focus();
    }
  }, [isOpen, isMounted]);

  if (!isMounted || !isOpen) {
    return null;
  }

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !isBusy) {
      onClose();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && !isBusy) {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !sheetRef.current) {
      return;
    }
    const focusables = Array.from(
      sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
    );
    if (focusables.length === 0) {
      return;
    }
    const [first] = focusables;
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (document.activeElement === last ||
        document.activeElement === sheetRef.current)
    ) {
      event.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      className={`${screen.root} ${styles.backdrop}`}
      onClick={handleBackdropClick}
    >
      <div
        ref={sheetRef}
        className={`${styles.sheet} ${tall ? styles.tall : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <span className={styles.handle} aria-hidden="true" />
        <div className={styles.header}>
          <span className={styles.heading}>
            <span className={styles.eyebrow}>{eyebrow}</span>
            <b id={titleId} className={styles.title}>
              {title}
            </b>
            {headerExtra && (
              <span className={styles.headerExtra}>{headerExtra}</span>
            )}
          </span>
          <span className={styles.headerRight}>
            <button
              type="button"
              className={styles.close}
              onClick={onClose}
              disabled={isBusy}
              aria-label={tCommon("close")}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </span>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body
  );
};

interface SheetActionProps {
  icon: ReactNode;
  label: string;
  sub?: string;
  /** 첫 줄로 권하는 행동 (금색 테두리) */
  isPrimary?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

/** 시트 안 행동 한 줄: 아이콘 칸 + 이름 + 보조 설명 */
export const SheetAction = ({
  icon,
  label,
  sub,
  isPrimary = false,
  disabled = false,
  onClick,
}: SheetActionProps) => (
  <button
    type="button"
    className={`${styles.action} ${isPrimary ? styles.actionPrimary : ""}`}
    onClick={onClick}
    disabled={disabled}
  >
    <span className={styles.actionIcon} aria-hidden="true">
      {icon}
    </span>
    <span className={styles.actionText}>
      <b>{label}</b>
      {sub && <span>{sub}</span>}
    </span>
  </button>
);
