import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { env } from "@/env";
import { Header } from "@/components/face-spoiler/Header";
import { ReportShareButtons } from "@/components/face-spoiler/ReportShareButtons";
import { ReportView } from "@/components/face-spoiler/ReportView";
import type { FaceReportData } from "@/libs/face-spoiler/types";
import { createServerClient } from "@/libs/supabase";

import styles from "./page.module.css";

const CHARACTER_BUCKET = "face-characters";

interface ReportPageProps {
  params: Promise<{ shareId: string }>;
}

interface FaceReportRecord {
  share_id: string;
  result: FaceReportData;
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

  return {
    share_id: data.share_id,
    result: data.result as unknown as FaceReportData,
    paid_at: data.paid_at,
    character_image_path: data.character_image_path,
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
  const report = await fetchReport(shareId);
  const tMeta = await getTranslations("faceSpoiler.metadata");

  const headline =
    report?.result.profile.headline ??
    tMeta("defaultHeadline", { default: "관상 분석 결과" });
  const description =
    report?.result.shareLine ??
    tMeta("defaultDescription", {
      default: "사진 한 장으로 받아본 AI 관상 리포트. 지금 확인해보세요.",
    });
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
  const report = await fetchReport(shareId);

  if (!report) {
    notFound();
  }

  const characterImageUrl = buildCharacterImageUrl(report.character_image_path);

  return (
    <>
      <Header />
      <div className={styles.container}>
        {characterImageUrl && (
          <div className={styles.heroImage}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={characterImageUrl}
              alt=""
              className={styles.heroImageInner}
            />
          </div>
        )}
        <div className={styles.content}>
          <ReportView report={report.result} />
          <ReportShareButtons
            shareId={shareId}
            shareLine={report.result.shareLine}
          />
        </div>
      </div>
    </>
  );
}
