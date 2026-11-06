"use client";

import { Download, Link2, Share } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";

import { trackEvent } from "@/libs/analytics";
import { canUseSystemShare } from "@/libs/share/system-share";

import { Sheet, SheetAction } from "@/components/common/sheet";
import styles from "./FortuneShareSheet.module.css";

interface SharePreview {
  /** 작게 줄인 포스터·카드 */
  art: ReactNode;
  /** CHARACTER POSTER · 9:16 */
  label: string;
  title: string;
  desc?: string;
}

interface FortuneShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** SHARE(본편 링크) · POSTER(포스터 이미지) */
  eyebrow: string;
  title: string;
  /** 무엇을 보내는지 미리보기 (포스터 공유) */
  preview?: SharePreview;
  /** 친구 초대 관람권 안내 (본편 링크 공유) */
  showInvite?: boolean;
  /** 첫 줄로 권할 행동: 링크는 카카오톡, 포스터는 기기 공유(인스타그램 스토리) */
  primary?: "kakao" | "system";
  onShareKakao: () => void;
  /** 기기 공유 시트. 브라우저가 지원할 때만 줄이 보인다 */
  onShareSystem?: () => void;
  onCopyLink?: () => void;
  onDownloadImage?: () => void;
  downloadLabel?: string;
  isBusy?: boolean;
}

/** 운세 공유 시트: 본편 링크 · 캐릭터 포스터 · 오늘 운세 카드가 함께 쓴다 */
export const FortuneShareSheet = ({
  isOpen,
  onClose,
  eyebrow,
  title,
  preview,
  showInvite = false,
  primary = "kakao",
  onShareKakao,
  onShareSystem,
  onCopyLink,
  onDownloadImage,
  downloadLabel,
  isBusy = false,
}: FortuneShareSheetProps) => {
  const t = useTranslations("fortune.screen.shareSheet");
  const [hasSystemShare, setHasSystemShare] = useState(false);

  // navigator는 브라우저에서만 있어 첫 렌더 뒤에 확인한다(서버 화면과 어긋나지 않게)
  useEffect(() => {
    setHasSystemShare(canUseSystemShare());
  }, []);

  const handleKakao = () => {
    trackEvent("share_kakao");
    onShareKakao();
  };
  const handleSystem = () => {
    trackEvent("share_system");
    onShareSystem?.();
  };
  const handleCopy = () => {
    trackEvent("share_copy_link");
    onCopyLink?.();
    onClose();
  };
  const handleDownload = () => {
    trackEvent("share_download_image");
    onDownloadImage?.();
  };

  const kakaoAction = (
    <SheetAction
      key="kakao"
      icon={
        <Image
          src="/images/share/kakao-logo.png"
          alt=""
          width={22}
          height={22}
          loading="eager"
          className={styles.kakao}
        />
      }
      label={t("kakao")}
      isPrimary={primary === "kakao"}
      disabled={isBusy}
      onClick={handleKakao}
    />
  );
  const systemAction =
    onShareSystem && hasSystemShare ? (
      <SheetAction
        key="system"
        icon={<Share size={22} />}
        label={preview ? t("systemPoster") : t("system")}
        sub={preview ? t("systemPosterSub") : t("systemSub")}
        isPrimary={primary === "system"}
        disabled={isBusy}
        onClick={handleSystem}
      />
    ) : null;
  const actions =
    primary === "system"
      ? [systemAction, kakaoAction]
      : [kakaoAction, systemAction];

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      eyebrow={eyebrow}
      title={title}
      isBusy={isBusy}
    >
      <div className={styles.content}>
        {showInvite && (
          <div className={styles.invite}>
            <span className={styles.inviteStub} aria-hidden="true">
              INVITE
            </span>
            <span className={styles.inviteText}>
              <b>{t("inviteTitle")}</b>
              <span>{t("inviteBody")}</span>
            </span>
          </div>
        )}

        {preview && (
          <div className={styles.preview}>
            <div className={styles.previewArt} aria-hidden="true">
              {preview.art}
            </div>
            <span className={styles.previewText}>
              <span className={styles.previewLabel}>{preview.label}</span>
              <b>{preview.title}</b>
              {preview.desc && <span>{preview.desc}</span>}
            </span>
          </div>
        )}

        {actions}

        {onCopyLink && (
          <SheetAction
            icon={<Link2 size={22} />}
            label={t("copyLink")}
            disabled={isBusy}
            onClick={handleCopy}
          />
        )}
        {onDownloadImage && (
          <SheetAction
            icon={<Download size={22} />}
            label={isBusy ? t("saving") : (downloadLabel ?? t("saveImage"))}
            disabled={isBusy}
            onClick={handleDownload}
          />
        )}
      </div>
    </Sheet>
  );
};
