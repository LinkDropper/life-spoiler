"use client";

import { useCallback, useEffect, useState } from "react";
import { CircleCheckBig } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  encodeReviewContent,
  REVIEW_REASON_CODES,
  type ReviewReasonCode,
} from "@/libs/reviews/review-reason";
import type { ReviewFortuneType } from "@/libs/supabase/types";

import styles from "./ReviewDrawer.module.css";

const MAX_CONTENT_LENGTH = 200;
/** 이 평점 이하면 "아쉬운 점" 칩을 더 적극적으로(먼저) 노출한다 */
const LOW_RATING_THRESHOLD = 3;

interface ReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  fortuneType: ReviewFortuneType;
}

export const ReviewDrawer = ({
  isOpen,
  onClose,
  profileId,
  fortuneType,
}: ReviewDrawerProps) => {
  const t = useTranslations("fortune.common.review");
  const tCommon = useTranslations("common");

  const [rating, setRating] = useState(0);
  const [selectedReasons, setSelectedReasons] = useState<ReviewReasonCode[]>(
    []
  );
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setIsLoading(true);
      const url = `/api/reviews?profileId=${profileId}&fortuneType=${fortuneType}`;
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data.exists) {
            setIsCompleted(true);
          }
        })
        .catch(() => {
          // 체크 실패해도 폼은 표시
        })
        .finally(() => setIsLoading(false));
    } else {
      document.body.style.overflow = "";
      setRating(0);
      setSelectedReasons([]);
      setContent("");
      setIsCompleted(false);
      setError(null);
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, profileId, fortuneType]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !isSubmitting) {
        onClose();
      }
    },
    [isSubmitting, onClose]
  );

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;

    if (value.length <= MAX_CONTENT_LENGTH) {
      setContent(value);
    }

    setError(null);
  };

  const handleStarClick = (star: number) => {
    setRating(star);
    setError(null);
  };

  const handleReasonToggle = (reason: ReviewReasonCode) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((item) => item !== reason)
        : [...prev, reason]
    );
    setError(null);
  };

  // 별점만 있으면 제출 가능 — 텍스트/칩은 선택 사항
  const isValid = rating >= 1;
  const showReasons = rating >= 1;
  const reasonPrompt =
    rating > 0 && rating <= LOW_RATING_THRESHOLD
      ? t("reasonPromptLow")
      : t("reasonPromptHigh");

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const encodedContent = encodeReviewContent(selectedReasons, content);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          fortuneType,
          rating,
          content: encodedContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? t("errorSave"));
        return;
      }

      setIsCompleted(true);
    } catch {
      setError(t("errorNetwork"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className={styles.backdrop} onClick={handleBackdropClick}>
        <div className={styles.drawer}>
          <div className={styles.completedBody}>
            <span className={styles.completedSub}>{t("loading")}</span>
          </div>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className={styles.backdrop} onClick={handleBackdropClick}>
        <div className={styles.drawer}>
          <div className={styles.header}>
            <span className={styles.title}>{t("title")}</span>
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label={tCommon("close")}
            >
              <CloseIcon />
            </button>
          </div>
          <div className={styles.separator}>
            <hr className={styles.separatorLine} />
          </div>
          <div className={styles.completedBody}>
            <CircleCheckBig size={40} color="#ffccd9" strokeWidth={1.5} />
            <p className={styles.completedMessage}>{t("completedMessage")}</p>
            <p className={styles.completedSub}>{t("completedSub")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.drawer}>
        <div className={styles.header}>
          <span className={styles.title}>{t("title")}</span>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            disabled={isSubmitting}
            aria-label={tCommon("close")}
          >
            <CloseIcon />
          </button>
        </div>

        <div className={styles.separator}>
          <hr className={styles.separatorLine} />
        </div>

        <div className={styles.body}>
          {/* 별점 */}
          <div className={styles.ratingSection}>
            <span className={styles.ratingLabel}>{t("subtitle")}</span>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={styles.starButton}
                  onClick={() => handleStarClick(star)}
                  aria-label={t("starAriaLabel", { star })}
                  aria-pressed={star <= rating}
                >
                  <StarIcon filled={star <= rating} />
                </button>
              ))}
            </div>
          </div>

          {/* 불만 유형 칩 (별점을 매긴 뒤에만 노출) */}
          {showReasons && (
            <div
              className={styles.reasonSection}
              role="group"
              aria-label={t("reasonsGroupAriaLabel")}
            >
              <span className={styles.reasonLabel}>{reasonPrompt}</span>
              <div className={styles.reasonChips}>
                {REVIEW_REASON_CODES.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    className={`${styles.reasonChip} ${
                      selectedReasons.includes(reason)
                        ? styles.reasonChipSelected
                        : ""
                    }`}
                    onClick={() => handleReasonToggle(reason)}
                    aria-pressed={selectedReasons.includes(reason)}
                  >
                    {t(`reasons.${reason}`)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 텍스트 입력 */}
          <div className={styles.textSection}>
            <textarea
              className={styles.textarea}
              placeholder={t("placeholder")}
              value={content}
              onChange={handleContentChange}
              maxLength={MAX_CONTENT_LENGTH}
              disabled={isSubmitting}
              aria-label={t("placeholder")}
            />
            <div className={styles.textMeta}>
              <span
                className={`${styles.charCount} ${
                  content.length > MAX_CONTENT_LENGTH
                    ? styles.charCountOver
                    : ""
                }`}
              >
                {t("charCountLabel", {
                  count: content.length,
                  max: MAX_CONTENT_LENGTH,
                })}
              </span>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && <p className={styles.errorMessage}>{error}</p>}

          {/* 제출 버튼 */}
          <button
            type="button"
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? t("submitting") : t("submit")}
          </button>
        </div>
      </div>
    </div>
  );
};

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill={filled ? "#ffccd9" : "none"}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      stroke="#ffccd9"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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

export default ReviewDrawer;
