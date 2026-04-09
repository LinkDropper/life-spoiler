import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { env } from "@/env";
import { AnimalHero } from "@/components/face-spoiler/AnimalHero";
import { Header } from "@/components/face-spoiler/Header";
import { ReportShareButtons } from "@/components/face-spoiler/ReportShareButtons";
import { ReportView } from "@/components/face-spoiler/ReportView";
import { isV2Report } from "@/libs/face-spoiler/types";
import { createServerClient } from "@/libs/supabase";

import styles from "./page.module.css";

const CHARACTER_BUCKET = "face-characters";

interface ReportPageProps {
  params: Promise<{ shareId: string }>;
}

interface FaceReportRecord {
  share_id: string;
  result: unknown;
  paid_at: string | null;
  character_image_path: string | null;
}

const fetchReport = async (
  shareId: string
): Promise<FaceReportRecord | null> => {
  const adminClient = createServerClient();
  const { data, error } = await adminClient
    .from("face_reports")
    .select("share_id, result, paid_at, character_image_path")
    .eq("share_id", shareId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as unknown as {
    share_id: string;
    result: unknown;
    paid_at: string | null;
    character_image_path: string | null;
  };

  return {
    share_id: row.share_id,
    result: row.result,
    paid_at: row.paid_at,
    character_image_path: row.character_image_path,
  };
};

const buildCharacterImageUrl = (path: string | null): string | null => {
  if (!path) return null;
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/${CHARACTER_BUCKET}/${path}`;
};

export const generateMetadata = async ({
  params,
}: ReportPageProps): Promise<Metadata> => {
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

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      type: "article",
    },
  };
};

export default async function FaceSpoilerReportPage({
  params,
}: ReportPageProps) {
  const { shareId } = await params;
  const record = await fetchReport(shareId);

  if (!record) {
    notFound();
  }

  const characterImageUrl = buildCharacterImageUrl(record.character_image_path);

  // 하드 컷오버: v1 리포트는 fallback 안내 페이지 노출
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

  return (
    <>
      <Header />
      <div className={styles.container}>
        <AnimalHero
          animalMatch={report.animalMatch}
          characterImageUrl={characterImageUrl}
          showFullContext
        />
        <div className={styles.content}>
          <ReportView report={report} />
          <ReportShareButtons shareId={shareId} shareLine={report.shareLine} />
        </div>
      </div>
    </>
  );
}
