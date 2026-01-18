import {
  MainHero,
  FeatureSection,
  PromotionBanner,
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
        <DisclaimerSection />
        <CTAButton />
        <FooterInfo />
      </main>
    </div>
  );
}
