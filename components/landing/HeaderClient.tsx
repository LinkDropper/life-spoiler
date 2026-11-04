"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";

import { useUser } from "@/libs/stores/user";

import styles from "./Header.module.css";
import { LanguageSelector } from "./LanguageSelector";
import { Menu } from "./Menu";

/**
 * 공용 헤더. 상영관 컨셉에서 헤더는 장면을 가리지 않고 물러나 있어야 해서
 * 브랜드색 선 없이 밤색으로 두고, 아래 가장자리만 본문 쪽으로 흐리게 녹인다.
 */
export const HeaderClient = () => {
  const t = useTranslations("landing.header");
  const user = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const handleMenuOpen = useCallback(() => {
    setIsMenuOpen(true);
  }, []);

  // 닫으면 포커스를 메뉴를 연 버튼으로 돌려준다
  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link
            href={user?.id ? "/home" : "/"}
            className={styles.logoLink}
            aria-label={t("homeAriaLabel")}
          >
            <Image
              src="/images/landing/logo.png"
              alt=""
              width={87}
              height={32}
              priority
              quality={100}
            />
          </Link>
          <div className={styles.headerRight}>
            <LanguageSelector />
            <button
              ref={menuButtonRef}
              type="button"
              className={styles.iconButton}
              aria-label={t("menuAriaLabel")}
              aria-haspopup="dialog"
              aria-expanded={isMenuOpen}
              onClick={handleMenuOpen}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M4 7h16M4 12h16M10 17h10"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>
      <div className={styles.headerSpacer} />
      <Menu isOpen={isMenuOpen} onClose={handleMenuClose} />
    </>
  );
};
