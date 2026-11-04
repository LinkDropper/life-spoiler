import styles from "./ScreeningTicket.module.css";

interface ScreeningTicketProps {
  /** mini: 초대장 보내기 영역의 작은 티켓 */
  size?: "full" | "mini";
  /** 꼬리표가 찢겨 있는 상태 (입장을 마친 내 관람권) */
  isTorn?: boolean;
  kind: string;
  title: string;
  score?: { value: number; unit: string };
  note?: string;
  stubLabel?: string;
  stubValue?: string;
  /** 같은 정보가 근처 텍스트에 있을 때 장식으로 숨긴다 */
  isDecorative?: boolean;
}

/**
 * 가로형 실물 티켓 (본문 + 세로 절취선 + 꼬리표). 홈 NextTicket·랜딩 관람권과 같은 모양.
 * 초대장(입장 전)과 내 관람권(입장 후)이 같은 틀을 쓴다.
 */
export const ScreeningTicket = ({
  size = "full",
  isTorn = false,
  kind,
  title,
  score,
  note,
  stubLabel,
  stubValue,
  isDecorative = false,
}: ScreeningTicketProps) => {
  const className = [
    styles.ticket,
    size === "mini" ? styles.mini : "",
    isTorn ? styles.torn : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} aria-hidden={isDecorative || undefined}>
      <div className={styles.body}>
        <div className={styles.kind}>{kind}</div>
        <div className={styles.title}>{title}</div>
        {score && (
          <div className={styles.score}>
            {score.value}
            <small>{score.unit}</small>
          </div>
        )}
        {note && <div className={styles.note}>{note}</div>}
      </div>
      <div className={styles.stub}>
        {stubLabel && <span>{stubLabel}</span>}
        {stubValue && <strong>{stubValue}</strong>}
        <i className={styles.barcode} aria-hidden="true" />
      </div>
    </div>
  );
};
