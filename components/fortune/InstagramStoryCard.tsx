"use client";

import { forwardRef } from "react";

import { getFirstStarImagePath } from "@/libs/utils";

export interface InstagramStoryCardLabels {
  /** 주성 레이블 */
  mainStar: string;
  /** 카테고리 레이블 */
  categories: {
    wealth: string;
    career: string;
    relationship: string;
    health: string;
  };
}

export interface InstagramStoryCardProps {
  /** 운세 종류 */
  type: "lifetime" | "yearly";
  /** 올해 연도 (yearly인 경우) */
  year?: number;
  /** 명궁 주성 이름 목록 */
  mainStars: string[];
  /** 한줄 제목 (headline) */
  headline: string;
  /** 한줄 설명 (description) */
  description?: string;
  /** 4개 카테고리 점수 */
  scores: {
    wealth: number;
    career: number;
    relationship: number;
    health: number;
  };
  /** 번역된 레이블 */
  labels: InstagramStoryCardLabels;
}

/**
 * 인스타 스토리용 이미지 카드 컴포넌트
 *
 * 375x667 크기로 렌더링되며, html-to-image로 이미지로 변환됩니다.
 */
export const InstagramStoryCard = forwardRef<
  HTMLDivElement,
  InstagramStoryCardProps
>(({ type, mainStars, headline, description, scores, labels }, ref) => {
  const starImagePath = getFirstStarImagePath(mainStars);
  const mainStarName = mainStars[0] || "Zi Wei";

  // 운세 종류에 따른 강조 색상
  const accentColor = type === "yearly" ? "#FFCCD9" : "#B8A4FF";

  // 제목에서 이모지 제거 (이미지 렌더링 호환성)
  const cleanHeadline = headline.replace(
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
    ""
  );

  return (
    <div
      ref={ref}
      style={{
        width: 375,
        height: 667,
        background: "linear-gradient(180deg, #0C1220 0%, #2E1431 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 40,
        fontFamily: "Pretendard, -apple-system, sans-serif",
        position: "relative",
      }}
    >
      {/* 로고 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/logo.png"
        alt="인생스포"
        width={76}
        height={28}
        style={{
          position: "absolute",
          top: 14,
          left: 16,
          objectFit: "contain",
        }}
      />

      {/* 상단: 주성 이미지 + 뱃지 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          paddingTop: 24,
        }}
      >
        {/* 주성 이미지 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={starImagePath}
          alt={mainStarName}
          width={251}
          height={137}
          style={{ objectFit: "contain" }}
        />

        {/* 주성 뱃지 */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            width: 251,
          }}
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              borderRadius: 18,
              padding: "2px 16px",
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1.4,
              }}
            >
              {labels.mainStar} : {mainStarName}
            </span>
          </div>
        </div>
      </div>

      {/* 중간: 제목 + 그래프 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          width: 327,
          marginTop: 16,
        }}
      >
        {/* 한줄 제목 + 설명 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            width: "100%",
          }}
        >
          <span
            style={{
              color: accentColor,
              fontSize: 24,
              fontWeight: 700,
              lineHeight: 1.4,
            }}
          >
            {cleanHeadline}
          </span>
          {description && (
            <span
              style={{
                color: "#fff",
                fontSize: 14,
                fontWeight: 400,
                lineHeight: 1.4,
              }}
            >
              {description}
            </span>
          )}
        </div>

        {/* 4개 그래프 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <FortuneProgressBar
            label={labels.categories.wealth}
            score={scores.wealth}
            accentColor={accentColor}
          />
          <FortuneProgressBar
            label={labels.categories.career}
            score={scores.career}
            accentColor={accentColor}
          />
          <FortuneProgressBar
            label={labels.categories.relationship}
            score={scores.relationship}
            accentColor={accentColor}
          />
          <FortuneProgressBar
            label={labels.categories.health}
            score={scores.health}
            accentColor={accentColor}
          />
        </div>
      </div>

      {/* 하단 여백 */}
      <div style={{ height: 20 }} />
    </div>
  );
});

InstagramStoryCard.displayName = "InstagramStoryCard";

interface FortuneProgressBarProps {
  label: string;
  score: number;
  accentColor: string;
}

/**
 * 운세 프로그레스 바 컴포넌트
 */
const FortuneProgressBar = ({
  label,
  score,
  accentColor,
}: FortuneProgressBarProps) => {
  const percentage = Math.min(100, Math.max(0, score));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: 327,
      }}
    >
      {/* 레이블 + 퍼센트 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <span
          style={{
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 1.4,
          }}
        >
          {label}
        </span>
        <span
          style={{
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: 14,
            fontWeight: 400,
            lineHeight: 1.4,
          }}
        >
          {percentage}%
        </span>
      </div>

      {/* 프로그레스 바 */}
      <div
        style={{
          width: "100%",
          height: 24,
          background: "rgba(255, 255, 255, 0.08)",
          borderRadius: 18,
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* 채워진 부분 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: `${percentage}%`,
            height: 24,
            background: accentColor,
            borderRadius: 18,
          }}
        />

        {/* 구분선 (20%, 40%, 60%, 80%) */}
        {[20, 40, 60, 80].map((pos) => (
          <div
            key={pos}
            style={{
              position: "absolute",
              left: `${pos}%`,
              top: 0,
              width: 0,
              height: 24,
              borderLeft: "1px dashed #18181B",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default InstagramStoryCard;
