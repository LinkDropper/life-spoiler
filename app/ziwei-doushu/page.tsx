import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { FooterInfo, HeaderClient } from "@/components/landing";
import { JsonLd } from "@/components/seo/JsonLd";
import { getLocalizedAlternates, getSeoLocale } from "@/libs/seo/metadata";
import {
  OPEN_GRAPH_LOCALE,
  SITE_NAME,
  buildLocalizedUrl,
} from "@/libs/seo/site";
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildFaqPageSchema,
} from "@/libs/seo/structured-data";
import { getOpenGraphImage } from "@/libs/utils/og";

import styles from "./page.module.css";

const PAGE_PATH = "/ziwei-doushu";
const DATE_PUBLISHED = "2026-10-13";
/** 본문을 수정하면 함께 갱신한다 (app/sitemap.ts의 lastModified도 동일하게). */
const DATE_MODIFIED = "2026-10-13";

interface GuideSection {
  id: string;
  heading: string;
  paragraphs: string[];
}

interface GuideComparison {
  caption: string;
  headers: string[];
  rows: string[][];
}

interface GuideFaq {
  q: string;
  a: string;
}

interface GuideGlossaryItem {
  term: string;
  reading: string;
  definition: string;
}

export const generateMetadata = async (): Promise<Metadata> => {
  const locale = await getSeoLocale();
  const t = await getTranslations("ziweiGuide.meta");
  const title = t("title");
  const description = t("description");
  const ogImage = getOpenGraphImage(locale);

  return {
    title,
    description,
    alternates: await getLocalizedAlternates(PAGE_PATH),
    openGraph: {
      type: "article",
      locale: OPEN_GRAPH_LOCALE[locale],
      url: buildLocalizedUrl(PAGE_PATH, locale),
      siteName: SITE_NAME[locale],
      title,
      description,
      publishedTime: DATE_PUBLISHED,
      modifiedTime: DATE_MODIFIED,
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

export default async function ZiweiGuidePage() {
  const locale = await getSeoLocale();
  const t = await getTranslations("ziweiGuide");

  const sections = t.raw("sections") as GuideSection[];
  const comparison = t.raw("comparison") as GuideComparison;
  const faq = t.raw("faq") as GuideFaq[];
  const glossary = t.raw("glossary") as GuideGlossaryItem[];
  const [comparisonHeader, ...comparisonColumns] = comparison.headers;

  const formattedDate = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "Asia/Seoul",
  }).format(new Date(`${DATE_MODIFIED}T00:00:00+09:00`));

  return (
    <div className={styles.page}>
      <JsonLd
        data={[
          buildArticleSchema({
            path: PAGE_PATH,
            locale,
            headline: t("meta.h1"),
            description: t("meta.description"),
            datePublished: DATE_PUBLISHED,
            dateModified: DATE_MODIFIED,
            image: getOpenGraphImage(locale),
            about: ["Zi Wei Dou Shu", "紫微斗數", "자미두수"],
          }),
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
            <h1 className={styles.title}>{t("meta.h1")}</h1>
            <p className={styles.updated}>
              {t("ui.updatedLabel")}{" "}
              <time dateTime={DATE_MODIFIED}>{formattedDate}</time>
            </p>
            <p className={styles.intro}>{t("intro")}</p>
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

              {section.id === "vsSaju" && (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <caption className={styles.caption}>
                      {comparison.caption}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">{comparisonHeader}</th>
                        {comparisonColumns.map((header) => (
                          <th key={header} scope="col">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.rows.map(([label, ...cells]) => (
                        <tr key={label}>
                          <th scope="row">{label}</th>
                          {cells.map((cell) => (
                            <td key={cell}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}

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

          <section
            id="glossary"
            className={styles.section}
            aria-labelledby="glossary-heading"
          >
            <h2 id="glossary-heading" className={styles.heading}>
              {t("ui.glossaryTitle")}
            </h2>
            <dl className={styles.glossary}>
              {glossary.map(({ term, reading, definition }) => (
                <div key={term} className={styles.glossaryItem}>
                  <dt className={styles.glossaryTerm}>
                    {term}
                    {reading && (
                      <span className={styles.glossaryReading}>
                        {" "}
                        ({reading})
                      </span>
                    )}
                  </dt>
                  <dd className={styles.glossaryDefinition}>{definition}</dd>
                </div>
              ))}
            </dl>
          </section>

          <aside className={styles.cta} aria-labelledby="cta-heading">
            <h2 id="cta-heading" className={styles.ctaTitle}>
              {t("ui.ctaTitle")}
            </h2>
            <p className={styles.ctaDescription}>{t("ui.ctaDescription")}</p>
            <Link href="/" className={styles.ctaButton}>
              {t("ui.ctaButton")}
            </Link>
          </aside>

          <p className={styles.disclaimer}>{t("ui.disclaimer")}</p>
        </article>
      </main>

      <FooterInfo />
    </div>
  );
}
