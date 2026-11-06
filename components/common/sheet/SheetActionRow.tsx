"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import styles from "./SheetRows.module.css";

interface SheetActionRowProps {
  label: string;
  /** 있으면 링크, 없으면 버튼 */
  href?: string;
  onClick?: () => void;
}

/** 선택지와 떨어져 목록 아래에 두는 이동 항목 (예: 새 프로필 만들기) */
export const SheetActionRow = ({
  label,
  href,
  onClick,
}: SheetActionRowProps) => {
  const content = (
    <>
      <Plus size={20} strokeWidth={2} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </>
  );
  const className = `${styles.row} ${styles.actionRow}`;

  return (
    <div className={styles.actionList}>
      {href ? (
        <Link href={href} className={className} onClick={onClick}>
          {content}
        </Link>
      ) : (
        <button type="button" className={className} onClick={onClick}>
          {content}
        </button>
      )}
    </div>
  );
};
