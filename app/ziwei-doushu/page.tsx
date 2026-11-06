import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { FooterInfo, HeaderClient } from "@/components/landing";
import { PalaceGrid } from "@/components/landing/cinema/PalaceGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildChartSnapshot } from "@/libs/landing/chart-snapshot";
import { LANDING_PROTAGONIST } from "@/libs/landing/landing-cinema-data";
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
import { MAIN_STAR_NAMES } from "@/libs/zi-wei-dou-shu/constants/stars";
import { translateStarName } from "@/libs/zi-wei-dou-shu/i18n";

import styles from "./page.module.css";

const PAGE_PATH = "/ziwei-doushu";
const DATE_PUBLISHED = "2026-10-13";
/** 본문을 수정하면 함께 갱신한다 (app/sitemap.ts의 lastModified도 동일하게). */
const DATE_MODIFIED = "2026-10-13";

interface GuideSection {
  id: string;
  heading: string;
  /** 목차에 쓰는 짧은 장 이름 */
  toc: string;
  paragraphs: string[];
}

/** 14주성 중 앞 6개가 자미 계열, 뒤 8개가 천부 계열 */
const ZIWEI_GROUP_SIZE = 6;
/** 대운 띠에 보여 줄 앞쪽 대운 수 */
const DAYUN_FRAME_COUNT = 5;

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
  const sihua = t.raw("ui.sihua") as string[];
  const [, ...comparisonColumns] = comparison.headers;

  const formattedDate = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "Asia/Seoul",
  }).format(new Date(`${DATE_MODIFIED}T00:00:00+09:00`));

  // 명반 그림·대운 띠: 랜딩과 같은 예시 인물의 실제 계산값
  const sample = buildChartSnapshot(
    { name: "guide", calendarType: "solar", ...LANDING_PROTAGONIST },
    locale
  );
  const dayunFrames = sample.frames.slice(0, DAYUN_FRAME_COUNT);
  const mainStars = MAIN_STAR_NAMES.map((star) =>
    translateStarName(star, locale)
  );
  const starGroups = [
    { label: t("ui.ziweiGroup"), items: mainStars.slice(0, ZIWEI_GROUP_SIZE) },
    { label: t("ui.tianfuGroup"), items: mainStars.slice(ZIWEI_GROUP_SIZE) },
    { label: t("ui.sihuaGroup"), items: sihua },
  ];

  const toNoteLabel = (index: number) =>
    t("ui.note", { number: String(index + 1).padStart(2, "0") });

  const renderSectionFigure = (sectionId: string) => {
    if (sectionId === "structure") {
      return (
        <>
          <figure className={styles.chart}>
            <PalaceGrid
              cells={sample.cells}
              mingBranch={sample.mingBranch}
              centerLabel={t("ui.chartCenter")}
              ariaLabel={t("ui.chartAria")}
            />
            <figcaption className={styles.caption}>
              {t("ui.chartCaption")}
            </figcaption>
          </figure>
          <div className={styles.starGroups}>
            {starGroups.map((group, index) => (
              <div key={group.label} className={styles.starGroup}>
                <span className={styles.groupLabel}>{group.label}</span>
                <ul className={`${styles.chips} ${styles[`chips${index}`]}`}>
                  {group.items.map((item) => (
                    <li key={item} className={styles.chip}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      );
    }
    if (sectionId === "vsSaju") {
      return (
        <table className={styles.table}>
          <caption className={styles.caption}>{comparison.caption}</caption>
          <thead>
            <tr>
              {comparisonColumns.map((header) => (
                <th key={header} scope="col">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          {comparison.rows.map(([label, ...cells]) => (
            <tbody key={label}>
              <tr>
                <th scope="colgroup" colSpan={cells.length}>
                  {label}
                </th>
              </tr>
              <tr>
                {cells.map((cell) => (
                  <td key={cell}>{cell}</td>
                ))}
              </tr>
            </tbody>
          ))}
        </table>
      );
    }
    if (sectionId === "daeun") {
      return (
        <figure className={styles.dayun}>
          <span className={styles.groupLabel}>{t("ui.dayunLabel")}</span>
          <ol className={styles.dayunStrip} aria-label={t("ui.dayunAria")}>
            {dayunFrames.map((frame, index) => (
              <li
                key={frame.startAge}
                className={`${styles.dayunFrame} ${index === 0 ? styles.dayunFirst : ""}`}
              >
                <b>
                  {t("ui.dayunAge", {
                    start: frame.startAge,
                    end: frame.endAge,
                  })}
                </b>
                <span>{frame.palaceName}</span>
              </li>
            ))}
          </ol>
          <figcaption className={styles.caption}>
            {t("ui.dayunCaption")}
          </figcaption>
        </figure>
      );
    }
    return null;
  };

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
            <span className={styles.kicker}>{t("ui.kicker")}</span>
            <h1 className={styles.title}>{t("meta.h1")}</h1>
            <p className={styles.updated}>
              {t("ui.updatedLabel")}{" "}
              <time dateTime={DATE_MODIFIED}>{formattedDate}</time>
            </p>
            <p className={styles.intro}>{t("intro")}</p>
          </header>

          <nav className={styles.toc} aria-label={t("ui.tocAria")}>
            <span className={styles.tocLabel}>{t("ui.tocLabel")}</span>
            <ol className={styles.tocList}>
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className={styles.tocLink}>
                    <span className={styles.tocNo}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {section.toc}
                  </a>
                </li>
              ))}
              <li>
                <a href="#faq" className={styles.tocLink}>
                  <span className={styles.tocNo}>Q</span>
                  {t("ui.faqTitle")}
                </a>
              </li>
              <li>
                <a href="#glossary" className={styles.tocLink}>
                  <span className={styles.tocNo}>G</span>
                  {t("ui.glossaryTitle")}
                </a>
              </li>
            </ol>
          </nav>

          {sections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              className={styles.section}
              aria-labelledby={`${section.id}-heading`}
            >
              <div className={styles.sectionHead}>
                <span className={styles.note}>{toNoteLabel(index)}</span>
                <h2 id={`${section.id}-heading`} className={styles.heading}>
                  {section.heading}
                </h2>
              </div>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className={styles.paragraph}>
                  {paragraph}
                </p>
              ))}
              {renderSectionFigure(section.id)}
            </section>
          ))}

          <section
            id="faq"
            className={styles.section}
            aria-labelledby="faq-heading"
          >
            <div className={styles.sectionHead}>
              <span className={styles.note}>{t("ui.faqKicker")}</span>
              <h2 id="faq-heading" className={styles.heading}>
                {t("ui.faqTitle")}
              </h2>
            </div>
            <div className={styles.faqList}>
              {faq.map(({ q, a }, index) => (
                <details key={q} className={styles.faqItem} open={index === 0}>
                  <summary className={styles.faqQuestion}>
                    <h3>{q}</h3>
                    <span className={styles.faqMark} aria-hidden="true" />
                  </summary>
                  <p className={styles.faqAnswer}>{a}</p>
                </details>
              ))}
            </div>
          </section>

          <section
            id="glossary"
            className={styles.credits}
            aria-labelledby="glossary-heading"
          >
            <div className={styles.creditsHead}>
              <span className={styles.creditsKicker}>
                {t("ui.glossaryKicker")}
              </span>
              <h2 id="glossary-heading" className={styles.heading}>
                {t("ui.glossaryTitle")}
              </h2>
            </div>
            <dl className={styles.glossary}>
              {glossary.map(({ term, reading, definition }) => (
                <div key={term} className={styles.glossaryItem}>
                  <dt className={styles.glossaryTerm}>
                    {term}
                    {reading && (
                      <span className={styles.glossaryReading}>{reading}</span>
                    )}
                  </dt>
                  <dd className={styles.glossaryDefinition}>{definition}</dd>
                </div>
              ))}
            </dl>
          </section>

          <aside className={styles.cta} aria-labelledby="cta-heading">
            <span className={styles.kicker}>{t("ui.ctaKicker")}</span>
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
