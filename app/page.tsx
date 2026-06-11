import {
  MainHero,
  FeatureSection,
  ProductPreview,
  FirstPaymentEventBanner,
  PromotionBanner,
  ReviewSection,
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
        <ReviewSection />
        <ProductPreview />
        <FirstPaymentEventBanner />
        <PromotionBanner />
        <FAQSection />
        <DisclaimerSection />
        <FooterInfo />
        <div className={styles.ctaSpacer} />
      </main>
      <CTAButton />
    </div>
  );
}
