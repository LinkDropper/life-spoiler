"use client";

import type { ChangeEvent } from "react";

import styles from "./Input.module.css";

type FormatType = "date" | "time";

const formatDate = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) {
    return digits;
  }
  if (digits.length <= 6) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
};

const formatTime = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
};

interface InputProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "date" | "time";
  format?: FormatType;
  placeholder?: string;
  error?: string;
  maxLength?: number;
  disabled?: boolean;
}

export const Input = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  format,
  placeholder,
  error,
  maxLength,
  disabled,
}: InputProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    if (format === "date") {
      newValue = formatDate(newValue);
    } else if (format === "time") {
      newValue = formatTime(newValue);
    }

    onChange(newValue);
  };

  return (
    <div className={styles.wrapper}>
      <label htmlFor={name} className={styles.label}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        inputMode={format ? "numeric" : undefined}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={`${styles.input} ${error ? styles.inputError : ""}`}
      />
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};
