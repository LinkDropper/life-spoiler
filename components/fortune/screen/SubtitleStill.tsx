import styles from "./screen.module.css";

interface SubtitleStillProps {
  label: string;
  text: string;
}

/** 한 줄 정리를 영화 스틸 위 자막으로 */
export const SubtitleStill = ({ label, text }: SubtitleStillProps) => (
  <figure className={styles.still}>
    <figcaption className={styles.stillCaption}>
      <span className={styles.stillLabel}>{label}</span>
      <span className={styles.stillText}>{text}</span>
    </figcaption>
  </figure>
);
