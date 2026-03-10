"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { localeNames } from "@/i18n/config";
import type { Locale } from "@/i18n/config";
import { useUserActions } from "@/libs/stores/user";

import { CouponDrawer } from "./CouponDrawer";
import { LanguageDrawer } from "./LanguageDrawer";
import styles from "./SettingsDrawer.module.css";

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onMenuClose: () => void;
}

const ChevronRightIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6.75 13.5L11.25 9L6.75 4.5"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const setLocaleCookie = (locale: Locale) => {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
};

export const SettingsDrawer = ({
  isOpen,
  onClose,
  onMenuClose,
}: SettingsDrawerProps) => {
  const t = useTranslations("landing.settings");
  const tMenu = useTranslations("landing.menu");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const currentLocale = useLocale() as Locale;
  const { logout } = useUserActions();

  const [mounted, setMounted] = useState(false);
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        logout();
        onMenuClose();
        router.push("/");
      }
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  }, [logout, onMenuClose, router]);

  const handleWithdraw = useCallback(async () => {
    setIsWithdrawing(true);

    try {
      const response = await fetch("/api/auth/withdraw", {
        method: "DELETE",
      });

      if (response.ok) {
        logout();
        setShowWithdrawModal(false);
        onMenuClose();
        router.push("/");
      } else {
        const data = await response.json();
        alert(data.error || tMenu("withdrawError"));
      }
    } catch (error) {
      console.error("회원탈퇴 실패:", error);
      alert(tMenu("withdrawError"));
    } finally {
      setIsWithdrawing(false);
    }
  }, [logout, onMenuClose, router, tMenu]);

  const handleLanguageSelect = useCallback(
    (locale: Locale) => {
      if (locale === currentLocale) {
        setIsLanguageOpen(false);
        return;
      }

      setLocaleCookie(locale);
      setIsLanguageOpen(false);
      window.location.reload();
    },
    [currentLocale]
  );

  if (!mounted || !isOpen) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <>
      <div className={styles.backdrop} onClick={handleBackdropClick}>
        <div className={styles.drawer}>
          <div className={styles.header}>
            <span className={styles.title}>{t("title")}</span>
          </div>

          <div className={styles.separator}>
            <hr className={styles.separatorLine} />
          </div>

          <div className={styles.menuItems}>
            <button
              type="button"
              className={styles.menuItem}
              onClick={() => setIsCouponOpen(true)}
            >
              <span>{t("couponInput")}</span>
              <ChevronRightIcon />
            </button>

            <button
              type="button"
              className={styles.menuItem}
              onClick={() => setIsLanguageOpen(true)}
            >
              <span className={styles.menuItemRegular}>
                {t("language", { locale: localeNames[currentLocale] })}
              </span>
              <ChevronRightIcon />
            </button>

            <button
              type="button"
              className={styles.menuItem}
              onClick={handleLogout}
            >
              <span>{tMenu("logout")}</span>
              <ChevronRightIcon />
            </button>

            <button
              type="button"
              className={styles.menuItem}
              onClick={() => setShowWithdrawModal(true)}
            >
              <span>{tMenu("withdraw")}</span>
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </div>

      <CouponDrawer
        isOpen={isCouponOpen}
        onClose={() => setIsCouponOpen(false)}
        onSuccess={() => setIsCouponOpen(false)}
      />

      <LanguageDrawer
        isOpen={isLanguageOpen}
        currentLocale={currentLocale}
        onClose={() => setIsLanguageOpen(false)}
        onSelect={handleLanguageSelect}
      />

      {showWithdrawModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => !isWithdrawing && setShowWithdrawModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <div className={styles.modalTitleRow}>
                  <Image
                    src="/images/landing/alert-circle.svg"
                    alt=""
                    width={24}
                    height={24}
                  />
                  <h2 className={styles.modalTitle}>
                    {tMenu("withdrawModal.title")}
                  </h2>
                </div>
                <p className={styles.modalDescription}>
                  {tMenu("withdrawModal.description")}
                </p>
              </div>
              <div className={styles.modalButtons}>
                <button
                  type="button"
                  className={styles.modalCancelButton}
                  onClick={() => setShowWithdrawModal(false)}
                  disabled={isWithdrawing}
                >
                  {tCommon("cancel")}
                </button>
                <button
                  type="button"
                  className={styles.modalConfirmButton}
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
                >
                  {isWithdrawing
                    ? tMenu("withdrawModal.withdrawing")
                    : tMenu("withdrawModal.confirm")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};
