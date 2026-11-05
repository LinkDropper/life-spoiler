"use client";

import { useEffect, useId, useRef } from "react";
import { useTranslations } from "next-intl";

import { GuestCompatibilityContent } from "./GuestCompatibilityContent";
import styles from "./GuestDetailDrawer.module.css";

import type { KeyboardEvent, MouseEvent } from "react";
import type { GuestSeat } from "@/libs/universe/seat-map";
import type { UniverseGuestDto } from "@/libs/universe/types";

interface GuestDetailDrawerProps {
  /** null이면 닫힌 상태 (렌더하지 않는다) */
  guest: UniverseGuestDto | null;
  seat: GuestSeat | null;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * 엔딩 크레딧 항목을 눌렀을 때 뜨는 바텀시트.
 *
 * 여기서 보여주는 데이터는 이미 `GET /api/universe/{publicId}` 응답에 전부
 * 들어있는 UniverseGuestDto다 — 이 드로어를 위해 새로 fetch하지 않는다.
 *
 * 키보드: 열리면 닫기 버튼으로 포커스가 들어오고, Tab은 시트 안에서만 돌며,
 * ESC로 닫으면 포커스가 누른 항목으로 돌아간다.
 */
export const GuestDetailDrawer = ({
  guest,
  seat,
  onClose,
}: GuestDetailDrawerProps) => {
  const t = useTranslations("universe.detail");
  const titleId = useId();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isOpen = guest !== null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previouslyFocused = document.activeElement;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = "";
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [isOpen]);

  if (!guest) {
    return null;
  }

  const handleBackdropClick = (event: MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusables =
      drawerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const first = focusables?.[0];
    const last = focusables?.[focusables.length - 1];

    if (!first || !last) {
      return;
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={drawerRef}
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label={t("drawerClose")}
        >
          ×
        </button>

        <GuestCompatibilityContent
          guest={guest}
          seat={seat}
          titleId={titleId}
          className={styles.content}
        />
      </div>
    </div>
  );
};
