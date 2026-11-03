import { getTranslations } from "next-intl/server";

import {
  CinemaLanding,
  FriendUniverseAlert,
  FAQSection,
  DisclaimerSection,
  FooterInfo,
  CTAButton,
  HeaderClient,
  getFortuneCount,
} from "@/components/landing";
import { AlternateLinks } from "@/components/seo/AlternateLinks";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildLandingCinemaData } from "@/libs/landing/landing-cinema-data";
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
  const totalCount = await getFortuneCount();
  // 예시 인물의 명반·12시진 변형은 서버에서 실제 엔진으로 계산해 내려준다
  const cinemaData = buildLandingCinemaData(locale);

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
        {/* 스크롤하면 인생이 상영되는 연출. 장면 구성 근거: docs/landing-redesign-2026-11.md */}
        <CinemaLanding
          data={cinemaData}
          totalCount={totalCount}
          beforeFinale={
            <div className={styles.column}>
              <FAQSection />
            </div>
          }
        />
        <div className={styles.column}>
          <DisclaimerSection />
          <FooterInfo />
        </div>
        <div className={styles.ctaSpacer} />
      </main>
      <CTAButton />
    </div>
  );
}
