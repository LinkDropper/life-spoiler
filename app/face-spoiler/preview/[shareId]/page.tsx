import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Header } from "@/components/face-spoiler/Header";
import { PreviewFooter } from "@/components/face-spoiler/PreviewFooter";
import { ScoreGauge } from "@/components/face-spoiler/ScoreGauge";
import { SignatureHero } from "@/components/face-spoiler/SignatureHero";
import { isV3Report } from "@/libs/face-spoiler/types.v3";
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
    record && isV3Report(record.result)
      ? record.result.signature.oneLineDefinition
      : defaultHeadline;
  const description =
    record && isV3Report(record.result)
      ? record.result.closing.shareLine
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

  // 하드 컷오버: v3가 아닌 리포트는 레거시 안내
  if (!isV3Report(record.result)) {
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
  const { signature, overallScore, regionScores, interestAreas } = report;

  // 프리뷰 노출: hero 전체(점수 포함) + summary 첫 단락 + highlights 2개 + 부위 라벨만 + 분야 라벨만
  const firstSummaryParagraph = overallScore.summary
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p.length > 0);

  const highlightsPreview = overallScore.highlights.slice(0, 2);
  const remainingHighlights = Math.max(
    0,
    overallScore.highlights.length - highlightsPreview.length
  );

  // v3 라벨 — 현재는 한국어 하드코딩. 추후 messages/translations.json 확장 시 교체.
  const heroLabels = {
    keywordsTitle: "핵심 키워드",
    phraseLabel: "자주 듣는 말",
    misreadLabel: "자주 받는 오해",
    scoreLabel: "종합 점수",
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.content}>
          <SignatureHero
            signature={signature}
            totalScore={overallScore.totalScore}
            scoreOneLiner={overallScore.scoreOneLiner}
            labels={heroLabels}
          />

          {/* 종합 인상 티저 — 첫 단락 + highlights 2개 + 잠금 라벨 */}
          <section className={styles.teaserSection}>
            <h2 className={styles.teaserTitle}>종합 인상</h2>
            {firstSummaryParagraph && (
              <p className={styles.teaserParagraph}>{firstSummaryParagraph}</p>
            )}
            <ul className={styles.highlightList}>
              {highlightsPreview.map((h, i) => (
                <li key={i} className={styles.highlightItem}>
                  <strong className={styles.highlightTitle}>{h.title}</strong>
                  <span className={styles.highlightBody}>{h.body}</span>
                </li>
              ))}
            </ul>
            {remainingHighlights > 0 && (
              <p className={styles.lockHint}>
                🔒 + {remainingHighlights}개의 인상 특성이 본편에 있어요
              </p>
            )}
          </section>

          {/* 부위별 점수 잠금 라벨 */}
          <section className={styles.teaserSection}>
            <h2 className={styles.teaserTitle}>부위별 점수</h2>
            <div className={styles.regionLabelGrid}>
              {regionScores.regions.map((region) => (
                <span key={region.region} className={styles.regionLabel}>
                  {region.label}
                </span>
              ))}
            </div>
            <div className={styles.lockedGauge}>
              <ScoreGauge
                score={overallScore.totalScore}
                label="본편에서 공개되는 점수"
                variant="region"
              />
              <p className={styles.lockHint}>
                🔒 {regionScores.regions.length}개 부위의 점수와 한 줄 평이
                본편에서 공개돼요
              </p>
            </div>
          </section>

          {/* 분야 라벨 미리보기 */}
          <section className={styles.teaserSection}>
            <h2 className={styles.teaserTitle}>본편에서 만날 디테일</h2>
            <div className={styles.interestTeaserList}>
              {interestAreas.areas.map((area) => (
                <div key={area.domain} className={styles.interestTeaserItem}>
                  <span className={styles.interestTeaserLabel}>
                    {area.label}
                  </span>
                  <span className={styles.interestTeaserLocked}>🔒</span>
                </div>
              ))}
            </div>
          </section>

          <p className={styles.teaser}>
            {t("teaser", {
              default:
                "여기까지는 예고편이에요. 본편에서는 부위별 점수와 연애·재물·직장 디테일이 모두 공개돼요.",
            })}
          </p>
        </div>
      </div>

      <PreviewFooter shareId={shareId} />
    </>
  );
}
