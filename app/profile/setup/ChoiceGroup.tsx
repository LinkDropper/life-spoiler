"use client";

import { useId, useRef } from "react";
import type { KeyboardEvent } from "react";

import styles from "./ChoiceGroup.module.css";

interface ChoiceOption<T extends string> {
  value: T;
  label: string;
}

interface ChoiceGroupProps<T extends string> {
  label: string;
  options: ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** segment: 둘 중 하나 고르는 칸(달력·성별), pill: 알약형 선택지(연애·직업) */
  variant: "segment" | "pill";
  error?: string;
}

/**
 * 프로필 만들기 전용 단일 선택. 상영관 컨셉에 맞춰 고른 항목만 진한 핑크로 칠한다.
 * radiogroup 패턴: 고른 항목만 Tab으로 들어오고 ←→↑↓로 옮긴다.
 */
export const ChoiceGroup = <T extends string>({
  label,
  options,
  value,
  onChange,
  variant,
  error,
}: ChoiceGroupProps<T>) => {
  const labelId = useId();
  const errorId = useId();
  const groupRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (step === 0) {
      return;
    }
    event.preventDefault();
    const index = options.findIndex((option) => option.value === value);
    const next = options[(index + step + options.length) % options.length];
    if (!next) {
      return;
    }
    onChange(next.value);
    groupRef.current
      ?.querySelector<HTMLButtonElement>(`[data-value="${next.value}"]`)
      ?.focus();
  };

  return (
    <div className={styles.wrapper}>
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      <div
        ref={groupRef}
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={error ? errorId : undefined}
        className={variant === "segment" ? styles.segment : styles.pills}
        onKeyDown={handleKeyDown}
      >
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              data-value={option.value}
              className={`${variant === "segment" ? styles.segmentItem : styles.pill} ${isSelected ? styles.selected : ""}`}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
};
