import {
  MainHero,
  FeatureSection,
  ProductPreview,
  PromotionBanner,
  FAQSection,
  DisclaimerSection,
  FooterInfo,
  CTAButton,
  HeaderClient,
} from "@/components/landing";

import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <HeaderClient />
      <main className={styles.main}>
        <MainHero />
        <FeatureSection />
        <PromotionBanner />
        <ProductPreview />
        <FAQSection />
        <DisclaimerSection />
        <FooterInfo />
        <div className={styles.ctaSpacer} />
      </main>
      <CTAButton />
    </div>
  );
}
