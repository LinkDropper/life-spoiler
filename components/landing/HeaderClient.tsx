"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

import { useUser } from "@/libs/stores/user";

import styles from "./Header.module.css";
import { LanguageSelector } from "./LanguageSelector";
import { Menu } from "./Menu";

export const HeaderClient = () => {
  const t = useTranslations("landing.header");
  const router = useRouter();

  const user = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogoClick = () => {
    if (user?.id) {
      router.push("/profiles");
      return;
    }
    router.push("/");
  };

  const handleMenuOpen = useCallback(() => {
    setIsMenuOpen(true);
  }, []);

  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return (
    <>
      <header className={styles.header}>
        <Image
          src="/images/landing/logo.png"
          alt={t("logoAlt", { default: "인생스포 로고" })}
          width={87}
          height={32}
          priority
          quality={100}
          onClick={handleLogoClick}
          className={styles.logo}
        />
        <div className={styles.headerRight}>
          <LanguageSelector />
          <button
            type="button"
            className={styles.menuButton}
            aria-label={t("menuAriaLabel", { default: "메뉴" })}
            onClick={handleMenuOpen}
          >
            <Image
              src="/images/landing/menu-icon.svg"
              alt=""
              width={24}
              height={24}
            />
          </button>
        </div>
      </header>
      <div className={styles.headerSpacer} />
      <Menu isOpen={isMenuOpen} onClose={handleMenuClose} />
    </>
  );
};
