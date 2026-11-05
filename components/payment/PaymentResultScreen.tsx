import type { ReactNode } from "react";

import { HeaderClient } from "@/components/landing";

import styles from "./PaymentResultScreen.module.css";

export interface PaymentResultRow {
  label: string;
  value: string;
}

interface PaymentResultAction {
  label: string;
  onClick: () => void;
}

interface PaymentResultScreenProps {
  /** success는 role="status", failure는 role="alert"로 제목을 읽어 준다 */
  tone: "success" | "failure";
  title: string;
  lead?: string;
  /** 관람권 (PaymentTicket) */
  ticket?: ReactNode;
  /** 주문번호·결제 금액·에러 코드 같은 행 */
  receipt?: PaymentResultRow[];
  hint?: string;
  primaryAction: PaymentResultAction;
  secondaryAction?: PaymentResultAction;
}

/** 결제 완료·승인 실패·결제 실패가 함께 쓰는 한 면짜리 결과 화면 */
export const PaymentResultScreen = ({
  tone,
  title,
  lead,
  ticket,
  receipt,
  hint,
  primaryAction,
  secondaryAction,
}: PaymentResultScreenProps) => (
  <div className={styles.page}>
    <HeaderClient />
    <main className={styles.main}>
      <div role={tone === "success" ? "status" : "alert"}>
        <h1 className={styles.title}>{title}</h1>
        {lead && <p className={styles.lead}>{lead}</p>}
      </div>

      {ticket}

      {receipt && receipt.length > 0 && (
        <dl className={styles.receipt}>
          {receipt.map((row) => (
            <div key={row.label} className={styles.receiptRow}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className={styles.actions}>
        {hint && <p className={styles.hint}>{hint}</p>}
        <button
          type="button"
          className={styles.primary}
          onClick={primaryAction.onClick}
        >
          {primaryAction.label}
        </button>
        {secondaryAction && (
          <button
            type="button"
            className={styles.secondary}
            onClick={secondaryAction.onClick}
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </main>
  </div>
);
