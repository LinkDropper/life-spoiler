import {
  Header,
  MainHero,
  FeatureSection,
  PromotionBanner,
  DisclaimerSection,
  CTAButton,
} from "@/components/landing";

import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <MainHero />
        <FeatureSection />
        <PromotionBanner />
        <DisclaimerSection />
      </main>
      <footer className={styles.footer}>
        <CTAButton />
      </footer>
    </div>
  );
}
