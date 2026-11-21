"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import type { Locale } from "@/i18n/config";

import styles from "./LanguageSelector.module.css";
import { LanguageDrawer } from "./LanguageDrawer";

const setLocaleCookie = (locale: Locale) => {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
};

export const LanguageSelector = () => {
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
      <button
        type="button"
        className={styles.button}
        aria-label={t("languageAriaLabel", { default: "언어 변경" })}
        onClick={handleOpen}
      >
        <Image
          src="/images/landing/language-icon.svg"
          alt=""
          width={24}
          height={24}
        />
      </button>

      <LanguageDrawer
        isOpen={isOpen}
        currentLocale={currentLocale}
        onClose={handleClose}
        onSelect={handleSelect}
      />
    </>
  );
};
