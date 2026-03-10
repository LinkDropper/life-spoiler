"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

import styles from "./CouponDrawer.module.css";

interface CouponDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (starAmount: number) => void;
}

const ChevronLeftIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15 18L9 12L15 6"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CouponDrawer = ({
  isOpen,
  onClose,
  onSuccess,
}: CouponDrawerProps) => {
  const t = useTranslations("landing.coupon");
  const [mounted, setMounted] = useState(false);
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleClose = useCallback(() => {
    setCode("");
    setError(null);
    setSuccess(null);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (!code.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/coupon/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(t("success", { amount: data.data.starAmount }));
        setCode("");
        onSuccess(data.data.starAmount);
      } else {
        setError(data.error);
      }
    } catch {
      setError(t("serverError"));
    } finally {
      setIsSubmitting(false);
    }
  }, [code, isSubmitting, onSuccess, t]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  if (!mounted || !isOpen) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return createPortal(
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.drawer}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.backButton}
            onClick={handleClose}
          >
            <ChevronLeftIcon />
          </button>
          <span className={styles.title}>{t("title")}</span>
        </div>

        <div className={styles.separator}>
          <hr className={styles.separatorLine} />
        </div>

        <div className={styles.content}>
          <div className={styles.inputRow}>
            <input
              type="text"
              className={styles.input}
              placeholder={t("placeholder")}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(null);
                setSuccess(null);
              }}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              autoFocus
            />
            <button
              type="button"
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={!code.trim() || isSubmitting}
            >
              {t("submit")}
            </button>
          </div>
          {error && <p className={styles.errorText}>{error}</p>}
          {success && <p className={styles.successText}>{success}</p>}
        </div>
      </div>
    </div>,
    document.body
  );
};
