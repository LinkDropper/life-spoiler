import type { ReactNode } from "react";

import styles from "./PaymentChoice.module.css";

interface PaymentChoiceRowProps {
  /** 같은 name끼리 한 그룹의 radio가 된다 */
  name: string;
  value: string;
  checked: boolean;
  disabled?: boolean;
  /** 쿠폰 목록처럼 한 단계 들여 쓴 작은 행 */
  compact?: boolean;
  onSelect: (value: string) => void;
  children: ReactNode;
}

/**
 * 목록 행 하나. 선택은 글씨 굵기·색과 오른쪽 체크로만 표시한다.
 * 실제 radio가 행 전체를 덮어 터치 영역과 키보드 조작을 그대로 얻는다.
 */
export const PaymentChoiceRow = ({
  name,
  value,
  checked,
  disabled = false,
  compact = false,
  onSelect,
  children,
}: PaymentChoiceRowProps) => {
  const handleChange = () => {
    onSelect(value);
  };

  return (
    <label className={`${styles.row} ${compact ? styles.compact : ""}`}>
      <input
        type="radio"
        className={styles.input}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
      />
      <span className={styles.label}>{children}</span>
      <svg
        className={styles.check}
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </label>
  );
};
