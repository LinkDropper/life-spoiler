import Image from "next/image";
import { getTranslations } from "next-intl/server";

import styles from "./FeatureSection.module.css";

export const FeatureSection = async () => {
  const t = await getTranslations("landing.features");

  return (
    <section className={styles.container}>
      <div className={styles.feature}>
        <h2 className={styles.title}>
          {t("feature1.title", { default: "10년마다 바뀌는 운의 흐름" })}
        </h2>
        <p className={styles.question}>
          {t("feature1.question", {
            default: "지금이 도약의 시기인가, 준비의 시기인가?",
          })}
        </p>
        <p className={styles.description}>
          {t("feature1.description", {
            default:
              "4세부터 99세까지, 10년 단위로 당신의 운세 흐름을 분석합니다. 각 시기별 기회와 주의점을 확인하세요.",
          })}
        </p>
        <div className={styles.imageRight}>
          <Image
            src="/images/landing/section1.png"
            alt={t("feature1.imageAlt", { default: "대운 분석" })}
            width={192}
            height={110}
            className={styles.featureImage}
          />
        </div>
      </div>

      <div className={styles.feature}>
        <h2 className={`${styles.title} ${styles.titleRight}`}>
          {t("feature2.title", { default: "재물 · 직업 · 인연 · 건강" })}
        </h2>
        <p className={`${styles.question} ${styles.questionRight}`}>
          {t("feature2.question", {
            default: "내가 잘할 수 있는 분야는? 어떤 파트너가 맞을까?",
          })}
        </p>
        <p className={`${styles.description} ${styles.descriptionRight}`}>
          {t("feature2.description", {
            default:
              "4가지 핵심 영역별로 당신의 타고난 패턴과 성향을 분석합니다. 각 영역별 점수도 함께 제공됩니다.",
          })}
        </p>
        <div className={styles.imageLeft}>
          <Image
            src="/images/landing/section2.png"
            alt={t("feature2.imageAlt", { default: "4가지 영역" })}
            width={148}
            height={169}
            className={styles.featureImage}
          />
        </div>
      </div>

      <div className={styles.feature}>
        <h2 className={styles.title}>
          {t("feature3.title", { default: "올해, 어느 달이 중요할까?" })}
        </h2>
        <p className={styles.question}>
          {t("feature3.question", {
            default: "이번 달은 조심해야 할까, 밀어붙여야 할까?",
          })}
        </p>
        <p className={styles.description}>
          {t("feature3.description", {
            default:
              "1월부터 12월까지 좋은 달과 조심할 달을 구분해서 알려드립니다. 중요한 결정 전에 확인하세요.",
          })}
        </p>
        <div className={styles.imageRightSmall}>
          <Image
            src="/images/landing/section3.png"
            alt={t("feature3.imageAlt", { default: "월별 운세" })}
            width={88}
            height={99}
            className={styles.featureImage}
          />
        </div>
      </div>
    </section>
  );
};
