"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import styles from "./HomeSheet.module.css";

interface HomeSheetProps {
  /** 제목 위 장식용 영문 한 줄 (스크린리더에는 읽히지 않는다) */
  eyebrow: string;
  title: string;
  /** 헤더 오른쪽 텍스트 버튼(편집·완료 등) */
  actions?: ReactNode;
  /** false면 닫기(X) 버튼을 숨긴다 — 편집 모드처럼 출구를 하나로 둘 때 */
  showClose?: boolean;
  /** false면 Escape로 닫지 않는다 — 위에 다른 모달이 떠 있을 때 */
  closeOnEscape?: boolean;
  onClose: () => void;
  children: ReactNode;
}

/** 홈 바텀시트 틀 — common-sheets 문법(밤하늘 바탕·mono eyebrow·디스플레이 제목) */
export const HomeSheet = ({
  eyebrow,
  title,
  actions,
  showClose = true,
  closeOnEscape = true,
  onClose,
  children,
}: HomeSheetProps) => {
  const t = useTranslations("home.sheet");
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    sheetRef.current?.focus();

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!closeOnEscape) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeOnEscape, onClose]);

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div
        ref={sheetRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <span className={styles.handle} aria-hidden="true" />
        <div className={styles.head}>
          <div>
            <p className={styles.eyebrow} aria-hidden="true">
              {eyebrow}
            </p>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
          </div>
          <div className={styles.actions}>
            {actions}
            {showClose && (
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label={t("close")}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

/** 헤더 오른쪽에 두는 텍스트 버튼 (편집·완료) */
interface HomeSheetTextButtonProps {
  onClick: () => void;
  children: ReactNode;
}

export const HomeSheetTextButton = ({
  onClick,
  children,
}: HomeSheetTextButtonProps) => (
  <button type="button" className={styles.textButton} onClick={onClick}>
    {children}
  </button>
);
