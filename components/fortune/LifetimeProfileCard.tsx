"use client";

import { forwardRef } from "react";
import { useLocale } from "next-intl";
import type { Locale } from "@/i18n/config";
import { translateMainStar } from "@/libs/zi-wei-dou-shu/i18n";
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

export interface LifetimeProfileCardProps {
  /** 명궁 주성 이름 목록 */
  mainStars: string[];
  /** 한줄 제목 (headline) */
  headline: string;
  /** 설명 */
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
  /** 이미지 여부 */
  isImage?: boolean;
  /** 공유 버튼 클릭 핸들러 (isImage=false일 때만 표시) */
  onShareClick?: () => void;
}

/**
 * 인스타 스토리용 이미지 카드 컴포넌트
 *
 * 375x667 크기로 렌더링되며, html-to-image로 이미지로 변환됩니다.
 */
export const LifetimeProfileCard = forwardRef<
  HTMLDivElement,
  LifetimeProfileCardProps
>(
  (
    {
      headline,
      mainStars,
      description,
      scores,
      labels,
      isImage = true,
      onShareClick,
    },
    ref
  ) => {
    const locale = useLocale() as Locale;
    const starImagePath = getFirstStarImagePath(mainStars);
    // 원본 이름(한국어)을 현재 로케일로 번역하여 표시
    const mainStarName = mainStars[0]
      ? translateMainStar(mainStars[0], locale)
      : "자미";

    const accentColor = "#FFCCD9";

    // 제목에서 이모지 제거 (이미지 렌더링 호환성)
    const cleanHeadline = headline.replace(
      /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
      ""
    );

    return (
      <div
        ref={ref}
        style={{
          ...(isImage
            ? {
                width: 375,
                height: 667,
              }
            : {
                width: "100%",
                height: "auto",
                borderRadius: 8,
                border: "2px solid rgba(255, 255, 255, 0.16)",
              }),
          background: isImage
            ? "linear-gradient(180deg, #0C1220 0%, #2E1431 100%)"
            : "transparent",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: isImage ? 40 : "20px 20px 24px 20px",
          fontFamily: "Pretendard, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {!isImage && (
          <button
            type="button"
            onClick={onShareClick}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
            aria-label="프로필 이미지 공유하기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M11.4697 2.46967C11.7626 2.17678 12.2374 2.17678 12.5303 2.46967L15.5303 5.46967C15.8232 5.76256 15.8232 6.23744 15.5303 6.53033C15.2374 6.82322 14.7626 6.82322 14.4697 6.53033L12.75 4.81066V14C12.75 14.4142 12.4142 14.75 12 14.75C11.5858 14.75 11.25 14.4142 11.25 14V4.81066L9.53033 6.53033C9.23744 6.82322 8.76256 6.82322 8.46967 6.53033C8.17678 6.23744 8.17678 5.76256 8.46967 5.46967L11.4697 2.46967ZM5.05546 9.05546C5.57118 8.53973 6.27065 8.25 7 8.25H8C8.41421 8.25 8.75 8.58579 8.75 9C8.75 9.41421 8.41421 9.75 8 9.75H7C6.66848 9.75 6.35054 9.8817 6.11612 10.1161C5.8817 10.3505 5.75 10.6685 5.75 11V19C5.75 19.3315 5.8817 19.6495 6.11612 19.8839C6.35054 20.1183 6.66848 20.25 7 20.25H17C17.3315 20.25 17.6495 20.1183 17.8839 19.8839C18.1183 19.6495 18.25 19.3315 18.25 19V11C18.25 10.6685 18.1183 10.3505 17.8839 10.1161C17.6495 9.8817 17.3315 9.75 17 9.75H16C15.5858 9.75 15.25 9.41421 15.25 9C15.25 8.58579 15.5858 8.25 16 8.25H17C17.7293 8.25 18.4288 8.53973 18.9445 9.05546C19.4603 9.57118 19.75 10.2707 19.75 11V19C19.75 19.7293 19.4603 20.4288 18.9445 20.9445C18.4288 21.4603 17.7293 21.75 17 21.75H7C6.27065 21.75 5.57118 21.4603 5.05546 20.9445C4.53973 20.4288 4.25 19.7293 4.25 19V11C4.25 10.2707 4.53973 9.57118 5.05546 9.05546Z"
                fill="white"
                fillOpacity="0.7"
              />
            </svg>
          </button>
        )}
        {/* 로고 - html-to-image 라이브러리 호환성을 위해 img 태그 사용 */}
        {isImage && (
          // eslint-disable-next-line @next/next/no-img-element
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
        )}

        {/* 상단: 주성 이미지 + 뱃지 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            paddingTop: 24,
            flex: 1,
          }}
        >
          {/* 카테고리 이미지 - html-to-image 라이브러리 호환성을 위해 img 태그 사용 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={starImagePath}
            alt={mainStarName}
            width={251}
            height={137}
            style={{ objectFit: "contain" }}
          />
        </div>

        {/* 중간: 제목 + 그래프 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            width: isImage ? 327 : "100%",
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
            <span
              style={{
                color: "rgba(255, 255, 255, 0.70)",
                fontFamily: "Pretendard",
                fontSize: "16px",
                fontWeight: 500,
                lineHeight: "140%",
              }}
            >
              {description}
            </span>
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
              isImage={isImage}
            />
            <FortuneProgressBar
              label={labels.categories.career}
              score={scores.career}
              accentColor={accentColor}
              isImage={isImage}
            />
            <FortuneProgressBar
              label={labels.categories.relationship}
              score={scores.relationship}
              accentColor={accentColor}
              isImage={isImage}
            />
            <FortuneProgressBar
              label={labels.categories.health}
              score={scores.health}
              accentColor={accentColor}
              isImage={isImage}
            />
          </div>
        </div>
      </div>
    );
  }
);

LifetimeProfileCard.displayName = "LifetimeProfileCard";

interface FortuneProgressBarProps {
  label: string;
  score: number;
  accentColor: string;
  isImage: boolean;
}

/**
 * 운세 프로그레스 바 컴포넌트
 */
const FortuneProgressBar = ({
  label,
  score,
  accentColor,
  isImage,
}: FortuneProgressBarProps) => {
  const percentage = Math.min(100, Math.max(0, score));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: isImage ? 327 : "100%",
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

        {/* 구분선 (25%, 50%, 75%, 100%) */}
        {[25, 50, 75].map((pos) => (
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

export default LifetimeProfileCard;
