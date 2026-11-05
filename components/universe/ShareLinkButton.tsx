"use client";

import { useTranslations } from "next-intl";

import { ScreeningTicket } from "./ScreeningTicket";
import styles from "./ShareLinkButton.module.css";

import type { CopyState } from "@/libs/hooks/universe";

interface ShareLinkButtonProps {
  shareUrl: string;
  ownerName: string | null;
  /** 친구 유입 유도 캡션 문구 선택용 (0명이면 첫 관객을 부르는 문구로 전환) */
  guestCount: number;
  /** 복사 결과 상태 — `useShareUniverseLink`를 페이지가 소유하고 내려준다 */
  copyState: CopyState;
  onShare: () => void;
}

/**
 * 6번 영역 — 초대장 보내기.
 *
 * 실제 공유/복사 로직은 `useShareUniverseLink`가 페이지 레벨에서 관리한다.
 * 이 컴포넌트는 트리거와 fallback(클립보드 실패 시 수동 복사 안내) 표시만 담당한다.
 */
export const ShareLinkButton = ({
  shareUrl,
  ownerName,
  guestCount,
  copyState,
  onShare,
}: ShareLinkButtonProps) => {
  const t = useTranslations("universe.detail");
  const title = ownerName
    ? t("ownerTitle", { name: ownerName })
    : t("ownerTitleFallback");

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{t("shareTitle")}</h2>

      {/* 행동할 수단이 있는 자리에 유도 카피를 둔다 (CTO/CPO 확정) */}
      <p className={styles.lead}>
        {guestCount === 0
          ? t("shareLeadEmpty")
          : t("shareLead", { count: guestCount })}
      </p>

      <ScreeningTicket
        size="mini"
        isDecorative
        kind={t("inviteKind")}
        title={title}
      />

      <button type="button" className={styles.button} onClick={onShare}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M22 2 11 13" />
          <path d="M22 2 15 22l-4-9-9-4 20-7z" />
        </svg>
        {t("shareButton")}
      </button>

      {copyState === "fallback" && (
        <>
          <p className={styles.status} role="status">
            {t("shareFallback")}
          </p>
          <p className={styles.rawUrl}>{shareUrl}</p>
        </>
      )}
    </section>
  );
};
