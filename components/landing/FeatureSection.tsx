import Image from "next/image";

import styles from "./FeatureSection.module.css";

export const FeatureSection = () => {
  return (
    <section className={styles.container}>
      <div className={styles.feature}>
        <h2 className={styles.title}>114개의 별이 그리는 디테일</h2>
        <p className={styles.description}>
          단순한 별자리가 아닙니다. 당신이 태어난 순간, 우주에 존재했던 114개
          별들의 정밀한 좌표를 분석하여 당신만의 고유한 운명 지도를 그려냅니다.
        </p>
        <div className={styles.imageRight}>
          <Image
            src="/images/landing/section1.png"
            alt="별자리 이미지"
            fill
            priority
            quality={100}
            className={styles.featureImage}
          />
        </div>
      </div>

      <div className={`${styles.feature} ${styles.featureRight}`}>
        <h2 className={`${styles.title} ${styles.titleRight}`}>
          당신의 엔딩을 바꿀 마지막 한 컷
        </h2>
        <p className={`${styles.description} ${styles.descriptionRight}`}>
          운명의 오차를 줄이는 핵심은 시간입니다. 분단위의 정밀한 시간 보정을
          통해, 당신조차 몰랐던 인생의 결정적 타이밍과 기회의 순간을 포착합니다.
        </p>
        <div className={styles.imageLeft}>
          <Image
            src="/images/landing/section2.png"
            alt="운명의 시계"
            width={78}
            height={89}
            className={styles.featureImage}
          />
        </div>
      </div>

      <div className={styles.feature}>
        <h2 className={styles.title}>황제들의 비밀 문서</h2>
        <p className={styles.description}>
          고대 황제들만이 독점했던 비밀 점성학 알고리즘. 권력을 유지하고 미래를
          예측하기 위해 사용되었던 금기된 해석법을 현대적으로 재해석했습니다.
        </p>
      </div>
    </section>
  );
};
