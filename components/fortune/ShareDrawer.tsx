"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { trackEvent } from "@/libs/analytics";

import styles from "./ShareDrawer.module.css";

interface ShareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCopyLink: () => void;
  onShareKakao?: () => void;
  onShareLine?: () => void;
  onDownloadImage: () => void;
  isDownloading?: boolean;
}

/**
 * 공유하기 드로어 컴포넌트
 *
 * 하단에서 올라오는 바텀시트 형태의 드로어
 */
export const ShareDrawer = ({
  isOpen,
  onClose,
  onCopyLink,
  onShareKakao,
  onShareLine,
  onDownloadImage,
  isDownloading = false,
}: ShareDrawerProps) => {
  const t = useTranslations("fortune.shareDrawer");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDownloading) {
      onClose();
    }
  };

  const handleCopyLink = () => {
    trackEvent("share_copy_link");
    onCopyLink();
    onClose();
  };

  const handleShareKakao = () => {
    trackEvent("share_kakao");
    onShareKakao?.();
  };

  const handleShareLine = () => {
    trackEvent("share_line");
    onShareLine?.();
  };

  const handleDownloadImage = () => {
    trackEvent("share_download_image");
    onDownloadImage();
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.drawer}>
        <div className={styles.header}>
          <span className={styles.title}>
            {t("title", { default: "공유하기" })}
          </span>
        </div>

        <div className={styles.separator}>
          <hr className={styles.separatorLine} />
        </div>

        <div className={styles.menuItems}>
          <button
            type="button"
            className={styles.menuItem}
            onClick={handleCopyLink}
            disabled={isDownloading}
          >
            <CopyIcon />
            <span>{t("copyLink", { default: "링크 복사하기" })}</span>
          </button>

          <button
            type="button"
            className={styles.menuItem}
            onClick={handleShareKakao}
            disabled={isDownloading}
          >
            <Image
              src="/images/share/kakao-logo.png"
              alt="KakaoTalk"
              width={18}
              height={18}
              className={styles.menuIcon}
            />
            <span>{t("shareKakao", { default: "카카오톡 공유하기" })}</span>
          </button>

          <button
            type="button"
            className={styles.menuItem}
            onClick={handleShareLine}
            disabled={isDownloading}
          >
            <Image
              src="/images/share/line-logo.png"
              alt="LINE"
              width={18}
              height={18}
              className={styles.menuIcon}
            />
            <span>{t("shareLine", { default: "라인 공유하기" })}</span>
          </button>

          <button
            type="button"
            className={styles.menuItem}
            onClick={handleDownloadImage}
            disabled={isDownloading}
          >
            <PhotoIcon />
            <span>
              {isDownloading
                ? t("downloading", { default: "다운로드 중..." })
                : t("downloadImage", { default: "프로필 이미지 다운로드" })}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

const CopyIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15 6.75H8.25C7.42157 6.75 6.75 7.42157 6.75 8.25V15C6.75 15.8284 7.42157 16.5 8.25 16.5H15C15.8284 16.5 16.5 15.8284 16.5 15V8.25C16.5 7.42157 15.8284 6.75 15 6.75Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.75 11.25H3C2.60218 11.25 2.22064 11.092 1.93934 10.8107C1.65804 10.5294 1.5 10.1478 1.5 9.75V3C1.5 2.60218 1.65804 2.22064 1.93934 1.93934C2.22064 1.65804 2.60218 1.5 3 1.5H9.75C10.1478 1.5 10.5294 1.65804 10.8107 1.93934C11.092 2.22064 11.25 2.60218 11.25 3V3.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PhotoIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14.25 2.25H3.75C2.92157 2.25 2.25 2.92157 2.25 3.75V14.25C2.25 15.0784 2.92157 15.75 3.75 15.75H14.25C15.0784 15.75 15.75 15.0784 15.75 14.25V3.75C15.75 2.92157 15.0784 2.25 14.25 2.25Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.375 7.5C6.99632 7.5 7.5 6.99632 7.5 6.375C7.5 5.75368 6.99632 5.25 6.375 5.25C5.75368 5.25 5.25 5.75368 5.25 6.375C5.25 6.99632 5.75368 7.5 6.375 7.5Z"
      fill="currentColor"
    />
    <path
      d="M15.75 11.25L12 7.5L3.75 15.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ShareDrawer;
