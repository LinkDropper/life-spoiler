"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

import type { FollowUpFortuneType } from "@/libs/supabase/types";

import { ChatDrawer } from "./ChatDrawer";
import styles from "./FollowUpEntry.module.css";

interface FollowUpEntryProps {
  profileId: string;
  fortuneType: FollowUpFortuneType;
  pairId?: string;
  fortuneName: string;
  examplePrompts: string[];
}

/**
 * 본편 오른쪽 아래에 떠 있는 "전문가에게 묻기" 버튼. 누르면 질문 시트(ChatDrawer)가 열린다.
 * 남은 횟수는 시트를 한 번 연 뒤부터 버튼에도 보인다(열기 전에는 따로 조회하지 않는다).
 */
export const FollowUpEntry = ({
  profileId,
  fortuneType,
  pairId,
  fortuneName,
  examplePrompts,
}: FollowUpEntryProps) => {
  const t = useTranslations("fortune.screen.ask");
  const [isOpen, setIsOpen] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      {/* 떠 있는 버튼이 페이지 맨 아래(엔딩 크레딧 버튼)를 가리지 않게 같은 높이만큼 비운다 */}
      <span className={styles.spacer} aria-hidden="true" />
      <button
        type="button"
        className={styles.button}
        onClick={handleOpen}
        aria-haspopup="dialog"
        aria-label={remaining === null ? t("fab") : t("fabAria", { remaining })}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={styles.icon}
        >
          <path d="M4 5h16v11H9l-5 4z" fill="currentColor" />
        </svg>
        <span>{t("fab")}</span>
        {remaining !== null && (
          <span className={styles.count} aria-hidden="true">
            {remaining}
          </span>
        )}
      </button>

      <ChatDrawer
        isOpen={isOpen}
        onClose={handleClose}
        profileId={profileId}
        fortuneType={fortuneType}
        pairId={pairId}
        fortuneName={fortuneName}
        examplePrompts={examplePrompts}
        onRemainingChange={setRemaining}
      />
    </>
  );
};

export default FollowUpEntry;
