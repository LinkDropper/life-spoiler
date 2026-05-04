import styles from "./OneLinerAlert.module.css";

interface OneLinerAlertProps {
  text: string;
  /** 라벨 (기본: "한 줄 정리"). i18n 호출자에서 주입. */
  label?: string;
}

/**
 * 섹션 마무리에 노출하는 alert 디자인 한 줄 정리 박스.
 * 관상스포의 "한마디로" 카드와 동일한 역할.
 */
export const OneLinerAlert = ({
  text,
  label = "한 줄 정리",
}: OneLinerAlertProps) => {
  if (!text || !text.trim()) return null;

  return (
    <aside className={styles.alert} role="note">
      <span className={styles.label}>{label}</span>
      <p className={styles.text}>{text}</p>
    </aside>
  );
};
