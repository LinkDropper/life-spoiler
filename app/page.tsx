import {
  Header,
  MainHero,
  FeatureSection,
  PromotionBanner,
  DisclaimerSection,
  FooterInfo,
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
        <FooterInfo />
      </main>
      <footer className={styles.footer}>
        <CTAButton />
      </footer>
    </div>
  );
}
