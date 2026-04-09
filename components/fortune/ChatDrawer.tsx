"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";

import type { FollowUpFortuneType } from "@/libs/supabase/types";

import {
  FREE_QUESTION_LIMIT,
  MAX_QUESTION_LENGTH,
  MIN_QUESTION_LENGTH,
  RATE_LIMIT_SECONDS,
} from "./chat-drawer.constants";
import styles from "./ChatDrawer.module.css";

interface ChatMessage {
  id: string;
  role: "user" | "expert";
  content: string;
  isRelevant?: boolean;
}

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  fortuneType: FollowUpFortuneType;
  pairId?: string;
  fortuneName: string;
  examplePrompts: string[];
  onRemainingChange?: (remaining: number) => void;
}

export const ChatDrawer = ({
  isOpen,
  onClose,
  profileId,
  fortuneType,
  pairId,
  fortuneName,
  examplePrompts,
  onRemainingChange,
}: ChatDrawerProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [remaining, setRemainingInternal] = useState(FREE_QUESTION_LIMIT);

  const setRemaining = useCallback(
    (value: number) => {
      setRemainingInternal(value);
      onRemainingChange?.(value);
    },
    [onRemainingChange]
  );
  const [input, setInput] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const [rateLimitTick, setRateLimitTick] = useState(0);

  const messageListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isExhausted = remaining <= 0;

  // 초기 이력 로드
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      setMessages([]);
      setInput("");
      setError(null);
      setRateLimitUntil(null);
      return;
    }

    document.body.style.overflow = "hidden";
    setIsInitializing(true);
    setError(null);

    const params = new URLSearchParams({
      profileId,
      fortuneType,
    });
    if (pairId) {
      params.set("pairId", pairId);
    }

    fetch(`/api/follow-up?${params.toString()}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "대화 이력을 불러오지 못했어요.");
        }
        return data as {
          history: {
            id: string;
            question: string;
            answer: string;
            isRelevant: boolean;
          }[];
          remaining: number;
        };
      })
      .then((data) => {
        const initialMessages: ChatMessage[] = [];
        data.history.forEach((h) => {
          initialMessages.push({
            id: `${h.id}-q`,
            role: "user",
            content: h.question,
          });
          initialMessages.push({
            id: `${h.id}-a`,
            role: "expert",
            content: h.answer,
            isRelevant: h.isRelevant,
          });
        });
        setMessages(initialMessages);
        setRemaining(data.remaining);
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setIsInitializing(false);
      });

    return () => {
      document.body.style.overflow = "";
    };
    // setRemaining은 매 렌더마다 동일 ref를 갖는 stable callback이 아니지만,
    // 초기 로드 시점에만 한번 호출되면 되므로 의도적으로 의존성에서 제외한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, profileId, fortuneType, pairId]);

  // 메시지 추가 시 스크롤 하단 이동
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  // Rate limit 카운트다운
  useEffect(() => {
    if (rateLimitUntil === null) return;

    const tick = () => setRateLimitTick((v) => v + 1);
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [rateLimitUntil]);

  // Rate limit 만료 확인
  useEffect(() => {
    if (rateLimitUntil !== null && Date.now() >= rateLimitUntil) {
      setRateLimitUntil(null);
    }
  }, [rateLimitUntil, rateLimitTick]);

  // 입력 내용에 따라 textarea 높이 자동 조절 (max 120px)
  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [input]);

  // Esc 키로 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSending, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !isSending) {
        onClose();
      }
    },
    [isSending, onClose]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    if (value.length <= MAX_QUESTION_LENGTH) {
      setInput(value);
      setError(null);
    }
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
    inputRef.current?.focus();
  };

  const rateLimitRemainingSec = useMemo(() => {
    if (rateLimitUntil === null) return 0;
    const diff = Math.ceil((rateLimitUntil - Date.now()) / 1000);
    return Math.max(0, diff);
    // rateLimitTick은 1초마다 리렌더를 유도하기 위한 더미 의존성
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rateLimitUntil, rateLimitTick]);

  const trimmedLength = input.trim().length;
  const isValid =
    trimmedLength >= MIN_QUESTION_LENGTH &&
    trimmedLength <= MAX_QUESTION_LENGTH;
  const canSend =
    isValid && !isSending && !isExhausted && rateLimitRemainingSec === 0;

  const handleSend = async () => {
    if (!canSend) return;

    const question = input.trim();
    const tempId = `temp-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: `${tempId}-q`, role: "user", content: question },
    ]);
    setInput("");
    setIsSending(true);
    setError(null);

    try {
      const response = await fetch("/api/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          fortuneType,
          pairId: pairId ?? null,
          question,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429 && data.code === "RATE_LIMITED") {
          const retryAfter: number = data.retryAfter ?? RATE_LIMIT_SECONDS;
          setRateLimitUntil(Date.now() + retryAfter * 1000);
          setMessages((prev) => prev.slice(0, -1)); // 유저 메시지 롤백
          setInput(question);
          setError(`${retryAfter}초 후 다시 질문할 수 있어요.`);
          return;
        }

        if (data.code === "FREE_LIMIT_EXCEEDED") {
          setRemaining(0);
          setMessages((prev) => prev.slice(0, -1));
          setInput(question);
          return;
        }

        setMessages((prev) => prev.slice(0, -1));
        setInput(question);
        setError(data.error ?? "답변을 가져오지 못했어요.");
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `${data.id}-a`,
          role: "expert",
          content: data.answer,
          isRelevant: data.isRelevant,
        },
      ]);
      setRemaining(data.remaining);

      // 관련 있는 질문이면 rate limit 시작
      if (data.isRelevant) {
        setRateLimitUntil(Date.now() + RATE_LIMIT_SECONDS * 1000);
      }
    } catch {
      setMessages((prev) => prev.slice(0, -1));
      setInput(question);
      setError("네트워크 오류가 발생했어요. 다시 시도해주세요.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  const hasMessages = messages.length > 0;
  const showContentHint =
    input.length > 0 &&
    trimmedLength > 0 &&
    trimmedLength < MIN_QUESTION_LENGTH;

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-drawer-title"
    >
      <div className={styles.drawer}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <MessageCircle
              size={18}
              strokeWidth={1.8}
              className={styles.headerIcon}
            />
            <span id="chat-drawer-title" className={styles.title}>
              전문가에게 물어보기
            </span>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.remainingLabel} aria-live="polite">
              {remaining}/{FREE_QUESTION_LIMIT} 남음
            </span>
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              disabled={isSending}
              aria-label="닫기"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className={styles.separator}>
          <hr className={styles.separatorLine} />
        </div>

        <div
          ref={messageListRef}
          className={styles.messageList}
          role="log"
          aria-live="polite"
          aria-atomic="false"
        >
          {isInitializing ? (
            <div className={styles.emptyState}>
              <p className={styles.emptySub}>불러오는 중...</p>
            </div>
          ) : !hasMessages ? (
            <div className={styles.emptyState}>
              <MessageCircle
                size={40}
                strokeWidth={1.5}
                className={styles.emptyIcon}
              />
              <p className={styles.emptyTitle}>
                {"운세 결과에 대해 궁금한 점을\n전문가에게 물어보세요"}
              </p>
              <p className={styles.emptySub}>
                {fortuneName} 결과를 바탕으로 답변드려요
              </p>
              <div className={styles.exampleChips}>
                {examplePrompts.map((example) => (
                  <button
                    key={example}
                    type="button"
                    className={styles.exampleChip}
                    onClick={() => handleExampleClick(example)}
                    disabled={isSending || isExhausted}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              if (msg.role === "user") {
                return (
                  <div
                    key={msg.id}
                    className={styles.userBubble}
                    aria-label="나의 질문"
                  >
                    {msg.content}
                  </div>
                );
              }

              const isReject = msg.isRelevant === false;
              const bubbleClass = isReject
                ? `${styles.aiBubble} ${styles.rejectBubble}`
                : styles.aiBubble;

              return (
                <div
                  key={msg.id}
                  className={bubbleClass}
                  aria-label="전문가 답변"
                >
                  {msg.content}
                  {isReject && (
                    <span className={styles.rejectHint}>
                      ⓘ 이 질문은 횟수에 포함되지 않아요
                    </span>
                  )}
                </div>
              );
            })
          )}

          {isSending && (
            <div
              className={styles.typingBubble}
              aria-label="전문가가 답변을 준비하는 중"
            >
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
            </div>
          )}
        </div>

        {isExhausted ? (
          <div className={styles.exhaustedCard}>
            <p className={styles.exhaustedTitle}>
              🔒 무료 질문 {FREE_QUESTION_LIMIT}회를 모두 사용했어요
            </p>
            <p className={styles.exhaustedSub}>
              {"추후 유료로 더 질문할 수 있도록\n준비 중이에요"}
            </p>
          </div>
        ) : (
          <div className={styles.inputSection}>
            <div className={styles.inputRow}>
              <textarea
                ref={inputRef}
                className={styles.input}
                placeholder={`궁금한 점을 물어보세요 (${MIN_QUESTION_LENGTH}~${MAX_QUESTION_LENGTH}자)`}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={isSending || rateLimitRemainingSec > 0}
                maxLength={MAX_QUESTION_LENGTH}
                rows={2}
                aria-label="질문 입력"
              />
              <button
                type="button"
                className={styles.sendButton}
                onClick={handleSend}
                disabled={!canSend}
                aria-label="질문 전송"
              >
                <Send size={18} strokeWidth={2} />
              </button>
            </div>
            <div className={styles.inputMeta}>
              {error ? (
                <span className={styles.inputMetaError}>{error}</span>
              ) : rateLimitRemainingSec > 0 ? (
                <span>
                  ⏱ {rateLimitRemainingSec}초 후 다시 질문할 수 있어요
                </span>
              ) : showContentHint ? (
                <span>{MIN_QUESTION_LENGTH}글자 이상 입력해주세요</span>
              ) : (
                <span />
              )}
              <span
                className={`${styles.charCount} ${
                  input.length >= MAX_QUESTION_LENGTH
                    ? styles.charCountOver
                    : ""
                }`}
              >
                {input.length}/{MAX_QUESTION_LENGTH}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CloseIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15 5L5 15M5 5L15 15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ChatDrawer;
