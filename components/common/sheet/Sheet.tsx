"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import styles from "./Sheet.module.css";

import type { KeyboardEvent, MouseEvent, ReactNode } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** 제목 위 영문 장식 라벨(번역하지 않는다). 없으면 그리지 않는다 */
  eyebrow?: string;
  /** 확인 시트는 alertdialog */
  role?: "dialog" | "alertdialog";
  /** 설명 문단의 id (aria-describedby) */
  describedBy?: string;
  /** 처리 중에는 Esc·바깥 누르기·닫기 버튼이 모두 막힌다 */
  isBusy?: boolean;
  /** 확인 시트처럼 닫기(X)가 없는 시트는 false */
  hasCloseButton?: boolean;
  /** 스크롤되는 본문 아래에 고정되는 영역 (취소·확인 등) */
  footer?: ReactNode;
  /** 제목 아래 한 줄 (전문가 질문: 남은 횟수) */
  headerExtra?: ReactNode;
  /** tall = 내용이 늘어나는 시트(전문가 질문): 화면 높이의 82%로 고정 */
  size?: "auto" | "tall";
  children: ReactNode;
}

/**
 * 서비스 공용 상영관 시트 껍데기 (밤하늘 바탕 · 핸들 · eyebrow · 디스플레이 제목 · 44px 닫기).
 * 대화상자로 읽히고, 열리면 `data-autofocus` 요소(없으면 시트)로 포커스가 가며
 * Tab은 시트 안에서만 돈다. Esc·바깥 누르기로 닫히고 닫히면 연 버튼으로 포커스가 돌아간다.
 * 내용은 children이, 아래 고정 영역은 footer가 맡는다.
 */
export const Sheet = ({
  isOpen,
  onClose,
  title,
  eyebrow,
  role = "dialog",
  describedBy,
  isBusy = false,
  hasCloseButton = true,
  footer,
  headerExtra,
  size = "auto",
  children,
}: SheetProps) => {
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

  // 열리면 data-autofocus 요소로, 없으면 시트 자체로 포커스
  useEffect(() => {
    if (!isOpen || !isMounted) {
      return;
    }
    const target =
      sheetRef.current?.querySelector<HTMLElement>("[data-autofocus]") ??
      sheetRef.current;
    target?.focus();
  }, [isOpen, isMounted]);

  // 처리 중 눌렀던 버튼이 비활성화되면 포커스가 사라지므로 시트로 되돌린다
  useEffect(() => {
    const sheet = sheetRef.current;
    if (isBusy && sheet && !sheet.contains(document.activeElement)) {
      sheet.focus();
    }
  }, [isBusy]);

  if (!isMounted || !isOpen) {
    return null;
  }

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !isBusy) {
      onClose();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      // 메뉴처럼 아래에서 Esc를 듣는 화면까지 함께 닫히지 않게 막는다
      event.stopPropagation();
      if (!isBusy) {
        onClose();
      }
      return;
    }
    if (event.key !== "Tab" || !sheetRef.current) {
      return;
    }
    const focusables = Array.from(
      sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
    );
    if (focusables.length === 0) {
      event.preventDefault();
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
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div
        ref={sheetRef}
        className={`${styles.sheet} ${size === "tall" ? styles.tall : ""}`}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        aria-busy={isBusy || undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <span className={styles.handle} aria-hidden="true" />
        <div className={styles.header}>
          <div className={styles.heading}>
            {eyebrow && (
              <p className={styles.eyebrow} aria-hidden="true">
                {eyebrow}
              </p>
            )}
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {headerExtra && (
              <div className={styles.headerExtra}>{headerExtra}</div>
            )}
          </div>
          {hasCloseButton && (
            <button
              type="button"
              className={styles.close}
              onClick={onClose}
              disabled={isBusy}
              aria-label={tCommon("close")}
            >
              <X size={24} strokeWidth={2} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
};
