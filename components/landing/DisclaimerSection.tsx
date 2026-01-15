import styles from "./DisclaimerSection.module.css";

export const DisclaimerSection = () => {
  return (
    <section className={styles.container}>
      <div className={styles.warningBadge}>
        <span className={styles.warningText}>FBI WARNING</span>
      </div>
      <p className={styles.disclaimerText}>
        본 서비스는 100% 천문 데이터를 기반으로 분석되었습니다.
        <br />
        운세 결과가 너무 잘 맞아서 생기는 &apos;소름&apos;과
        &apos;과호흡&apos;에 대해
        <br />
        인생스포 측은 책임지지 않습니다.
      </p>
    </section>
  );
};
