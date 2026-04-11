"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Share } from "lucide-react";
import { useTranslations } from "next-intl";

import { ShareDrawer } from "@/components/fortune/ShareDrawer";
import { useImageDownload } from "@/libs/hooks/useImageDownload";
import { shareFaceSpoilerImage } from "@/libs/kakao";

import {
  FACE_SPOILER_DOWNLOAD_SLOT_ID,
  FACE_SPOILER_HERO_CAPTURE_ID,
} from "./face-report-actions-constants";
import { FaceReviewDrawer } from "./FaceReviewDrawer";

import styles from "./FaceReportActions.module.css";

const captureFilter = (node: HTMLElement): boolean =>
  node.dataset?.captureExclude !== "true";

interface FaceReportActionsProps {
  isOwner: boolean;
  shareId: string;
  profileId: string;
  profileName: string;
  animalKey: string;
}

const TOAST_DURATION_MS = 2500;

export const FaceReportActions = ({
  isOwner,
  shareId,
  profileId,
  profileName,
  animalKey,
}: FaceReportActionsProps) => {
  const t = useTranslations("faceSpoiler.share");

  const [isShareDrawerOpen, setIsShareDrawerOpen] = useState(false);
  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [downloadSlotNode, setDownloadSlotNode] = useState<HTMLElement | null>(
    null
  );
  const toastTimerRef = useRef<number | null>(null);

  const {
    ref: captureRef,
    download,
    toBlob,
    isDownloading,
  } = useImageDownload({
    filename: `face_spoiler_${animalKey}`,
    pixelRatio: 2,
    filter: captureFilter,
    cacheBust: false,
    backgroundColor: "#0b0b0f",
  });

  useEffect(() => {
    if (!isOwner) {
      return;
    }
    const slotNode = document.getElementById(FACE_SPOILER_DOWNLOAD_SLOT_ID);
    setDownloadSlotNode(slotNode);
    const heroNode = document.getElementById(
      FACE_SPOILER_HERO_CAPTURE_ID
    ) as HTMLDivElement | null;
    captureRef.current = heroNode;
  }, [isOwner, captureRef]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, TOAST_DURATION_MS);
  }, []);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/face-spoiler/r/${shareId}`
      : `/face-spoiler/r/${shareId}`;

  const handleOpenShareDrawer = () => {
    setIsShareDrawerOpen(true);
  };

  const handleCloseShareDrawer = () => {
    setIsShareDrawerOpen(false);
  };

  const handleOpenReviewDrawer = () => {
    setIsReviewDrawerOpen(true);
  };

  const handleCloseReviewDrawer = () => {
    setIsReviewDrawerOpen(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast(t("copied"));
    } catch (error) {
      console.error("Failed to copy share link:", error);
      showToast(t("copyFailed"));
    }
  };

  const handleDownloadImage = async () => {
    try {
      await download();
    } catch (error) {
      console.error("Failed to download face spoiler image:", error);
      showToast(t("captureFailed"));
    }
  };

  const handleShareKakao = async () => {
    try {
      const blob = await toBlob();
      if (!blob) {
        showToast(t("captureFailed"));
        return;
      }

      const success = await shareFaceSpoilerImage({
        imageBlob: blob,
        name: profileName,
        webDomain: `${window.location.origin}/face-spoiler/r/${shareId}`,
      });

      if (!success) {
        showToast(t("kakaoShareFailed"));
        return;
      }

      handleCloseShareDrawer();
    } catch (error) {
      console.error("Failed to share face spoiler to Kakao:", error);
      showToast(t("kakaoShareFailed"));
    }
  };

  if (!isOwner) {
    return null;
  }

  const downloadButton = (
    <button
      type="button"
      className={styles.downloadButton}
      onClick={handleDownloadImage}
      disabled={isDownloading}
      aria-label={t("downloadButtonAria")}
    >
      <Share size={24} strokeWidth={2} />
    </button>
  );

  return (
    <>
      {downloadSlotNode ? createPortal(downloadButton, downloadSlotNode) : null}

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.reviewButton}
          onClick={handleOpenReviewDrawer}
        >
          {t("footerReviewButton")}
        </button>
        <button
          type="button"
          className={styles.shareButton}
          onClick={handleOpenShareDrawer}
        >
          {t("footerShareButton")}
        </button>
      </footer>

      <ShareDrawer
        isOpen={isShareDrawerOpen}
        onClose={handleCloseShareDrawer}
        title={t("drawerTitle")}
        onCopyLink={handleCopyLink}
        onShareKakao={handleShareKakao}
        onDownloadImage={handleDownloadImage}
        showLine={false}
        isDownloading={isDownloading}
      />

      <FaceReviewDrawer
        isOpen={isReviewDrawerOpen}
        onClose={handleCloseReviewDrawer}
        faceProfileId={profileId}
      />

      {toastMessage ? <div className={styles.toast}>{toastMessage}</div> : null}
    </>
  );
};
