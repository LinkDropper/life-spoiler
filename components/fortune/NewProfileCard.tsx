"use client";

import { forwardRef } from "react";
import { useLocale } from "next-intl";

import { getFirstStarImagePath } from "@/libs/utils";
import { translateMainStar } from "@/libs/zi-wei-dou-shu/i18n";
import type { Locale } from "@/i18n/config";
import type { ProfileTraitsResponse } from "@/libs/services/ai/types";

export interface NewProfileCardProps {
  /** 명궁 주성 이름 목록 (이미지 표시용) */
  mainStars: string[];
  /** 한줄 제목 */
  headline: string;
  /** 프로필 성향 데이터 */
  profileTraits: ProfileTraitsResponse;
  /** 이미지 여부 */
  isImage?: boolean;
  /** 공유 버튼 표시 여부 */
  shouldShowShareButton?: boolean;
  /** 공유 버튼 클릭 핸들러 */
  onShareClick?: () => void;
}

/**
 * 새로운 프로필 카드 컴포넌트 (v2)
 *
 * 해시태그와 4가지 양극성 스펙트럼 바를 표시합니다.
 */
export const NewProfileCard = forwardRef<HTMLDivElement, NewProfileCardProps>(
  (
    {
      mainStars,
      headline,
      profileTraits,
      onShareClick,
      isImage = true,
      shouldShowShareButton = true,
    },
    ref
  ) => {
    const locale = useLocale() as Locale;
    const starImagePath = getFirstStarImagePath(mainStars);
    const mainStarName = mainStars[0]
      ? translateMainStar(mainStars[0], locale)
      : "자미";

    const accentColor = "#FFCCD9";

    // 제목에서 이모지 제거 (이미지 렌더링 호환성)
    const cleanHeadline = headline.replace(
      /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
      ""
    );

    const getLabel = (ko: string, ja: string, en: string) =>
      locale === "ko" ? ko : locale === "ja" ? ja : en;

    const spectrumLabels = {
      activity: getLabel("활동", "活動", "Activity"),
      work: getLabel("업무", "業務", "Work"),
      economy: getLabel("경제", "経済", "Economy"),
      romance: getLabel("연애", "恋愛", "Romance"),
    };

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
          padding: isImage ? "40px 24px" : "20px 20px 24px 20px",
          fontFamily: "Pretendard, -apple-system, sans-serif",
          borderRadius: 8,
          margin: "0 auto",
          gap: 16,
          position: "relative",
        }}
      >
        {!isImage && shouldShowShareButton && (
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

        {/* 콘텐츠 영역 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            flex: 1,
          }}
        >
          {/* 상단: 주성 이미지 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              padding: "32px 0",
              flex: 1,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={starImagePath}
              alt={mainStarName}
              width={251}
              height={137}
              style={{ objectFit: "contain" }}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              gap: 20,
            }}
          >
            {/* 제목 + 해시태그 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                width: "100%",
              }}
            >
              {/* 제목 */}
              <h2
                style={{
                  color: accentColor,
                  fontSize: 24,
                  fontWeight: 700,
                  lineHeight: 1.4,
                }}
              >
                {cleanHeadline}
              </h2>

              {/* 해시태그 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {profileTraits.hashtags.map((tag, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: "rgba(255, 255, 255, 0.08)",
                      borderRadius: "4px",
                      padding: "2px 6px",
                      color: "rgba(255, 255, 255, 0.70)",
                      textAlign: "center",
                      fontFamily: "Pretendard",
                      fontSize: "14px",
                      fontWeight: 400,
                      lineHeight: "140%",
                      letterSpacing: "0",
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* 4개 스펙트럼 바 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 20,
                width: "100%",
              }}
            >
              <PolarityBar
                label={spectrumLabels.activity}
                leftLabel={profileTraits.spectrums.activity.leftLabel}
                rightLabel={profileTraits.spectrums.activity.rightLabel}
                leftPercentage={profileTraits.spectrums.activity.leftPercentage}
                accentColor={accentColor}
              />
              <PolarityBar
                label={spectrumLabels.work}
                leftLabel={profileTraits.spectrums.work.leftLabel}
                rightLabel={profileTraits.spectrums.work.rightLabel}
                leftPercentage={profileTraits.spectrums.work.leftPercentage}
                accentColor={accentColor}
              />
              <PolarityBar
                label={spectrumLabels.economy}
                leftLabel={profileTraits.spectrums.economy.leftLabel}
                rightLabel={profileTraits.spectrums.economy.rightLabel}
                leftPercentage={profileTraits.spectrums.economy.leftPercentage}
                accentColor={accentColor}
              />
              <PolarityBar
                label={spectrumLabels.romance}
                leftLabel={profileTraits.spectrums.romance.leftLabel}
                rightLabel={profileTraits.spectrums.romance.rightLabel}
                leftPercentage={profileTraits.spectrums.romance.leftPercentage}
                accentColor={accentColor}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

NewProfileCard.displayName = "NewProfileCard";

interface PolarityBarProps {
  label: string;
  leftLabel: string;
  rightLabel: string;
  leftPercentage: number;
  accentColor: string;
}

/**
 * 양극성 스펙트럼 바 컴포넌트
 */
const PolarityBar = ({
  label,
  leftLabel,
  rightLabel,
  leftPercentage,
  accentColor,
}: PolarityBarProps) => {
  const percentage = Math.min(100, Math.max(0, leftPercentage));
  const rightPercentage = 100 - percentage;
  const isLeftDominant = percentage >= 50;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
      }}
    >
      {/* 레이블 행: 왼쪽 레이블 | 카테고리 | 오른쪽 레이블 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 8,
          width: "100%",
        }}
      >
        {/* 왼쪽 레이블 */}
        <span
          style={{
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: 12,
            fontWeight: 500,
            lineHeight: 1.4,
            width: 80,
            textAlign: "left",
            flexShrink: 0,
          }}
        >
          {leftLabel}
        </span>

        {/* 카테고리 레이블 */}
        <span
          style={{
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 1.4,
            textAlign: "center",
          }}
        >
          {label}
        </span>

        {/* 오른쪽 레이블 */}
        <span
          style={{
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: 12,
            fontWeight: 500,
            lineHeight: 1.4,
            width: 80,
            textAlign: "right",
            flexShrink: 0,
          }}
        >
          {rightLabel}
        </span>
      </div>

      {/* 퍼센티지 + 바 행 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
        }}
      >
        {/* 왼쪽 퍼센티지 */}
        <span
          style={{
            color: isLeftDominant ? accentColor : "rgba(255, 255, 255, 0.5)",
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1.4,
            textAlign: "left",
            width: 40,
          }}
        >
          {percentage}%
        </span>

        {/* 프로그레스 바 */}
        <div
          style={{
            flex: 1,
            height: 20,
            background: "rgba(255, 255, 255, 0.08)",
            borderRadius: 18,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* 채워지는 바 - 왼쪽 우세일 때 왼쪽에서, 오른쪽 우세일 때 오른쪽에서 */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: isLeftDominant ? 0 : undefined,
              right: isLeftDominant ? undefined : 0,
              width: `${isLeftDominant ? percentage : rightPercentage}%`,
              height: "100%",
              background: accentColor,
              borderRadius: 18,
            }}
          />
          {/* 구분선들 (25%, 50%, 75% 위치) */}
          {[25, 50, 75].map((pos) => (
            <div
              key={pos}
              style={{
                position: "absolute",
                left: `${pos}%`,
                top: 0,
                width: 0,
                height: "100%",
                borderLeft: "1px dashed #18181B",
              }}
            />
          ))}
        </div>

        {/* 오른쪽 퍼센티지 */}
        <span
          style={{
            color: !isLeftDominant ? accentColor : "rgba(255, 255, 255, 0.5)",
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1.4,
            width: 40,
            textAlign: "right",
            flexShrink: 0,
          }}
        >
          {rightPercentage}%
        </span>
      </div>
    </div>
  );
};

export default NewProfileCard;
