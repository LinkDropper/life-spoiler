"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { ShareDrawer } from "@/components/fortune/ShareDrawer";
import { useImageDownload } from "@/libs/hooks/useImageDownload";
import { shareFaceSpoilerImage } from "@/libs/kakao";

import { FACE_SPOILER_HERO_CAPTURE_ID } from "./face-report-actions-constants";

import styles from "./GuestFaceActions.module.css";

const captureFilter = (node: HTMLElement): boolean =>
  node.dataset?.captureExclude !== "true";

interface GuestFaceActionsProps {
  shareId: string;
  profileName: string | null;
  animalKey: string;
}

const TOAST_DURATION_MS = 2500;

export const GuestFaceActions = ({
  shareId,
  profileName,
  animalKey,
}: GuestFaceActionsProps) => {
  const t = useTranslations("faceSpoiler.share");

  const [isShareDrawerOpen, setIsShareDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const {
    ref: captureRef,
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
    const heroNode = document.getElementById(
      FACE_SPOILER_HERO_CAPTURE_ID
    ) as HTMLDivElement | null;
    captureRef.current = heroNode;
  }, [captureRef]);

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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast(t("copied"));
    } catch {
      showToast(t("copyFailed"));
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
        name: profileName ?? "",
        webDomain: `${window.location.origin}/face-spoiler/r/${shareId}`,
      });

      if (!success) {
        showToast(t("kakaoShareFailed"));
        return;
      }

      handleCloseShareDrawer();
    } catch {
      showToast(t("kakaoShareFailed"));
    }
  };

  return (
    <>
      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.shareButton}
          onClick={handleOpenShareDrawer}
        >
          {t("footerShareButton")}
        </button>
        <Link href="/face-spoiler" className={styles.ctaButton}>
          {t("guestFooterCtaButton")}
        </Link>
      </footer>

      <ShareDrawer
        isOpen={isShareDrawerOpen}
        onClose={handleCloseShareDrawer}
        title={t("drawerTitle")}
        onCopyLink={handleCopyLink}
        onShareKakao={handleShareKakao}
        showLine={false}
        showDownloadImage={false}
        isDownloading={isDownloading}
      />

      {toastMessage ? <div className={styles.toast}>{toastMessage}</div> : null}
    </>
  );
};
