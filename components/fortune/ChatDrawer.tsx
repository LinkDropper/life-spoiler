"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Sheet } from "@/components/common/sheet";
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

/** 본편을 보고 전문가에게 묻는 상영관 시트 (질문 버튼 FollowUpEntry가 연다) */
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
  const t = useTranslations("fortune.screen.ask");
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
      setMessages([]);
      setInput("");
      setError(null);
      setRateLimitUntil(null);
      return;
    }

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
          throw new Error(data.error ?? t("errorHistory"));
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
          setError(t("rateLimited", { seconds: retryAfter }));
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
        setError(data.error ?? t("errorAnswer"));
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
      setError(t("errorNetwork"));
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

  const hasMessages = messages.length > 0;
  const showContentHint =
    input.length > 0 &&
    trimmedLength > 0 &&
    trimmedLength < MIN_QUESTION_LENGTH;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="ASK THE EXPERT"
      title={t("title")}
      isBusy={isSending}
      size="tall"
      headerExtra={
        <span className={styles.remaining} aria-live="polite">
          {t("remaining", { remaining, limit: FREE_QUESTION_LIMIT })}
        </span>
      }
    >
      <div className={styles.chat}>
        <div
          ref={messageListRef}
          className={styles.messageList}
          role="log"
          aria-live="polite"
          aria-atomic="false"
        >
          {isInitializing ? (
            <div className={styles.emptyState}>
              <p className={styles.emptySub}>{t("loading")}</p>
            </div>
          ) : !hasMessages ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyKicker}>
                Q&amp;A · AFTER THE SHOW
              </span>
              <p className={styles.emptyTitle}>{t("emptyTitle")}</p>
              <p className={styles.emptySub}>
                {t("emptySub", { name: fortuneName })}
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
                    aria-label={t("myQuestion")}
                  >
                    {msg.content}
                  </div>
                );
              }

              const isReject = msg.isRelevant === false;
              return (
                <div
                  key={msg.id}
                  className={`${styles.aiBubble} ${isReject ? styles.rejectBubble : ""}`}
                  aria-label={t("expertAnswer")}
                >
                  {msg.content}
                  {isReject && (
                    <span className={styles.rejectHint}>{t("rejectHint")}</span>
                  )}
                </div>
              );
            })
          )}

          {isSending && (
            <div
              className={styles.typingBubble}
              role="status"
              aria-label={t("typing")}
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
              {t("exhaustedTitle", { limit: FREE_QUESTION_LIMIT })}
            </p>
            <p className={styles.exhaustedSub}>{t("exhaustedSub")}</p>
          </div>
        ) : (
          <div className={styles.inputSection}>
            <div className={styles.inputRow}>
              <textarea
                ref={inputRef}
                className={styles.input}
                placeholder={t("placeholder", {
                  min: MIN_QUESTION_LENGTH,
                  max: MAX_QUESTION_LENGTH,
                })}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={isSending || rateLimitRemainingSec > 0}
                maxLength={MAX_QUESTION_LENGTH}
                rows={1}
                aria-label={t("inputLabel")}
              />
              <button
                type="button"
                className={styles.sendButton}
                onClick={handleSend}
                disabled={!canSend}
                aria-label={t("send")}
              >
                <ArrowRight size={20} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
            <div className={styles.inputMeta}>
              {error ? (
                <span className={styles.inputMetaError} role="alert">
                  {error}
                </span>
              ) : rateLimitRemainingSec > 0 ? (
                <span>
                  {t("rateLimited", { seconds: rateLimitRemainingSec })}
                </span>
              ) : showContentHint ? (
                <span>{t("minLength", { min: MIN_QUESTION_LENGTH })}</span>
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
    </Sheet>
  );
};

export default ChatDrawer;
