import styles from "./EventBadge.module.css";

interface EventBadgeProps {
  /** 뱃지에 표시할 텍스트 (기본값: "EVENT") */
  label?: string;
}

/**
 * 이벤트 뱃지 컴포넌트
 *
 * pill 형태의 작은 뱃지로, 버튼 위에 배치하여 이벤트를 강조합니다.
 */
export const EventBadge = ({ label = "EVENT" }: EventBadgeProps) => {
  return <span className={styles.badge}>{label}</span>;
};

export default EventBadge;
