"use client";

import { useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";

import { localeNames } from "@/i18n/config";
import type { Locale } from "@/i18n/config";

import styles from "./LanguageSelector.module.css";
import { LanguageDrawer } from "./LanguageDrawer";

const setLocaleCookie = (locale: Locale) => {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
};

interface LanguageSelectorProps {
  /** icon: 헤더의 아이콘 버튼, labeled: 메뉴 하단의 지구본 + 현재 언어 이름 */
  variant?: "icon" | "labeled";
}

const GlobeIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <circle
      cx="12"
      cy="12"
      r="8.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5M12 3.5C9.6 5.9 8.5 8.7 8.5 12s1.1 6.1 3.5 8.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </svg>
);

export const LanguageSelector = ({
  variant = "icon",
}: LanguageSelectorProps) => {
  const t = useTranslations("landing.header");
  const currentLocale = useLocale() as Locale;
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSelect = useCallback(
    (locale: Locale) => {
      if (locale === currentLocale) {
        setIsOpen(false);
        return;
      }

      setLocaleCookie(locale);
      setIsOpen(false);
      window.location.reload();
    },
    [currentLocale]
  );

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          className={styles.iconButton}
          aria-label={t("languageAriaLabel")}
          onClick={handleOpen}
        >
          <GlobeIcon size={22} />
        </button>
      ) : (
        <button
          type="button"
          className={styles.labeledButton}
          aria-label={`${t("languageAriaLabel")}: ${localeNames[currentLocale]}`}
          onClick={handleOpen}
        >
          <GlobeIcon size={18} />
          {localeNames[currentLocale]}
        </button>
      )}

      <LanguageDrawer
        isOpen={isOpen}
        currentLocale={currentLocale}
        onClose={handleClose}
        onSelect={handleSelect}
      />
    </>
  );
};
