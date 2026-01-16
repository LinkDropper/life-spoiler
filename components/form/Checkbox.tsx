"use client";

import styles from "./Checkbox.module.css";

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const Checkbox = ({
  label,
  checked,
  onChange,
  disabled,
}: CheckboxProps) => {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <button
      type="button"
      className={`${styles.wrapper} ${disabled ? styles.disabled : ""}`}
      onClick={handleClick}
      disabled={disabled}
    >
      <span className={`${styles.checkbox} ${checked ? styles.checked : ""}`}>
        {checked && (
          <svg
            width="12"
            height="10"
            viewBox="0 0 12 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 5L4.5 8.5L11 1"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className={styles.label}>{label}</span>
    </button>
  );
};
