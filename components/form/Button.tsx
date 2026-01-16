"use client";

import styles from "./Button.module.css";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary";
  disabled?: boolean;
  fullWidth?: boolean;
}

export const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
  fullWidth = true,
}: ButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.button} ${styles[variant]} ${fullWidth ? styles.fullWidth : ""}`}
    >
      {children}
    </button>
  );
};
