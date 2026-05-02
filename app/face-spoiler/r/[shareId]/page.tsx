import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { env } from "@/env";
import { FaceReportActions } from "@/components/face-spoiler/FaceReportActions";
import { FaceReportMarkdown } from "@/components/face-spoiler/FaceReportMarkdown";
import { GuestFaceActions } from "@/components/face-spoiler/GuestFaceActions";
import { Header } from "@/components/face-spoiler/Header";
import { PreviewBulletPoints } from "@/components/face-spoiler/PreviewBulletPoints";
import { PreviewPartsSection } from "@/components/face-spoiler/PreviewPartsSection";
import { PreviewProfileCard } from "@/components/face-spoiler/PreviewProfileCard";
import { PreviewSummaryCard } from "@/components/face-spoiler/PreviewSummaryCard";
import {
  extractAnimalShortName,
  findSectionByNumber,
  parseFirstImpression,
  parseParts,
} from "@/libs/face-spoiler/preview-parser";
import { isFaceReport } from "@/libs/face-spoiler/types";
import { createAuthClient, createServerClient } from "@/libs/supabase";

import styles from "./page.module.css";

const CHARACTER_BUCKET = "face-characters";

const buildCharacterImageUrl = (path: string | null): string | null => {
  if (!path) return null;
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/${CHARACTER_BUCKET}/${path}`;
};

interface ReportPageProps {
  params: Promise<{ shareId: string }>;
}

interface FaceReportRecord {
  share_id: string;
  result: unknown;
  paid_at: string | null;
  character_image_path: string | null;
  user_id: string;
  face_profile_id: string;
}

const fetchReport = async (
  shareId: string
): Promise<FaceReportRecord | null> => {
  const adminClient = createServerClient();
  const { data, error } = await adminClient
    .from("face_reports")
    .select(
      "share_id, result, paid_at, character_image_path, user_id, face_profile_id"
    )
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
    user_id: string;
    face_profile_id: string;
  };

  return {
    share_id: row.share_id,
    result: row.result,
    paid_at: row.paid_at,
    character_image_path: row.character_image_path,
    user_id: row.user_id,
    face_profile_id: row.face_profile_id,
  };
};

const fetchFaceProfileName = async (
  faceProfileId: string
): Promise<string | null> => {
  const adminClient = createServerClient();
  const { data, error } = await adminClient
    .from("face_profiles")
    .select("name")
    .eq("id", faceProfileId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return (data as unknown as { name: string }).name;
};

export const generateMetadata = async ({
  params,
}: ReportPageProps): Promise<Metadata> => {
  const { shareId } = await params;
  const tMeta = await getTranslations("faceSpoiler.metadata");

  const title = tMeta("defaultHeadline", { default: "관상스포 — 관상 리포트" });
  const description = tMeta("defaultDescription", {
    default: "사진 한 장으로 받아본 관상 리포트.",
  });

  const reportUrl = `https://life-spoiler.com/face-spoiler/r/${shareId}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: reportUrl,
      siteName: "관상스포",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: reportUrl,
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

  // 새 흐름(v4)이 아닌 리포트는 fallback 안내 페이지 (legacy v2/v3)
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

  const report = record.result;

  const authClient = await createAuthClient();
  const {
    data: { user: authUser },
  } = await authClient.auth.getUser();
  const isOwner = Boolean(authUser && authUser.id === record.user_id);

  const profileName = await fetchFaceProfileName(record.face_profile_id);
  const characterImageUrl = buildCharacterImageUrl(record.character_image_path);

  const tPreview = await getTranslations("faceSpoiler.preview");

  const finalCharacterTitle = report.finalCharacterTitle.trim();
  const section1 = findSectionByNumber(report.sections, 1);
  const section2 = findSectionByNumber(report.sections, 2);
  const section3 = findSectionByNumber(report.sections, 3);

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

  // section 1, 2 는 preview 카드 컴포넌트로 렌더하므로 마크다운 영역에선 제외.
  // section 3 이후 (동물상/오해 포인트/재물운/연애운/...) 는 기존 스타일 유지.
  const remainingSections = report.sections.filter((s) => s.number >= 3);

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.content}>
          <PreviewProfileCard
            characterTitle={finalCharacterTitle}
            totalScore={report.totalScore}
            leadParagraph={firstImpression.lead}
            characterImageUrl={characterImageUrl ?? undefined}
            characterImageAlt={profileName ?? "캐릭터 이미지"}
            animalShortName={animalShortName}
            showShareSlot
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
              default: "한 줄 정리",
            })}
          />

          {remainingSections.length > 0 && (
            <FaceReportMarkdown sections={remainingSections} />
          )}
        </div>
      </div>
      {isOwner && profileName ? (
        <FaceReportActions
          isOwner={isOwner}
          shareId={shareId}
          profileId={record.face_profile_id}
          profileName={profileName}
          slug={shareId}
        />
      ) : (
        <GuestFaceActions
          shareId={shareId}
          profileName={profileName}
          slug={shareId}
        />
      )}
    </>
  );
}
