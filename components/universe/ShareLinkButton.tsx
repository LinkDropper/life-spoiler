"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import styles from "./ShareLinkButton.module.css";

interface ShareLinkButtonProps {
  shareUrl: string;
  /** 친구 유입 유도 캡션 문구 선택용 (0명이면 빈 상태 안내로 전환) */
  guestCount: number;
}

type CopyState = "idle" | "copied" | "fallback";

/**
 * 6번 영역 — 공유 링크 복사.
 *
 * Web Share API를 먼저 시도하고(모바일 네이티브 시트), 없으면 클립보드,
 * 그것도 막히면 링크를 그대로 노출해 수동 복사할 수 있게 한다.
 * 세 경로 모두 실패하면 사용자가 링크를 얻을 방법이 사라지므로 폴백을 끝까지 둔다.
 */
export const ShareLinkButton = ({
  shareUrl,
  guestCount,
}: ShareLinkButtonProps) => {
  const t = useTranslations("universe.detail");
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text: t("shareText"), url: shareUrl });
        return;
      } catch {
        // 사용자가 공유 시트를 닫은 경우도 여기로 오므로 클립보드로 이어서 시도한다
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState("copied");
    } catch {
      setCopyState("fallback");
    }
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{t("shareTitle")}</h2>

      {/*
        친구 유입 유도 문구 — 원래 섹션1(owner 요약)에 있었으나, "행동할 수단이 있는 자리에
        유도 카피를 둔다"는 원칙에 따라 공유 버튼 옆인 여기로 이관했다 (CTO/CPO 확정).
      */}
      <p className={styles.inviteCaption}>
        {guestCount === 0
          ? t("ownerEmptyOneLiner")
          : t("ownerOneLiner", { count: guestCount })}
      </p>

      <button type="button" className={styles.button} onClick={handleShare}>
        {t("shareButton")}
      </button>

      <p className={styles.status} role="status">
        {copyState === "copied" && t("shareCopied")}
        {copyState === "fallback" && t("shareFallback")}
      </p>

      {copyState === "fallback" && <p className={styles.rawUrl}>{shareUrl}</p>}
    </section>
  );
};
