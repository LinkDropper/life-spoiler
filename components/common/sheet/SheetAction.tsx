"use client";

import styles from "./SheetAction.module.css";

import type { ReactNode } from "react";

interface SheetActionProps {
  icon: ReactNode;
  label: string;
  /** 이름 아래 보조 한 줄 (예: 인스타그램 · 메시지) */
  sub?: string;
  /** 첫 줄로 권하는 행동 (금색 테두리) */
  isPrimary?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

/** 시트 안 행동 한 줄: 아이콘 칸 + 이름 + 보조 설명 (공유 시트의 카카오톡 · 기기 공유 · 링크 복사 …) */
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
    className={`${styles.action} ${isPrimary ? styles.primary : ""}`}
    onClick={onClick}
    disabled={disabled}
  >
    <span className={styles.icon} aria-hidden="true">
      {icon}
    </span>
    <span className={styles.text}>
      <b>{label}</b>
      {sub && <span>{sub}</span>}
    </span>
  </button>
);
