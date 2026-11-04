import styles from "./PaymentTicket.module.css";

/**
 * pending: 슬롯에 반쯤 꽂힌 결제 전 관람권 (매표소)
 * issued: 슬롯 밖으로 나와 꼬리표가 떨어진 발권 완료
 * unpaid: 슬롯에 꽂힌 채 종이만 한 톤 어두운 결제 실패·취소
 * void: 윤곽선만 남은 빈 관람권 (승인 실패)
 */
export type PaymentTicketVariant = "pending" | "issued" | "unpaid" | "void";

export interface PaymentTicketRow {
  label: string;
  value: string;
}

export interface PaymentTicketStub {
  label: string;
  value: string;
  /** 취소선으로 보여 줄 정가 */
  originalValue?: string;
  /** 스크린리더용 정가 안내 ("정가") */
  originalSrLabel?: string;
}

interface PaymentTicketProps {
  variant: PaymentTicketVariant;
  ariaLabel: string;
  kicker: string;
  title: string;
  /** void 전용 보조 문장 */
  subtitle?: string;
  rows?: PaymentTicketRow[];
  /** void에서는 쓰지 않는다 */
  stub?: PaymentTicketStub;
}

const VARIANT_CLASS: Record<PaymentTicketVariant, string> = {
  pending: styles.pending,
  issued: styles.issued,
  unpaid: styles.unpaid,
  void: styles.void,
};

export const PaymentTicket = ({
  variant,
  ariaLabel,
  kicker,
  title,
  subtitle,
  rows,
  stub,
}: PaymentTicketProps) => {
  const hasBarcode = variant === "pending" || variant === "issued";

  return (
    <div className={styles.counter}>
      <div className={styles.slot} aria-hidden="true" />
      <section
        className={`${styles.ticket} ${VARIANT_CLASS[variant]}`}
        aria-label={ariaLabel}
      >
        <div className={styles.body}>
          <p className={styles.kicker}>{kicker}</p>
          <p className={styles.title}>{title}</p>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          {rows && rows.length > 0 && (
            <dl className={styles.meta}>
              {rows.map((row) => (
                <div key={row.label} className={styles.metaRow}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div className={styles.stub} aria-hidden={stub ? undefined : true}>
          {stub && (
            <>
              <span>{stub.label}</span>
              {stub.originalValue && (
                <del className={styles.original}>
                  <span className={styles.srOnly}>{stub.originalSrLabel} </span>
                  {stub.originalValue}
                </del>
              )}
              <strong className={styles.value}>{stub.value}</strong>
              {hasBarcode && (
                <i className={styles.barcode} aria-hidden="true" />
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};
