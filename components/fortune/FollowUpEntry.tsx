"use client";

import { useCallback, useState } from "react";
import { MessageCircle } from "lucide-react";

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
 * 결과 페이지 우하단에 플로팅되는 "전문가에게 물어보기" 진입 버튼.
 * 클릭 시 ChatDrawer 오픈. 남은 횟수는 드로어 헤더에서만 확인.
 */
export const FollowUpEntry = ({
  profileId,
  fortuneType,
  pairId,
  fortuneName,
  examplePrompts,
}: FollowUpEntryProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      <button
        type="button"
        className={styles.button}
        onClick={handleOpen}
        aria-label="전문가에게 물어보기"
      >
        <MessageCircle
          size={24}
          strokeWidth={0}
          fill="#2d1b4e"
          className={styles.icon}
        />
      </button>

      <ChatDrawer
        isOpen={isOpen}
        onClose={handleClose}
        profileId={profileId}
        fortuneType={fortuneType}
        pairId={pairId}
        fortuneName={fortuneName}
        examplePrompts={examplePrompts}
      />
    </>
  );
};

export default FollowUpEntry;
