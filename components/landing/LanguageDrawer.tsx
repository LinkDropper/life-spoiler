"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

import { locales, localeNames } from "@/i18n/config";
import type { Locale } from "@/i18n/config";

import styles from "./LanguageDrawer.module.css";

interface LanguageDrawerProps {
  isOpen: boolean;
  currentLocale: Locale;
  onClose: () => void;
  onSelect: (locale: Locale) => void;
}

export const LanguageDrawer = ({
  isOpen,
  currentLocale,
  onClose,
  onSelect,
}: LanguageDrawerProps) => {
  const t = useTranslations("landing.header");
  const [mounted, setMounted] = useState(false);

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

  if (!mounted || !isOpen) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSelect = (locale: Locale) => {
    onSelect(locale);
  };

  return createPortal(
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.drawer}>
        <div className={styles.header}>
          <span className={styles.title}>
            {t("languageSettingTitle", { default: "언어 설정" })}
          </span>
        </div>

        <div className={styles.separator}>
          <hr className={styles.separatorLine} />
        </div>

        <div className={styles.menuItems}>
          {locales.map((locale) => (
            <button
              key={locale}
              type="button"
              className={styles.menuItem}
              onClick={() => handleSelect(locale)}
            >
              <span>{localeNames[locale]}</span>
              {locale === currentLocale && <CheckIcon />}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

const CheckIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.checkIcon}
  >
    <path
      d="M15 4.5L6.75 12.75L3 9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
