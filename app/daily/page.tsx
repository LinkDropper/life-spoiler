import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { DailyLandingCta } from "@/components/daily";
import { FooterInfo, HeaderClient } from "@/components/landing";
import { JsonLd } from "@/components/seo/JsonLd";
import { NOINDEX_METADATA, getSeoLocale } from "@/libs/seo/metadata";
import {
  OPEN_GRAPH_LOCALE,
  SITE_NAME,
  buildLocalizedUrl,
} from "@/libs/seo/site";
import {
  buildBreadcrumbSchema,
  buildFaqPageSchema,
} from "@/libs/seo/structured-data";
import { getOpenGraphImage } from "@/libs/utils/og";

import styles from "./page.module.css";

/** 본문을 수정하면 app/sitemap.ts의 lastModified도 함께 갱신한다. */
const PAGE_PATH = "/daily";

interface LandingSection {
  id: string;
  heading: string;
  paragraphs: string[];
}

interface LandingFaq {
  q: string;
  a: string;
}

interface LandingExample {
  headline: string;
  overall: string;
  overallGrade: string;
  overallLevel: number;
  keywords: string;
  tip: string;
}

/**
 * KO 전용 색인 랜딩. 문구 사전이 KO뿐이라 EN/JA 화면에서는 색인에서 제외한다
 * (hreflang 없이 KO 단일 canonical). 직접 진입은 막지 않는다.
 */
export const generateMetadata = async (): Promise<Metadata> => {
  const locale = await getSeoLocale();
  const t = await getTranslations("daily.landing.meta");

  if (locale !== "ko") {
    return { ...NOINDEX_METADATA, title: t("title") };
  }

  const title = t("title");
  const description = t("description");
  const ogImage = getOpenGraphImage(locale);

  return {
    title,
    description,
    alternates: { canonical: buildLocalizedUrl(PAGE_PATH, "ko") },
    openGraph: {
      type: "website",
      locale: OPEN_GRAPH_LOCALE.ko,
      url: buildLocalizedUrl(PAGE_PATH, "ko"),
      siteName: SITE_NAME.ko,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 600, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
};

export default async function DailyLandingPage() {
  const locale = await getSeoLocale();
  const t = await getTranslations("daily.landing");

  const sections = t.raw("sections") as LandingSection[];
  const faq = t.raw("faq") as LandingFaq[];
  const example = t.raw("example") as LandingExample;

  return (
    <div className={styles.page}>
      {locale === "ko" && (
        <JsonLd
          data={[
            buildBreadcrumbSchema(locale, [
              { name: t("ui.breadcrumbHome"), path: "/" },
              { name: t("meta.h1"), path: PAGE_PATH },
            ]),
            buildFaqPageSchema(
              PAGE_PATH,
              locale,
              faq.map(({ q, a }) => ({ question: q, answer: a }))
            ),
          ]}
        />
      )}
      <HeaderClient />

      <main className={styles.main}>
        <nav className={styles.breadcrumb} aria-label={t("ui.breadcrumbLabel")}>
          <ol>
            <li>
              <Link href="/">{t("ui.breadcrumbHome")}</Link>
            </li>
            <li aria-current="page">{t("meta.h1")}</li>
          </ol>
        </nav>

        <article className={styles.article}>
          <header className={styles.header}>
            <h1 className={styles.title}>
              {t("meta.h1")}{" "}
              <span className={styles.badge}>{t("ui.badge")}</span>
            </h1>
            <p className={styles.intro}>{t("intro")}</p>
            <DailyLandingCta />
          </header>

          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className={styles.section}
              aria-labelledby={`${section.id}-heading`}
            >
              <h2 id={`${section.id}-heading`} className={styles.heading}>
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className={styles.paragraph}>
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          <section
            id="example"
            className={styles.section}
            aria-labelledby="example-heading"
          >
            <h2 id="example-heading" className={styles.heading}>
              {t("ui.exampleTitle")}
            </h2>
            <p className={styles.note}>{t("ui.exampleNote")}</p>
            <div className={styles.example}>
              <p className={styles.exampleHeadline}>{example.headline}</p>
              <p className={styles.exampleGrade}>
                <span
                  role="img"
                  aria-label={`${example.overallLevel} / 5, ${example.overallGrade}`}
                >
                  {"★".repeat(example.overallLevel)}
                  {"☆".repeat(5 - example.overallLevel)}
                </span>{" "}
                {example.overallGrade}
              </p>
              <p className={styles.paragraph}>{example.overall}</p>
              <p className={styles.paragraph}>{example.keywords}</p>
              <p className={styles.paragraph}>{example.tip}</p>
            </div>
          </section>

          <section
            id="faq"
            className={styles.section}
            aria-labelledby="faq-heading"
          >
            <h2 id="faq-heading" className={styles.heading}>
              {t("ui.faqTitle")}
            </h2>
            {faq.map(({ q, a }) => (
              <div key={q} className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>{q}</h3>
                <p className={styles.paragraph}>{a}</p>
              </div>
            ))}
          </section>

          <aside className={styles.cta} aria-labelledby="cta-heading">
            <h2 id="cta-heading" className={styles.ctaTitle}>
              {t("ui.ctaTitle")}
            </h2>
            <p className={styles.paragraph}>{t("ui.ctaBody")}</p>
            <DailyLandingCta />
          </aside>

          <p className={styles.disclaimer}>{t("ui.disclaimer")}</p>
        </article>
      </main>

      <FooterInfo />
    </div>
  );
}
