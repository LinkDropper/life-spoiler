import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { FaceReportMarkdown } from "@/components/face-spoiler/FaceReportMarkdown";
import { Header } from "@/components/face-spoiler/Header";
import { PreviewFooter } from "@/components/face-spoiler/PreviewFooter";
import { isFaceReport } from "@/libs/face-spoiler/types";
import { createServerClient } from "@/libs/supabase";

import styles from "./page.module.css";

const TEASER_SECTION_COUNT = 2;

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

  const t = await getTranslations("faceSpoiler.preview");

  // 새 흐름(v5)이 아닌 리포트는 legacy 안내 페이지
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

  const allSections = record.result.sections;
  const teaserSections = allSections.slice(0, TEASER_SECTION_COUNT);
  const lockedCount = Math.max(0, allSections.length - teaserSections.length);

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.content}>
          <FaceReportMarkdown sections={teaserSections} />
          {lockedCount > 0 && (
            <p className={styles.lockHint}>
              🔒{" "}
              {t("teaserLockCount", {
                count: lockedCount,
                default: `이어지는 ${lockedCount}개 섹션은 결제 후 공개돼요.`,
              })}
            </p>
          )}
          <p className={styles.teaser}>
            {t("teaser", {
              default:
                "여기까지는 예고편이에요. 본편에서는 부위별 특징과 재물·연애·직업 운까지 모두 확인할 수 있어요.",
            })}
          </p>
        </div>
      </div>

      <PreviewFooter shareId={shareId} />
    </>
  );
}
