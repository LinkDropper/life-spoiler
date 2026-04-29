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

/**
 * 잠금된 섹션 목록 — UI 일관성을 위해 하드코딩.
 *
 * LLM이 실제로 반환하는 sections[2]..[16]의 title은 모델 응답에 따라 미세하게
 * 달라질 수 있다(예: "동물상" vs "나의 동물상"). preview에서 결제 전 사용자에게
 * 노출되는 "어떤 항목을 잠금해제 받게 되는지" 안내 텍스트는 변동성이 없어야
 * 마케팅 카피로 신뢰감을 준다 — 따라서 여기서는 고정 라벨을 사용한다.
 *
 * 결제 후 결과 페이지(`/r/[shareId]`)는 LLM 원본 title을 그대로 사용한다.
 */
const LOCKED_SECTIONS: ReadonlyArray<{ number: number; title: string }> = [
  { number: 3, title: "나의 동물상" },
  { number: 4, title: "첫인상 오해 포인트" },
  { number: 5, title: "숨겨진 반전 매력" },
  { number: 6, title: "재물운" },
  { number: 7, title: "돈 쓸 때 버릇 + 텅장 위험 구간" },
  { number: 8, title: "연애운" },
  { number: 9, title: "플러팅 스타일" },
  { number: 10, title: "잘 어울리는 직업" },
  { number: 11, title: "학교/직장 생존 방식" },
  { number: 12, title: "인간관계/단톡방 포지션" },
  { number: 13, title: "화났을 때 특징" },
  { number: 14, title: "찐친만 아는 모습" },
  { number: 15, title: "이 사람 사용 설명서" },
  { number: 16, title: "부위별 점수표" },
  { number: 17, title: "종합 평가" },
];

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

  const {
    sections: allSections,
    totalScore,
    finalCharacterTitle: rawFinalTitle,
  } = record.result;
  const teaserSections = allSections.slice(0, TEASER_SECTION_COUNT);
  const finalCharacterTitle = rawFinalTitle.trim();

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.content}>
          {/* 캐릭터 이미지 placeholder — 결제 후 생성 */}
          <div
            className={styles.characterPlaceholder}
            role="img"
            aria-label="캐릭터 이미지 잠금"
          >
            <div className={styles.characterPlaceholderIcon} aria-hidden>
              🎭
            </div>
            <p className={styles.characterPlaceholderText}>
              결제하면 나만의 관상 캐릭터가 생성돼요
            </p>
          </div>

          {/* 최종 캐릭터 타이틀 + 종합 점수 hero */}
          <div className={styles.titleHero}>
            <span className={styles.heroTag}>최종 캐릭터</span>
            <h1 className={styles.heroTitle}>{finalCharacterTitle}</h1>
            <div className={styles.scoreRow}>
              <span className={styles.scoreLabel}>종합 점수</span>
              <span className={styles.scoreValue}>{totalScore}</span>
              <span className={styles.scoreUnit}>/ 100</span>
            </div>
          </div>

          {/* 노출 섹션: 종합 인상 + 부위별 특징 */}
          <FaceReportMarkdown sections={teaserSections} />

          {/* 잠금된 섹션 리스트 — 결제 후 해제. 라벨은 LOCKED_SECTIONS 고정. */}
          <div className={styles.lockedList}>
            <h2 className={styles.lockedListTitle}>
              <span className={styles.lockedListIcon} aria-hidden>
                🔒
              </span>
              결제 후 해제 ({LOCKED_SECTIONS.length}개 섹션)
            </h2>
            <ul className={styles.lockedItems}>
              {LOCKED_SECTIONS.map((item) => (
                <li key={item.number} className={styles.lockedItem}>
                  <span className={styles.lockedNumber}>
                    {String(item.number).padStart(2, "0")}
                  </span>
                  <span className={styles.lockedItemTitle}>{item.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <PreviewFooter shareId={shareId} />
    </>
  );
}
