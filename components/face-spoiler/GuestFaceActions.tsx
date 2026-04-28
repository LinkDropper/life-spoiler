"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { ShareDrawer } from "@/components/fortune/ShareDrawer";
import { useImageDownload } from "@/libs/hooks/useImageDownload";
import { shareFaceSpoilerImage } from "@/libs/kakao";
import { createBrowserClient } from "@/libs/supabase/browser";

import { FACE_SPOILER_HERO_CAPTURE_ID } from "./face-report-actions-constants";

import styles from "./GuestFaceActions.module.css";

const captureFilter = (node: HTMLElement): boolean =>
  node.dataset?.captureExclude !== "true";

interface GuestFaceActionsProps {
  shareId: string;
  profileName: string | null;
  slug: string;
}

const TOAST_DURATION_MS = 2500;

export const GuestFaceActions = ({
  shareId,
  profileName,
  slug,
}: GuestFaceActionsProps) => {
  const t = useTranslations("faceSpoiler.share");
  const router = useRouter();

  const [isShareDrawerOpen, setIsShareDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const {
    ref: captureRef,
    toBlob,
    isDownloading,
  } = useImageDownload({
    filename: `face_spoiler_${slug}`,
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

  const handleCtaClick = async () => {
    const supabase = createBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/face-spoiler/login");
      return;
    }

    router.push("/face-spoiler/profiles");
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
        <button
          type="button"
          className={styles.ctaButton}
          onClick={handleCtaClick}
        >
          {t("guestFooterCtaButton")}
        </button>
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
