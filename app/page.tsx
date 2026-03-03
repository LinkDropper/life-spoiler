import {
  MainHero,
  FeatureSection,
  // CompatibilitySection,
  ProductPreview,
  PromotionBanner,
  ReviewSection,
  FAQSection,
  DisclaimerSection,
  FooterInfo,
  CTAButton,
  HeaderClient,
} from "@/components/landing";

import styles from "./page.module.css";
import EventSection from "@/components/landing/EventSection";

export default function Home() {
  return (
    <div className={styles.page}>
      <HeaderClient />
      <main className={styles.main}>
        <MainHero />
        <FeatureSection />
        {/* <CompatibilitySection /> */}
        <PromotionBanner />
        <ReviewSection />
        <ProductPreview />
        <EventSection />
        <FAQSection />
        <DisclaimerSection />
        <FooterInfo />
        <div className={styles.ctaSpacer} />
      </main>
      <CTAButton />
    </div>
  );
}
