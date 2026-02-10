"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import styles from "./CompatibilityBanner.module.css";

interface CompatibilityBannerProps {
  onClick: () => void;
}

export const CompatibilityBanner = ({ onClick }: CompatibilityBannerProps) => {
  const t = useTranslations("home.banner");

  return (
    <button type="button" className={styles.banner} onClick={onClick}>
      <div className={styles.inner}>
        <span className={styles.title}>{t("title")}</span>
        <span className={styles.subtitle}>{t("subtitle")}</span>
      </div>
      <Image
        src="/images/home/compatibility-banner-illustration.svg"
        alt=""
        width={112}
        height={127}
        className={styles.illustration}
      />
    </button>
  );
};
