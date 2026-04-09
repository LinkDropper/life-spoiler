import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { CharacterImagePlaceholder } from "@/components/face-spoiler/CharacterImagePlaceholder";
import { Header } from "@/components/face-spoiler/Header";
import { PreviewFooter } from "@/components/face-spoiler/PreviewFooter";
import type { FaceReportData } from "@/libs/face-spoiler/types";
import { createServerClient } from "@/libs/supabase";

import styles from "./page.module.css";

interface PreviewPageProps {
  params: Promise<{ shareId: string }>;
}

interface FaceReportRecord {
  share_id: string;
  result: FaceReportData;
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

  return {
    share_id: data.share_id,
    result: data.result as unknown as FaceReportData,
    paid_at: data.paid_at,
  };
};

export const generateMetadata = async ({
  params,
}: PreviewPageProps): Promise<Metadata> => {
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

export default async function FaceSpoilerPreviewPage({
  params,
}: PreviewPageProps) {
  const { shareId } = await params;
  const report = await fetchReport(shareId);

  if (!report) {
    notFound();
  }

  const t = await getTranslations("faceSpoiler.preview");
  const { profile } = report.result;

  return (
    <>
      <Header />
      <div className={styles.container}>
        {/* 최상단 캐릭터 이미지 플레이스홀더 */}
        <CharacterImagePlaceholder />

        <div className={styles.content}>
          {/* 첫인상 섹션 (미리보기에서는 유일한 노출 컨텐츠) */}
          <section className={styles.profileSection}>
            <h2 className={styles.sectionTag}>
              {t("profileSectionTag", { default: "첫인상" })}
            </h2>
            <h1 className={styles.headline}>{profile.headline}</h1>
            <p className={styles.description}>{profile.description}</p>
            <div className={styles.summary}>
              {profile.summary
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

          {/* Teaser 문구 */}
          <p className={styles.teaser}>
            {t("teaser", {
              default:
                "지금 보신 건 '예고편'에 불과해요. 얼굴에 숨겨진 진짜 커리어·재물·인연의 흐름과 나만의 관상 캐릭터는 본편에서만 몰래 스포해 드릴게요. 🤫",
            })}
          </p>
        </div>
      </div>

      {/* 하단 고정 결제 유도 CTA */}
      <PreviewFooter shareId={shareId} />
    </>
  );
}
