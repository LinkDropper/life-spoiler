import styles from "./PreviewSummaryCard.module.css";

interface PreviewSummaryCardProps {
  /** 라벨 (예: "한마디로"). i18n 처리된 문자열을 받는다. */
  label: string;
  /** 본문 한 줄. */
  text: string;
}

export const PreviewSummaryCard = ({
  label,
  text,
}: PreviewSummaryCardProps) => {
  if (!text) return null;
  return (
    <section className={styles.card}>
      <h3 className={styles.label}>{label}</h3>
      <p className={styles.text}>{text}</p>
    </section>
  );
};
