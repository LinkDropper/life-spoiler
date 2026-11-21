import { getTranslations } from "next-intl/server";

import { FeatureCarousel } from "./FeatureCarousel";
import styles from "./FeatureSection.module.css";

const FEATURE_CONFIGS = [
  {
    key: "feature1",
    image: { src: "/images/landing/section1.png", width: 192, height: 110 },
  },
  {
    key: "feature2",
    image: { src: "/images/landing/section2.png", width: 148, height: 169 },
  },
  {
    key: "feature3",
    image: { src: "/images/landing/section3.png", width: 88, height: 99 },
  },
] as const;

export const FeatureSection = async () => {
  const t = await getTranslations("landing.features");

  const features = FEATURE_CONFIGS.map((config) => ({
    key: config.key,
    title: t(`${config.key}.title`),
    question: t(`${config.key}.question`),
    description: t(`${config.key}.description`),
    image: {
      src: config.image.src,
      alt: t(`${config.key}.imageAlt`),
      width: config.image.width,
      height: config.image.height,
    },
  }));

  return (
    <section className={styles.container}>
      <FeatureCarousel features={features} />
    </section>
  );
};
