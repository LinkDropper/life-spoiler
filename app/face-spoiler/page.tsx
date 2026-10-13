import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Footer } from "@/components/face-spoiler/Footer";
import { Header } from "@/components/face-spoiler/Header";
import { Hero } from "@/components/face-spoiler/Hero";
import { JsonLd } from "@/components/seo/JsonLd";
import { getLocalizedAlternates, getSeoLocale } from "@/libs/seo/metadata";
import { ENTITY_ID, buildServiceSchema } from "@/libs/seo/structured-data";

export const generateMetadata = async (): Promise<Metadata> => ({
  alternates: await getLocalizedAlternates("/face-spoiler"),
});

export default async function FaceSpoilerPage() {
  const locale = await getSeoLocale();
  const t = await getTranslations("faceSpoiler.metadata");

  return (
    <>
      <JsonLd
        data={buildServiceSchema({
          id: ENTITY_ID.faceSpoilerService,
          path: "/face-spoiler",
          locale,
          name: t("title"),
          description: t("description"),
          serviceType: "AI face reading (physiognomy) report",
        })}
      />
      <Header />
      <div className="container">
        <Hero />
        <Footer />
      </div>
    </>
  );
}
