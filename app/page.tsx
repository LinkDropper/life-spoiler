import { getTranslations } from "next-intl/server";

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
import { AlternateLinks } from "@/components/seo/AlternateLinks";
import { JsonLd } from "@/components/seo/JsonLd";
import { getSeoLocale } from "@/libs/seo/metadata";
import {
  ENTITY_ID,
  buildFaqPageSchema,
  buildServiceSchema,
} from "@/libs/seo/structured-data";

import styles from "./page.module.css";

const LANDING_FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5"] as const;

export default async function Home() {
  const locale = await getSeoLocale();
  const tMeta = await getTranslations("metadata");
  const tFaq = await getTranslations("landing.faq");

  const faqEntries = LANDING_FAQ_KEYS.map((key) => ({
    question: tFaq(`items.${key}.question`),
    answer: tFaq(`items.${key}.answer`),
  }));

  return (
    <div className={styles.page}>
      {/* 홈은 Next.js Metadata API가 `/?locale=` 쿼리를 버려서 직접 렌더링한다 */}
      <AlternateLinks path="/" locale={locale} />
      <JsonLd
        data={[
          buildServiceSchema({
            id: ENTITY_ID.lifeSpoilerService,
            path: "/",
            locale,
            name: tMeta("title"),
            description: tMeta("description"),
            serviceType: "Zi Wei Dou Shu (紫微斗數) fortune reading",
          }),
          buildFaqPageSchema("/", locale, faqEntries),
        ]}
      />
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
