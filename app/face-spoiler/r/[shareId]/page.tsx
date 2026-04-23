import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { env } from "@/env";
import { AnimalHero } from "@/components/face-spoiler/AnimalHero";
import { FaceReportActions } from "@/components/face-spoiler/FaceReportActions";
import { GuestFaceActions } from "@/components/face-spoiler/GuestFaceActions";
import { Header } from "@/components/face-spoiler/Header";
import { ReportViewV3 } from "@/components/face-spoiler/ReportViewV3";
import { isV3Report } from "@/libs/face-spoiler/types.v3";
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

  const reportUrl = `https://life-spoiler.com/face-spoiler/r/${shareId}`;

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      type: "article",
      url: reportUrl,
      siteName: "관상스포",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
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

  // 하드 컷오버: v3가 아닌 리포트는 fallback 안내 페이지
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

  const authClient = await createAuthClient();
  const {
    data: { user: authUser },
  } = await authClient.auth.getUser();
  const isOwner = Boolean(authUser && authUser.id === record.user_id);

  const profileName = await fetchFaceProfileName(record.face_profile_id);
  const characterImageUrl = buildCharacterImageUrl(record.character_image_path);

  // v3 리포트에서 AnimalHero 입력값 조립.
  // v2 AnimalMatch 구조에 맞춰 보조 필드를 채워준다 (matchedRegions는
  // v3 스키마에 없으므로 coreKeywords에서 유도).
  //
  // Phase 20.1 (2026-04-23): `rationale`을 `subDefinition`으로 채우던 로직 제거.
  // 같은 subDefinition이 SignatureHero의 subDef로도, AnimalHero의 rationale로도
  // 출력되어 히어로 영역에 동일 문단이 두 번 노출되는 버그 발생.
  // rationale은 AnimalHero에서 falsy일 때 렌더 skip하도록 처리됨.
  const heroAnimalMatch = {
    primary: report.signature.animalChip.type,
    confidence: "high" as const,
    matchedRegions: report.signature.coreKeywords.slice(0, 4),
    rationale: "",
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <AnimalHero
          animalMatch={heroAnimalMatch}
          characterImageUrl={characterImageUrl}
          showFullContext
          showDownloadSlot={isOwner}
        />
        <div className={styles.content}>
          <ReportViewV3 report={report} />
        </div>
      </div>
      {isOwner && profileName ? (
        <FaceReportActions
          isOwner={isOwner}
          shareId={shareId}
          profileId={record.face_profile_id}
          profileName={profileName}
          animalKey={report.signature.animalChip.type}
        />
      ) : (
        <GuestFaceActions
          shareId={shareId}
          profileName={profileName}
          animalKey={report.signature.animalChip.type}
        />
      )}
    </>
  );
}
