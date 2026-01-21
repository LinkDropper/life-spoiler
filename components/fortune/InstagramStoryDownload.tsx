"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useImageDownload } from "@/libs/hooks/useImageDownload";

import { InstagramStoryCard } from "./InstagramStoryCard";
import type { InstagramStoryCardLabels } from "./InstagramStoryCard";

export interface InstagramStoryDownloadProps {
  /** 운세 종류 */
  type: "lifetime" | "yearly";
  /** 올해 연도 (yearly인 경우) */
  year?: number;
  /** 명궁 주성 이름 목록 */
  mainStars: string[];
  /** 한줄 제목 (headline) */
  headline: string;
  /** 4개 카테고리 점수 */
  scores: {
    wealth: number;
    career: number;
    relationship: number;
    health: number;
  };
}

/**
 * 인스타 스토리 다운로드 섹션 컴포넌트
 *
 * 버튼 클릭 시 카드를 렌더링하고 이미지로 다운로드합니다.
 */
export const InstagramStoryDownload = ({
  type,
  year,
  mainStars,
  headline,
  scores,
}: InstagramStoryDownloadProps) => {
  const t = useTranslations("fortune.instagramStory");
  const [showPreview, setShowPreview] = useState(false);

  const filename =
    type === "yearly"
      ? `life_spoiler_${year}_fortune`
      : "life_spoiler_lifetime";

  // 번역된 레이블
  const labels: InstagramStoryCardLabels = {
    mainStar: t("mainStar"),
    categories: {
      wealth: t("categories.wealth"),
      career: t("categories.career"),
      relationship: t("categories.relationship"),
      health: t("categories.health"),
    },
  };

  const { ref, download, isDownloading, error } = useImageDownload({
    filename,
    pixelRatio: 2,
  });

  // 점수가 모두 0이면 다운로드 불가
  const hasScores =
    scores.wealth > 0 ||
    scores.career > 0 ||
    scores.relationship > 0 ||
    scores.health > 0;

  const handleDownload = async () => {
    setShowPreview(true);
    // 다음 프레임에서 이미지 렌더링이 완료된 후 다운로드
    await new Promise((resolve) => setTimeout(resolve, 100));
    await download();
    // 다운로드 완료 후 프리뷰 숨김
    setTimeout(() => setShowPreview(false), 500);
  };

  if (!hasScores) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 다운로드 버튼 */}
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isDownloading ? (
          <>
            <LoadingSpinner />
            {t("downloading")}
          </>
        ) : (
          <>
            <InstagramIcon />
            {t("downloadButton")}
          </>
        )}
      </button>

      {/* 에러 메시지 */}
      {error && <p className="text-center text-sm text-red-500">{error}</p>}

      {/* 이미지 생성용 숨겨진 카드 */}
      {showPreview && (
        <div
          style={{
            position: "fixed",
            left: -9999,
            top: 0,
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          <InstagramStoryCard
            ref={ref}
            type={type}
            year={year}
            mainStars={mainStars}
            headline={headline}
            scores={scores}
            labels={labels}
          />
        </div>
      )}
    </div>
  );
};

const LoadingSpinner = () => (
  <svg
    className="h-5 w-5 animate-spin"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const InstagramIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="2"
      y="2"
      width="20"
      height="20"
      rx="5"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
    <circle cx="18" cy="6" r="1.5" fill="currentColor" />
  </svg>
);

export default InstagramStoryDownload;
