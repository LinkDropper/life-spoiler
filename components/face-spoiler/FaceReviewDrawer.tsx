"use client";

import { useCallback, useEffect, useState } from "react";
import { CircleCheckBig } from "lucide-react";
import { useTranslations } from "next-intl";

import styles from "./FaceReviewDrawer.module.css";

const MAX_CONTENT_LENGTH = 200;
const MIN_CONTENT_LENGTH = 5;

interface FaceReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  faceProfileId: string;
}

export const FaceReviewDrawer = ({
  isOpen,
  onClose,
  faceProfileId,
}: FaceReviewDrawerProps) => {
  const t = useTranslations("faceSpoiler.share.review");

  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentTouched, setContentTouched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setIsLoading(true);
      const url = `/api/face-reviews?faceProfileId=${faceProfileId}`;
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data.exists) {
            setIsCompleted(true);
          }
        })
        .catch((error) => {
          console.error("Failed to check for existing review:", error);
          // 체크 실패해도 폼은 표시
        })
        .finally(() => setIsLoading(false));
    } else {
      document.body.style.overflow = "";
      setRating(0);
      setContent("");
      setIsCompleted(false);
      setError(null);
      setContentTouched(false);
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, faceProfileId]);

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
    setContentTouched(false);
  };

  const handleContentBlur = () => {
    if (content.length > 0) {
      setContentTouched(true);
    }
  };

  const showContentHint =
    contentTouched && content.trim().length < MIN_CONTENT_LENGTH;

  const handleStarClick = (star: number) => {
    setRating(star);
    setError(null);
  };

  const isValid = rating >= 1 && content.trim().length >= MIN_CONTENT_LENGTH;

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/face-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faceProfileId,
          rating,
          content: content.trim(),
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

  if (!isOpen) {
    return null;
  }

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
            >
              <CloseIcon />
            </button>
          </div>
          <div className={styles.separator}>
            <hr className={styles.separatorLine} />
          </div>
          <div className={styles.completedBody}>
            <CircleCheckBig size={44} color="#3fd9ad" strokeWidth={1.75} />
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
          >
            <CloseIcon />
          </button>
        </div>

        <div className={styles.separator}>
          <hr className={styles.separatorLine} />
        </div>

        <div className={styles.body}>
          <div className={styles.ratingSection}>
            <span className={styles.ratingLabel}>{t("subtitle")}</span>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={styles.starButton}
                  onClick={() => handleStarClick(star)}
                  aria-label={`${star}점`}
                >
                  <StarIcon filled={star <= rating} />
                </button>
              ))}
            </div>
          </div>

          <div className={styles.textSection}>
            <textarea
              className={styles.textarea}
              placeholder={t("placeholder")}
              value={content}
              onChange={handleContentChange}
              onBlur={handleContentBlur}
              maxLength={MAX_CONTENT_LENGTH}
              disabled={isSubmitting}
            />
            <div className={styles.textMeta}>
              {showContentHint && (
                <span className={styles.contentHint}>
                  {t("contentHint", { min: MIN_CONTENT_LENGTH })}
                </span>
              )}
              <span
                className={`${styles.charCount} ${
                  content.length > MAX_CONTENT_LENGTH
                    ? styles.charCountOver
                    : ""
                }`}
              >
                {content.length}/{MAX_CONTENT_LENGTH}
              </span>
            </div>
          </div>

          {error && <p className={styles.errorMessage}>{error}</p>}

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
    width="34"
    height="34"
    viewBox="0 0 24 24"
    fill={filled ? "#3fd9ad" : "none"}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      stroke={filled ? "#3fd9ad" : "rgba(255, 255, 255, 0.28)"}
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

export default FaceReviewDrawer;
