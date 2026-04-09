"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import { useAuthStatus } from "@/libs/stores/user";

import styles from "./Header.module.css";
import { Menu } from "./Menu";

export const Header = () => {
  const authStatus = useAuthStatus();
  const tMenu = useTranslations("faceSpoiler.menu");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const logoHref =
    authStatus === "authenticated" ? "/face-spoiler/profiles" : "/face-spoiler";

  const handleMenuOpen = useCallback(() => {
    setIsMenuOpen(true);
  }, []);

  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return (
    <>
      <header className={styles.header}>
        <Link href={logoHref} className={styles.logo}>
          관상스포
        </Link>
        <button
          type="button"
          className={styles.menuButton}
          onClick={handleMenuOpen}
          aria-label={tMenu("openAriaLabel", { default: "메뉴 열기" })}
        >
          <svg
            className={styles.menuIcon}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </header>

      <Menu isOpen={isMenuOpen} onClose={handleMenuClose} />
    </>
  );
};
