"use client";

import styles from "./RadioGroup.module.css";

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  label: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const RadioGroup = ({
  label,
  options,
  value,
  onChange,
  error,
}: RadioGroupProps) => {
  return (
    <div className={styles.wrapper}>
      <p className={styles.label}>{label}</p>
      <div className={styles.options}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`${styles.option} ${value === option.value ? styles.selected : ""}`}
            onClick={() => onChange(option.value)}
          >
            <span className={styles.radio}>
              {value === option.value && <span className={styles.radioInner} />}
            </span>
            <span className={styles.optionLabel}>{option.label}</span>
          </button>
        ))}
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};
