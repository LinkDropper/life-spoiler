import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { FaceSpoilerGuide } from "@/components/face-spoiler/FaceSpoilerGuide";
import type { FaceSpoilerGuideFaq } from "@/components/face-spoiler/FaceSpoilerGuide";
import { Footer } from "@/components/face-spoiler/Footer";
import { Header } from "@/components/face-spoiler/Header";
import { Hero } from "@/components/face-spoiler/Hero";
import { JsonLd } from "@/components/seo/JsonLd";
import { getLocalizedAlternates, getSeoLocale } from "@/libs/seo/metadata";
import {
  ENTITY_ID,
  buildFaqPageSchema,
  buildServiceSchema,
} from "@/libs/seo/structured-data";

/** 본문을 수정하면 app/sitemap.ts의 lastModified도 함께 갱신한다. */
const PAGE_PATH = "/face-spoiler";

export const generateMetadata = async (): Promise<Metadata> => ({
  alternates: await getLocalizedAlternates(PAGE_PATH),
});

export default async function FaceSpoilerPage() {
  const locale = await getSeoLocale();
  const t = await getTranslations("faceSpoiler.metadata");
  const tLanding = await getTranslations("faceSpoiler.landing");
  const faq = tLanding.raw("faq") as FaceSpoilerGuideFaq[];

  return (
    <>
      <JsonLd
        data={[
          buildServiceSchema({
            id: ENTITY_ID.faceSpoilerService,
            path: PAGE_PATH,
            locale,
            name: t("title"),
            description: t("description"),
            serviceType: "AI face reading (physiognomy) report",
          }),
          buildFaqPageSchema(
            PAGE_PATH,
            locale,
            faq.map(({ q, a }) => ({ question: q, answer: a }))
          ),
        ]}
      />
      <Header />
      <div className="container">
        <Hero />
        <FaceSpoilerGuide />
        <Footer />
      </div>
    </>
  );
}
