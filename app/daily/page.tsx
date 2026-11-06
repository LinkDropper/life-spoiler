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
  overallLevel: number;
  dateLabel: string;
  leadName: string;
  sceneNumber: number;
  callTime: string;
  prop: string;
  wardrobe: string;
  hours: number;
  minutes: number;
}

interface LegendItem {
  title: string;
  desc: string;
}

/** 견본 콜시트의 의상 색(남색) 견본. 색 이름 글자가 늘 함께 보인다 */
const SAMPLE_WARDROBE_SWATCH = "#1f2f6b";
const GRADE_LEVELS = [5, 4, 3, 2, 1] as const;
const MAX_LEVEL = 5;

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
  const tDaily = await getTranslations("daily");

  const sections = t.raw("sections") as LandingSection[];
  const faq = t.raw("faq") as LandingFaq[];
  const example = t.raw("example") as LandingExample;
  const legend = t.raw("ui.legend") as LegendItem[];
  const exampleGrade = tDaily(`grade.${example.overallLevel}`);

  const renderStars = (level: number) => (
    <span
      className={styles.stars}
      role="img"
      aria-label={tDaily("stars.label", {
        level,
        grade: tDaily(`grade.${level}`),
      })}
    >
      {"★".repeat(level)}
      <span className={styles.starsOff}>{"★".repeat(MAX_LEVEL - level)}</span>
    </span>
  );

  const renderSectionFigure = (sectionId: string) => {
    if (sectionId === "contents") {
      return (
        <div className={styles.scale}>
          <span className={styles.scaleLabel}>{t("ui.scaleLabel")}</span>
          <ul className={styles.scaleList}>
            {GRADE_LEVELS.map((level) => (
              <li key={level} className={styles.scaleRow}>
                <b>{tDaily(`grade.${level}`)}</b>
                {renderStars(level)}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    if (sectionId === "midnight") {
      return (
        <div
          className={styles.midnight}
          role="img"
          aria-label={t("ui.midnightAria")}
        >
          <span className={`${styles.midnightSheet} ${styles.midnightPast}`}>
            {t("ui.yesterday")}
          </span>
          <span className={styles.midnightClock}>
            <b>00:00</b>
            <span>KST</span>
          </span>
          <span className={styles.midnightSheet}>{t("ui.today")}</span>
        </div>
      );
    }
    return null;
  };

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
            <span className={styles.kicker}>{t("ui.kicker")}</span>
            <h1 className={styles.title}>
              {t("meta.h1")}{" "}
              <span className={styles.badge}>{t("ui.badge")}</span>
            </h1>
            <p className={styles.intro}>{t("intro")}</p>
            <DailyLandingCta />
            <p className={styles.ctaSub}>{t("ui.ctaSub")}</p>
          </header>

          {/* 예시 결과 = 결과 화면과 같은 종이 콜시트 견본. 번호는 아래 "읽는 법"과 짝 */}
          <section
            id="example"
            className={styles.sample}
            aria-labelledby="example-heading"
          >
            <h2 id="example-heading" className={styles.srOnly}>
              {t("ui.exampleTitle")}
            </h2>
            <div className={styles.sheetStage}>
              <span className={styles.clip} aria-hidden="true" />
              <div className={styles.sheet}>
                <span className={styles.stamp}>{t("ui.sampleStamp")}</span>
                <div className={styles.sheetHead}>
                  <span className={styles.sheetMark}>
                    {tDaily("result.callSheet.mark")}
                  </span>
                  <span>{example.dateLabel}</span>
                </div>

                <div className={styles.sheetBlock}>
                  <Pin number={1} />
                  <span className={styles.titleLabel}>
                    {tDaily("result.callSheet.titleLabel")}
                  </span>
                  <p className={styles.dayTitle}>{exampleGrade}</p>
                  <span className={styles.lead}>
                    {tDaily("result.callSheet.lead")} <b>{example.leadName}</b>
                  </span>
                </div>

                <div className={styles.cellsWrap}>
                  <Pin number={2} />
                  <dl className={styles.cells}>
                    <div className={styles.cell}>
                      <dt className={styles.monoLabel}>
                        {tDaily("result.callSheet.scene")}
                      </dt>
                      <dd className={styles.sceneValue}>
                        {tDaily("result.callSheet.sceneValue", {
                          number: example.sceneNumber,
                        })}
                      </dd>
                    </div>
                    <div className={styles.cell}>
                      <dt className={styles.monoLabel}>
                        {tDaily("result.callSheet.callTime")}
                      </dt>
                      <dd className={styles.cellValue}>{example.callTime}</dd>
                    </div>
                    <div className={styles.cell}>
                      <dt className={styles.monoLabel}>
                        {tDaily("category.overall")}
                      </dt>
                      <dd className={styles.cellValue}>
                        {renderStars(example.overallLevel)} {exampleGrade}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className={styles.sheetBlock}>
                  <Pin number={3} />
                  <span className={styles.monoLabel}>
                    {tDaily("result.callSheet.synopsis")}
                  </span>
                  <p className={styles.headline}>{example.headline}</p>
                  <p className={styles.synopsis}>{example.overall}</p>
                </div>

                <div className={styles.sheetBlock}>
                  <Pin number={4} />
                  <span className={styles.monoLabel}>
                    {tDaily("result.callSheet.props")}
                  </span>
                  <dl className={styles.propGrid}>
                    <div className={styles.propBox}>
                      <dt>{tDaily("result.callSheet.prop")}</dt>
                      <dd>{example.prop}</dd>
                    </div>
                    <div className={styles.propBox}>
                      <dt>{tDaily("result.callSheet.wardrobe")}</dt>
                      <dd>
                        <span
                          className={styles.swatch}
                          style={{ background: SAMPLE_WARDROBE_SWATCH }}
                          aria-hidden="true"
                        />
                        {example.wardrobe}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className={styles.sheetFoot}>
                  <Pin number={5} />
                  <span>{tDaily("result.callSheet.nextCall")}</span>
                  <span>
                    {tDaily("result.callSheet.remaining", {
                      hours: example.hours,
                      minutes: example.minutes,
                    })}
                  </span>
                </div>
              </div>
            </div>
            <p className={styles.sampleNote}>{t("ui.exampleNote")}</p>
          </section>

          <section className={styles.section} aria-labelledby="legend-heading">
            <div className={styles.sectionHead}>
              <span className={styles.note}>{t("ui.howToReadKicker")}</span>
              <h2 id="legend-heading" className={styles.heading}>
                {t("ui.howToReadTitle")}
              </h2>
            </div>
            <ol className={styles.legend}>
              {legend.map((item, index) => (
                <li key={item.title} className={styles.legendItem}>
                  <span className={styles.legendNo} aria-hidden="true">
                    {index + 1}
                  </span>
                  <span className={styles.legendText}>
                    <b>{item.title}</b>
                    <span>{item.desc}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          {sections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              className={styles.section}
              aria-labelledby={`${section.id}-heading`}
            >
              <div className={styles.sectionHead}>
                <span className={styles.note}>
                  {t("ui.note", { number: String(index + 1).padStart(2, "0") })}
                </span>
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

          <aside className={styles.cta} aria-labelledby="cta-heading">
            <span className={styles.note}>{t("ui.ctaKicker")}</span>
            <h2 id="cta-heading" className={styles.ctaTitle}>
              {t("ui.ctaTitle")}
            </h2>
            <p className={styles.ctaBody}>{t("ui.ctaBody")}</p>
            <DailyLandingCta />
          </aside>

          <p className={styles.disclaimer}>{t("ui.disclaimer")}</p>
        </article>
      </main>

      <FooterInfo />
    </div>
  );
}

/** 견본 위 번호표: 아래 "콜시트 읽는 법"의 같은 번호와 짝 */
const Pin = ({ number }: { number: number }) => (
  <span className={styles.pin} aria-hidden="true">
    {number}
  </span>
);
