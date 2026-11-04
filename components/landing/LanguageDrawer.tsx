"use client";

import { useTranslations } from "next-intl";

import { OptionSheet } from "@/components/form";
import { locales, localeNames } from "@/i18n/config";
import type { Locale } from "@/i18n/config";

interface LanguageDrawerProps {
  isOpen: boolean;
  currentLocale: Locale;
  onClose: () => void;
  onSelect: (locale: Locale) => void;
}

/** 헤더 언어 선택 드로어 — 서비스 공용 OptionSheet를 쓴다 */
export const LanguageDrawer = ({
  isOpen,
  currentLocale,
  onClose,
  onSelect,
}: LanguageDrawerProps) => {
  const t = useTranslations("landing.header");

  return (
    <OptionSheet
      isOpen={isOpen}
      title={t("languageAriaLabel", { default: "언어 설정" })}
      options={locales.map((locale) => ({
        value: locale,
        label: localeNames[locale],
      }))}
      selectedValue={currentLocale}
      onSelect={(value) => onSelect(value as Locale)}
      onClose={onClose}
    />
  );
};
