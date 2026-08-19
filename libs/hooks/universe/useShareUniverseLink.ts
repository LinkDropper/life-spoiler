"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CopyState = "idle" | "copied" | "fallback";

interface UseShareUniverseLinkParams {
  shareUrl: string;
  shareText: string;
}

interface UseShareUniverseLinkResult {
  copyState: CopyState;
  showToast: boolean;
  handleShare: () => Promise<void>;
}

const TOAST_DURATION_MS = 2200;

/**
 * 우주 공유 링크 복사 로직. `ShareLinkButton`(6번 영역)과 `GuestScoreList`의
 * 빈 상태 버튼(4번 영역) 양쪽에서 같은 결과(복사 + 토스트)를 내야 하므로 페이지가
 * 이 훅을 한 번만 호출해 두 컴포넌트에 결과를 내려준다.
 */
export const useShareUniverseLink = ({
  shareUrl,
  shareText,
}: UseShareUniverseLinkParams): UseShareUniverseLinkResult => {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const handleShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text: shareText, url: shareUrl });
        return;
      } catch {
        // 사용자가 공유 시트를 닫은 경우도 여기로 오므로 클립보드로 이어서 시도한다
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState("copied");
      setShowToast(true);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      toastTimeoutRef.current = setTimeout(() => {
        setShowToast(false);
      }, TOAST_DURATION_MS);
    } catch {
      setCopyState("fallback");
    }
  }, [shareText, shareUrl]);

  return { copyState, showToast, handleShare };
};
