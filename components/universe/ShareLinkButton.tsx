"use client";

import { useTranslations } from "next-intl";

import styles from "./ShareLinkButton.module.css";

import type { CopyState } from "@/libs/hooks/universe";

interface ShareLinkButtonProps {
  shareUrl: string;
  /** 친구 유입 유도 캡션 문구 선택용 (0명이면 빈 상태 안내로 전환) */
  guestCount: number;
  /** 복사 결과 상태 — `useShareUniverseLink`를 페이지가 소유하고 내려준다 */
  copyState: CopyState;
  onShare: () => void;
}

/**
 * 6번 영역 — 공유 링크 복사.
 *
 * 실제 공유/복사 로직은 `useShareUniverseLink`가 페이지 레벨에서 관리한다
 * (4번 영역의 빈 상태 버튼과 결과를 공유해야 하기 때문). 이 컴포넌트는
 * 트리거와 fallback(클립보드 실패 시 수동 복사 안내) 표시만 담당한다.
 */
export const ShareLinkButton = ({
  shareUrl,
  guestCount,
  copyState,
  onShare,
}: ShareLinkButtonProps) => {
  const t = useTranslations("universe.detail");

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

      <button type="button" className={styles.button} onClick={onShare}>
        {t("shareButton")}
      </button>

      {copyState === "fallback" && (
        <p className={styles.status} role="status">
          {t("shareFallback")}
        </p>
      )}

      {copyState === "fallback" && <p className={styles.rawUrl}>{shareUrl}</p>}
    </section>
  );
};
