"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import {
  REVIEW_REASON_MESSAGE_KEYS,
  encodeReviewContent,
  getReviewReasonCodes,
  LOW_RATING_THRESHOLD,
  type ReviewReasonCode,
} from "@/libs/reviews/review-reason";
import type { ReviewFortuneType } from "@/libs/supabase/types";

import { ScreenSheet } from "./screen/ScreenSheet";
import styles from "./ReviewDrawer.module.css";

const MAX_CONTENT_LENGTH = 200;
const STAR_VALUES = [1, 2, 3, 4, 5] as const;

interface ReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  fortuneType: ReviewFortuneType;
}

/**
 * 관람평 시트 (엔딩 크레딧 "관람평 남기기").
 * 별점은 지금처럼 1~5로 저장하고, 칩은 별점에 따라 4~5점 = 좋았던 점, 1~3점 = 아쉬운 점.
 */
export const ReviewDrawer = ({
  isOpen,
  onClose,
  profileId,
  fortuneType,
}: ReviewDrawerProps) => {
  const t = useTranslations("fortune.common.review");
  const [rating, setRating] = useState(0);
  const [selectedReasons, setSelectedReasons] = useState<ReviewReasonCode[]>(
    []
  );
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 열 때 이미 남긴 관람평이 있는지 확인, 닫으면 입력을 비운다
  useEffect(() => {
    if (!isOpen) {
      setRating(0);
      setSelectedReasons([]);
      setContent("");
      setIsCompleted(false);
      setError(null);
      return;
    }
    setIsLoading(true);
    fetch(`/api/reviews?profileId=${profileId}&fortuneType=${fortuneType}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.exists) {
          setIsCompleted(true);
        }
      })
      .catch(() => {
        // 확인에 실패해도 폼은 보여 준다
      })
      .finally(() => setIsLoading(false));
  }, [isOpen, profileId, fortuneType]);

  const reasonCodes = getReviewReasonCodes(rating);
  const isLowRating = rating > 0 && rating <= LOW_RATING_THRESHOLD;

  const handleStarClick = (star: number) => {
    // 좋았던 점 ↔ 아쉬운 점 칩이 바뀌면 고른 칩을 비운다
    const crossesThreshold =
      star <= LOW_RATING_THRESHOLD !== rating <= LOW_RATING_THRESHOLD;
    if (rating > 0 && crossesThreshold) {
      setSelectedReasons([]);
    }
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

  const handleContentChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setContent(event.target.value.slice(0, MAX_CONTENT_LENGTH));
    setError(null);
  };

  const handleSubmit = async () => {
    if (rating < 1 || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          fortuneType,
          rating,
          content: encodeReviewContent(selectedReasons, content),
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

  const renderBody = () => {
    if (isLoading) {
      return (
        <p className={styles.status} role="status">
          {t("loading")}
        </p>
      );
    }

    if (isCompleted) {
      return (
        <div className={styles.done} role="status">
          <span className={styles.doneStamp} aria-hidden="true">
            REVIEWED
          </span>
          <b className={styles.doneTitle}>{t("completedMessage")}</b>
          <span className={styles.doneSub}>{t("completedSub")}</span>
          <button
            type="button"
            className={styles.ghostButton}
            onClick={onClose}
          >
            {t("close")}
          </button>
        </div>
      );
    }

    return (
      <>
        <div className={styles.stub}>
          <span className={styles.stubMain}>
            <span className={styles.stubLabel}>NOW REVIEWING</span>
            <b>{t(`stub.${fortuneType}`)}</b>
          </span>
          <span className={styles.stubEdge} aria-hidden="true">
            ADMIT
            <br />
            ONE
          </span>
        </div>

        <div className={styles.rating}>
          <span className={styles.ratingQuestion}>{t("subtitle")}</span>
          <div
            className={styles.stars}
            role="radiogroup"
            aria-label={t("subtitle")}
          >
            {STAR_VALUES.map((star) => (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={star === rating}
                aria-label={t("starAriaLabel", { star })}
                className={`${styles.star} ${star <= rating ? styles.starOn : ""}`}
                onClick={() => handleStarClick(star)}
              >
                ★
              </button>
            ))}
          </div>
          {rating > 0 && (
            <span className={styles.ratingWord}>
              {t("ratingWord", { rating, word: t(`ratingWords.${rating}`) })}
            </span>
          )}
        </div>

        {rating > 0 && (
          <div
            className={styles.reasons}
            role="group"
            aria-label={
              isLowRating ? t("reasonsGroupLow") : t("reasonsGroupHigh")
            }
          >
            <span className={styles.reasonPrompt}>
              {isLowRating ? t("reasonPromptLow") : t("reasonPromptHigh")}
            </span>
            <div className={styles.chips}>
              {reasonCodes.map((reason) => {
                const isSelected = selectedReasons.includes(reason);
                return (
                  <button
                    key={reason}
                    type="button"
                    aria-pressed={isSelected}
                    className={`${styles.chip} ${
                      isSelected
                        ? isLowRating
                          ? styles.chipLow
                          : styles.chipHigh
                        : ""
                    }`}
                    onClick={() => handleReasonToggle(reason)}
                  >
                    {t(`reasons.${REVIEW_REASON_MESSAGE_KEYS[reason]}`)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <label className={styles.textField}>
          <span className={styles.srOnly}>{t("placeholder")}</span>
          <textarea
            className={styles.textarea}
            placeholder={t("placeholder")}
            value={content}
            onChange={handleContentChange}
            maxLength={MAX_CONTENT_LENGTH}
            disabled={isSubmitting}
          />
          <span className={styles.charCount} aria-hidden="true">
            {t("charCountLabel", {
              count: content.length,
              max: MAX_CONTENT_LENGTH,
            })}
          </span>
        </label>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          className={styles.submit}
          onClick={handleSubmit}
          disabled={rating < 1 || isSubmitting}
        >
          {isSubmitting ? t("submitting") : t("submit")}
        </button>
      </>
    );
  };

  return (
    <ScreenSheet
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="REVIEW"
      title={t("title")}
      isBusy={isSubmitting}
    >
      {renderBody()}
    </ScreenSheet>
  );
};
