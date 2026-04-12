import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AnimalHero } from "@/components/face-spoiler/AnimalHero";
import { Header } from "@/components/face-spoiler/Header";
import { PreviewFooter } from "@/components/face-spoiler/PreviewFooter";
import { isV2Report } from "@/libs/face-spoiler/types";
import type { TraitsSection } from "@/libs/face-spoiler/types";
import { createServerClient } from "@/libs/supabase";

import styles from "./page.module.css";

interface PreviewPageProps {
  params: Promise<{ shareId: string }>;
}

interface FaceReportRecord {
  share_id: string;
  result: unknown;
  paid_at: string | null;
}

const fetchReport = async (
  shareId: string
): Promise<FaceReportRecord | null> => {
  const adminClient = createServerClient();
  const { data, error } = await adminClient
    .from("face_reports")
    .select("share_id, result, paid_at")
    .eq("share_id", shareId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as unknown as {
    share_id: string;
    result: unknown;
    paid_at: string | null;
  };

  return {
    share_id: row.share_id,
    result: row.result,
    paid_at: row.paid_at,
  };
};

const extractFirstSentence = (traits: TraitsSection): string => {
  const firstParagraph = traits.strengths
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .find((paragraph) => paragraph.length > 0);
  if (!firstParagraph) {
    return "";
  }
  const match = firstParagraph.match(/^[^.!?。！？]+[.!?。！？]?/);
  return match ? match[0].trim() : firstParagraph;
};

export const generateMetadata = async ({
  params,
}: PreviewPageProps): Promise<Metadata> => {
  const { shareId } = await params;
  const record = await fetchReport(shareId);
  const tMeta = await getTranslations("faceSpoiler.metadata");

  const defaultHeadline = tMeta("defaultHeadline", {
    default: "관상 분석 결과",
  });
  const defaultDescription = tMeta("defaultDescription", {
    default: "사진 한 장으로 받아본 AI 관상 리포트. 지금 확인해보세요.",
  });

  const headline =
    record && isV2Report(record.result)
      ? record.result.firstImpression.headline
      : defaultHeadline;
  const description =
    record && isV2Report(record.result)
      ? record.result.shareLine
      : defaultDescription;

  const fullTitle = tMeta("shareTitleSuffix", {
    headline,
    default: `관상스포 — ${headline}`,
  });

  const previewUrl = `https://life-spoiler.com/face-spoiler/preview/${shareId}`;
  const ogImage = "/images/face-spoiler-open-graph.png";

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      type: "article",
      url: previewUrl,
      siteName: "관상스포",
      images: [
        {
          url: ogImage,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: previewUrl,
    },
  };
};

export default async function FaceSpoilerPreviewPage({
  params,
}: PreviewPageProps) {
  const { shareId } = await params;
  const record = await fetchReport(shareId);

  if (!record) {
    notFound();
  }

  const t = await getTranslations("faceSpoiler.preview");

  // 하드 컷오버: v1 리포트는 레거시 안내
  if (!isV2Report(record.result)) {
    const tLegacy = await getTranslations("faceSpoiler.report.legacy");
    return (
      <>
        <Header />
        <div className={styles.container}>
          <div className={styles.content}>
            <div className={styles.legacyNotice}>
              <h1 className={styles.legacyTitle}>{tLegacy("title")}</h1>
              <p className={styles.legacyDescription}>
                {tLegacy("description")}
              </p>
              <Link href="/face-spoiler/upload" className={styles.legacyCta}>
                {tLegacy("ctaButton")}
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const report = record.result;
  const { firstImpression, traits } = report;
  const traitsTeaser = extractFirstSentence(traits);

  return (
    <>
      <Header />
      <div className={styles.container}>
        {/* 동물상 히어로 (primary만, 본편 컨텍스트 제외) */}
        <AnimalHero
          animalMatch={report.animalMatch}
          characterImageUrl={null}
          characterImagePlaceholder={t("characterPlaceholder")}
          showFullContext={false}
        />

        <div className={styles.content}>
          {/* 첫인상 섹션 */}
          <section className={styles.profileSection}>
            <h2 className={styles.sectionTag}>
              {t("firstImpressionSectionTag")}
            </h2>
            <h1 className={styles.headline}>{firstImpression.headline}</h1>
            <p className={styles.description}>{firstImpression.description}</p>
            <div className={styles.summary}>
              {firstImpression.summary
                .split(/\n\s*\n/)
                .map((paragraph) => paragraph.trim())
                .filter((paragraph) => paragraph.length > 0)
                .map((paragraph, index) => (
                  <p key={index} className={styles.paragraph}>
                    {paragraph}
                  </p>
                ))}
            </div>
          </section>

          {/* vibeTags */}
          {firstImpression.vibeTags.length > 0 && (
            <section className={styles.vibeSection}>
              <h3 className={styles.vibeTitle}>{t("vibeTagsTitle")}</h3>
              <div className={styles.vibeTagGroup}>
                {firstImpression.vibeTags.map((tag, index) => (
                  <span key={index} className={styles.vibeTag}>
                    #{tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* traits 티저 */}
          {traitsTeaser && (
            <section className={styles.traitsTeaserSection}>
              <h3 className={styles.traitsTeaserTitle}>
                {t("traitsTeaserTitle")}
              </h3>
              <p className={styles.traitsTeaserBody}>{traitsTeaser}</p>
              <p className={styles.traitsTeaserHint}>
                {t("traitsTeaserLockHint")}
              </p>
            </section>
          )}

          {/* 티저 문구 */}
          <p className={styles.teaser}>{t("teaser")}</p>
        </div>
      </div>

      <PreviewFooter shareId={shareId} />
    </>
  );
}
