"use client";

import styles from "./SheetButton.module.css";

import type { ReactNode } from "react";

interface SheetButtonProps {
  variant?: "primary" | "ghost";
  disabled?: boolean;
  /** 시트가 열릴 때 처음 포커스를 받는 버튼 */
  isInitialFocus?: boolean;
  onClick: () => void;
  children: ReactNode;
}

/** 시트 아래 버튼. 높이 52px */
export const SheetButton = ({
  variant = "primary",
  disabled = false,
  isInitialFocus = false,
  onClick,
  children,
}: SheetButtonProps) => (
  <button
    type="button"
    className={`${styles.button} ${variant === "ghost" ? styles.ghost : ""}`}
    disabled={disabled}
    data-autofocus={isInitialFocus ? "" : undefined}
    onClick={onClick}
  >
    {children}
  </button>
);
