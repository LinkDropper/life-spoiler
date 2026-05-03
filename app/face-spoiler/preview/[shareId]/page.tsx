import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Header } from "@/components/face-spoiler/Header";
import { PreviewBulletPoints } from "@/components/face-spoiler/PreviewBulletPoints";
import { PreviewFooter } from "@/components/face-spoiler/PreviewFooter";
import { PreviewPartsSection } from "@/components/face-spoiler/PreviewPartsSection";
import { PreviewProfileCard } from "@/components/face-spoiler/PreviewProfileCard";
import { PreviewSummaryCard } from "@/components/face-spoiler/PreviewSummaryCard";
import { PreviewTeaserCta } from "@/components/face-spoiler/PreviewTeaserCta";
import {
  extractAnimalShortName,
  findSectionByNumber,
  parseFirstImpression,
  parseParts,
} from "@/libs/face-spoiler/preview-parser";
import { isFaceReport } from "@/libs/face-spoiler/types";
import { createServerClient } from "@/libs/supabase";

import styles from "./page.module.css";

/**
 * 잠금된 섹션 라벨의 i18n 키 — 결제 후 해제됨을 안내하는 마케팅 카피.
 * 새 프롬프트 9섹션 구성 기준 (sections 3~9). 라벨 텍스트는 translations.json
 * 의 \`faceSpoiler.preview.lockedSections\` 에서 ko/en/ja 별로 관리한다.
 */
const LOCKED_SECTION_KEYS = [
  "animalTraits",
  "firstImpression",
  "wealth",
  "love",
  "career",
  "anger",
  "overallEvaluation",
] as const;

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
  const tMeta = await getTranslations("faceSpoiler.metadata");

  const title = tMeta("defaultHeadline", { default: "관상스포 — 관상 리포트" });
  const description = tMeta("defaultDescription", {
    default: "사진 한 장으로 받아본 관상 리포트.",
  });

  const previewUrl = `https://life-spoiler.com/face-spoiler/preview/${shareId}`;
  const ogImage = "/images/face-spoiler-open-graph.png";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: previewUrl,
      siteName: "관상스포",
      images: [
        {
          url: ogImage,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
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

  if (!isFaceReport(record.result)) {
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

  const tPreview = await getTranslations("faceSpoiler.preview");
  const tLocked = await getTranslations("faceSpoiler.preview.lockedSections");
  const lockedSectionLabels = LOCKED_SECTION_KEYS.map((key) => tLocked(key));

  const {
    sections,
    totalScore,
    finalCharacterTitle: rawFinalTitle,
  } = record.result;
  const finalCharacterTitle = rawFinalTitle.trim();

  const section1 = findSectionByNumber(sections, 1);
  const section2 = findSectionByNumber(sections, 2);
  const section3 = findSectionByNumber(sections, 3);

  const firstImpression = section1
    ? parseFirstImpression(section1.body)
    : { lead: "", points: [], summary: null };

  const summaryFallback = section1?.oneLiner.trim() ?? "";
  const summaryText = firstImpression.summary ?? summaryFallback;

  const parts = section2
    ? parseParts(section2.body)
    : { items: [], summary: null };

  const animalShortName = section3
    ? extractAnimalShortName(section3.body)
    : null;

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.content}>
          <PreviewProfileCard
            characterTitle={finalCharacterTitle}
            totalScore={totalScore}
            animalShortName={animalShortName}
            leadParagraph={firstImpression.lead}
            placeholderCaption={tPreview("imagePlaceholderCaption", {
              default: "전체 스포를 확인하면 일러스트를 확인할 수 있어요",
            })}
          />

          <PreviewBulletPoints points={firstImpression.points} />

          <PreviewSummaryCard
            label={tPreview("summaryLabel", { default: "한마디로" })}
            text={summaryText}
          />

          <PreviewPartsSection
            title={tPreview("partsTitle", { default: "부위별 관상" })}
            items={parts.items}
            summary={parts.summary}
            summaryLabel={tPreview("partsSummaryLabel", {
              default: "한 줄 평",
            })}
          />
        </div>

        <PreviewTeaserCta
          headline={tPreview("teaserHeadline", {
            default: "지금 보신 건 예고편이에요",
          })}
          description={tPreview("teaser", {
            default:
              "동물상의 세부 매칭 근거, 숨겨진 매력, 일과 재물의 흐름까지 본편에서 몰래 스포해 드릴게요 🤫",
          })}
          lockedLabels={lockedSectionLabels}
        />
      </div>

      <PreviewFooter shareId={shareId} />
    </>
  );
}
