"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import styles from "./ReportShareButtons.module.css";

interface ReportShareButtonsProps {
  shareId: string;
  shareLine: string;
}

// Kakao SDK의 sendDefault 호출 시그니처 (libs/kakao 글로벌 타입에는
// sendCustom만 정의되어 있어 type assertion으로 접근)
interface KakaoShareSendDefault {
  sendDefault: (options: {
    objectType: string;
    content: {
      title: string;
      description: string;
      imageUrl: string;
      link: {
        mobileWebUrl: string;
        webUrl: string;
      };
    };
    buttons: Array<{
      title: string;
      link: { mobileWebUrl: string; webUrl: string };
    }>;
  }) => void;
}

export const ReportShareButtons = ({
  shareId,
  shareLine,
}: ReportShareButtonsProps) => {
  const t = useTranslations("faceSpoiler.report.share");
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/face-spoiler/r/${shareId}`;
  };

  const handleCopyLink = async () => {
    const shareUrl = getShareUrl();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error("Failed to copy:", error);
      alert(t("copyFailed", { default: "링크 복사에 실패했습니다." }));
    }
  };

  const handleKakaoShare = () => {
    const shareUrl = getShareUrl();
    if (
      typeof window !== "undefined" &&
      window.Kakao &&
      window.Kakao.isInitialized?.()
    ) {
      try {
        const kakaoShare = window.Kakao
          .Share as unknown as KakaoShareSendDefault;
        kakaoShare.sendDefault({
          objectType: "feed",
          content: {
            title: t("kakaoCardTitle", { default: "관상스포" }),
            description: shareLine,
            imageUrl: `${window.location.origin}/face-spoiler/hero-image.png`,
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl,
            },
          },
          buttons: [
            {
              title: t("kakaoButtonTitle", { default: "결과 보기" }),
              link: {
                mobileWebUrl: shareUrl,
                webUrl: shareUrl,
              },
            },
          ],
        });
        return;
      } catch (error) {
        console.error("Kakao share failed:", error);
      }
    }
    handleCopyLink();
  };

  const handleXShare = () => {
    const shareUrl = getShareUrl();
    const brand = t("kakaoCardTitle", { default: "관상스포" });
    const text = `${brand} — ${shareLine}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={styles.shareContainer}>
      <h3 className={styles.shareTitle}>
        {t("title", { default: "결과 공유하기" })}
      </h3>
      <div className={styles.shareButtons}>
        <button
          type="button"
          className={styles.shareButton}
          onClick={handleCopyLink}
        >
          {copied
            ? t("copied", { default: "복사 완료!" })
            : t("copy", { default: "링크 복사" })}
        </button>
        <button
          type="button"
          className={styles.shareButton}
          onClick={handleKakaoShare}
        >
          {t("kakao", { default: "카카오톡" })}
        </button>
        <button
          type="button"
          className={styles.shareButton}
          onClick={handleXShare}
        >
          {t("x", { default: "X 공유" })}
        </button>
      </div>
    </div>
  );
};
