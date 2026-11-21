"use client";

import { forwardRef } from "react";

import type { PastLifeProfileCardResponse } from "@/libs/services/ai/types";

export interface PastLifeProfileCardProps {
  /** 전생 헤드라인 */
  headline: string;
  /** 전생 설명 */
  description: string;
  /** 전생 이미지 URL */
  imageUrl: string | null;
  /** 프로필 카드 데이터 (해시태그, 묘비명) */
  profileCard: PastLifeProfileCardResponse;
  /** 이미지 여부 */
  isImage?: boolean;
  /** 공유 버튼 표시 여부 */
  shouldShowShareButton?: boolean;
  /** 공유 버튼 클릭 핸들러 */
  onShareClick?: () => void;
}

/**
 * 전생 운세 프로필 카드 컴포넌트
 *
 * 375x667 크기로 렌더링되며, html-to-image로 이미지로 변환됩니다.
 */
export const PastLifeProfileCard = forwardRef<
  HTMLDivElement,
  PastLifeProfileCardProps
>(
  (
    {
      headline,
      description,
      imageUrl,
      profileCard,
      isImage = true,
      shouldShowShareButton = true,
      onShareClick,
    },
    ref
  ) => {
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
          justifyContent: isImage ? "center" : "flex-start",
          padding: isImage ? "40px 24px 24px" : "20px 20px 24px 20px",
          fontFamily: "Pretendard, -apple-system, sans-serif",
          position: "relative",
          gap: 12,
        }}
      >
        {/* 공유 버튼 (페이지 내 표시용) */}
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

        {/* 로고 (이미지 캡처용) */}
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

        {/* 전생 이미지 */}
        <div
          style={{
            width: isImage ? 280 : "100%",
            aspectRatio: "1 / 1",
            borderRadius: 8,
            overflow: "hidden",
            alignSelf: "center",
            flexShrink: 0,
            marginTop: isImage ? 8 : 0,
          }}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={headline}
              width={480}
              height={480}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "rgba(255, 255, 255, 0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255, 255, 255, 0.5)",
                fontSize: 13,
              }}
            />
          )}
        </div>

        {/* 헤드라인 */}
        <h2
          style={{
            color: accentColor,
            fontSize: isImage ? 20 : 22,
            fontWeight: 700,
            lineHeight: 1.3,
            textAlign: "center",
            margin: 0,
          }}
        >
          {cleanHeadline}
        </h2>

        {/* 설명 */}
        <p
          style={{
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: 14,
            fontWeight: 400,
            lineHeight: 1.5,
            textAlign: "center",
            margin: 0,
          }}
        >
          {description}
        </p>

        {/* 해시태그 */}
        {profileCard.hashtags.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              justifyContent: "center",
            }}
          >
            {profileCard.hashtags.map((tag, idx) => (
              <span
                key={idx}
                style={{
                  padding: "4px 12px",
                  background: "rgba(255, 204, 217, 0.15)",
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 500,
                  color: accentColor,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 묘비명 */}
        {profileCard.epitaph && (
          <p
            style={{
              fontSize: 14,
              fontWeight: 500,
              lineHeight: 1.6,
              color: "#ffffff",
              margin: 0,
              textAlign: "center",
              fontStyle: "italic",
              paddingTop: 12,
              borderTop: "1px solid rgba(255, 255, 255, 0.12)",
              width: "100%",
            }}
          >
            &ldquo;{profileCard.epitaph}&rdquo;
          </p>
        )}
      </div>
    );
  }
);

PastLifeProfileCard.displayName = "PastLifeProfileCard";

export default PastLifeProfileCard;
