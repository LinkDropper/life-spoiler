"use client";

import { useState, useEffect } from "react";

import styles from "./SelectableChips.module.css";

interface ChipOption {
  value: string;
  label: string;
}

interface SelectableChipsProps {
  label: string;
  options: ChipOption[];
  value: string;
  customValue?: string;
  onChange: (value: string, customValue?: string) => void;
  columns?: 2 | 3;
  error?: string;
  customPlaceholder?: string;
  customMaxLength?: number;
}

export const SelectableChips = ({
  label,
  options,
  value,
  customValue = "",
  onChange,
  columns = 2,
  error,
  customPlaceholder = "직접 입력해주세요",
  customMaxLength = 50,
}: SelectableChipsProps) => {
  const [localCustomValue, setLocalCustomValue] = useState(customValue);
  const isCustomSelected = value === "custom";

  useEffect(() => {
    setLocalCustomValue(customValue);
  }, [customValue]);

  const handleOptionClick = (optionValue: string) => {
    if (optionValue === "custom") {
      onChange("custom", localCustomValue);
    } else {
      onChange(optionValue, undefined);
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalCustomValue(newValue);
    onChange("custom", newValue);
  };

  return (
    <div className={styles.wrapper}>
      <p className={styles.label}>{label}</p>
      <div
        className={styles.options}
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`${styles.option} ${value === option.value ? styles.selected : ""}`}
            onClick={() => handleOptionClick(option.value)}
          >
            <span className={styles.radio}>
              {value === option.value && <span className={styles.radioInner} />}
            </span>
            <span className={styles.optionLabel}>{option.label}</span>
          </button>
        ))}
      </div>
      {isCustomSelected && (
        <input
          type="text"
          value={localCustomValue}
          onChange={handleCustomInputChange}
          placeholder={customPlaceholder}
          className={styles.customInput}
          maxLength={customMaxLength}
        />
      )}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};
