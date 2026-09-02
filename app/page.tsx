import {
  MainHero,
  FeatureSection,
  FriendUniverseAlert,
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
        {/* 스크롤 없이 첫 화면에서 무료·비로그인 기능의 존재를 알리는 상단 알림 바 */}
        <FriendUniverseAlert />
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
