import type { ReactNode } from "react";

import { PaymentChoiceRow } from "./PaymentChoiceRow";
import styles from "./PaymentMethodFieldset.module.css";

export interface PaymentMethodOption<TId extends string = string> {
  id: TId;
  label: string;
}

interface PaymentMethodFieldsetProps<TId extends string> {
  legend: string;
  methods: PaymentMethodOption<TId>[];
  selected: TId;
  onSelect: (id: TId) => void;
  /** 쿠폰 사용 행 아래로 이어 붙는 영역 */
  children?: ReactNode;
}

/** 결제 수단 radio 그룹. fieldset/legend로 묶어 스크린리더가 그룹 이름을 읽는다 */
export const PaymentMethodFieldset = <TId extends string>({
  legend,
  methods,
  selected,
  onSelect,
  children,
}: PaymentMethodFieldsetProps<TId>) => {
  const handleSelect = (value: string) => {
    const method = methods.find((option) => option.id === value);
    if (method) {
      onSelect(method.id);
    }
  };

  return (
    <fieldset className={styles.pay}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.list}>
        {methods.map((method) => (
          <PaymentChoiceRow
            key={method.id}
            name="method"
            value={method.id}
            checked={selected === method.id}
            onSelect={handleSelect}
          >
            {method.label}
          </PaymentChoiceRow>
        ))}
      </div>
      {children}
    </fieldset>
  );
};
