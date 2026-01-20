"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useCallback, useEffect } from "react";

import { useUser, useUserActions } from "@/libs/stores/user";

import styles from "./Menu.module.css";

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Menu = ({ isOpen, onClose }: MenuProps) => {
  const t = useTranslations("landing.menu");
  const tFooter = useTranslations("landing.footer");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const user = useUser();
  const { logout } = useUserActions();

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const getLoginProviderMessage = () => {
    if (!user) return "";

    const providerMessages: Record<string, string> = {
      google: t("loginViaGoogle"),
      kakao: t("loginViaKakao"),
    };

    return providerMessages[user.provider] ?? t("loggedIn");
  };

  const handleLogout = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        logout();
        onClose();
        router.push("/");
      }
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  }, [logout, onClose, router]);

  const handleWithdraw = useCallback(async () => {
    setIsWithdrawing(true);

    try {
      const response = await fetch("/api/auth/withdraw", {
        method: "DELETE",
      });

      if (response.ok) {
        logout();
        setShowWithdrawModal(false);
        onClose();
        router.push("/");
      } else {
        const data = await response.json();
        alert(data.error || t("withdrawError"));
      }
    } catch (error) {
      console.error("회원탈퇴 실패:", error);
      alert(t("withdrawError"));
    } finally {
      setIsWithdrawing(false);
    }
  }, [logout, onClose, router, t]);

  const handleNavigate = useCallback(
    (path: string) => {
      onClose();
      router.push(path);
    },
    [onClose, router]
  );

  const handleFortuneNavigate = useCallback(
    (fortuneType: "lifetime" | "yearly") => {
      onClose();
      if (!user) {
        router.push("/login");
        return;
      }
      router.push(`/profiles?type=${fortuneType}`);
    },
    [onClose, router, user]
  );

  // ESC 키로 메뉴 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <header className={styles.header}>
          <Image
            src="/images/landing/logo.png"
            alt={t("logoAlt")}
            width={87}
            height={32}
            priority
            quality={100}
          />
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={tCommon("close")}
          >
            <Image
              src="/images/landing/close-icon.svg"
              alt=""
              width={24}
              height={24}
            />
          </button>
        </header>

        {/* Content */}
        <div className={styles.content}>
          {/* Profile Card */}
          {user && (
            <div className={styles.profileCard}>
              <p className={styles.loginInfo}>{getLoginProviderMessage()}</p>
              <p className={styles.email}>{user.email}</p>
            </div>
          )}

          {/* Menu List */}
          <ul className={styles.menuList}>
            <li>
              <button
                type="button"
                className={styles.menuItem}
                onClick={() => handleFortuneNavigate("lifetime")}
              >
                <span className={styles.menuItemText}>
                  {t("lifetimeFortune")}
                </span>
                <Image
                  src="/images/landing/chevron-right.svg"
                  alt=""
                  width={20}
                  height={20}
                />
              </button>
            </li>
            <li>
              <button
                type="button"
                className={styles.menuItem}
                onClick={() => handleFortuneNavigate("yearly")}
              >
                <span className={styles.menuItemText}>
                  {t("yearlyFortune")}
                </span>
                <Image
                  src="/images/landing/chevron-right.svg"
                  alt=""
                  width={20}
                  height={20}
                />
              </button>
            </li>
            {user ? (
              <>
                <li>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={handleLogout}
                  >
                    <span className={styles.menuItemText}>{t("logout")}</span>
                    <Image
                      src="/images/landing/chevron-right.svg"
                      alt=""
                      width={20}
                      height={20}
                    />
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => setShowWithdrawModal(true)}
                  >
                    <span className={styles.menuItemText}>{t("withdraw")}</span>
                    <Image
                      src="/images/landing/chevron-right.svg"
                      alt=""
                      width={20}
                      height={20}
                    />
                  </button>
                </li>
              </>
            ) : (
              <li>
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => handleNavigate("/login")}
                >
                  <span className={styles.menuItemText}>{t("login")}</span>
                  <Image
                    src="/images/landing/chevron-right.svg"
                    alt=""
                    width={20}
                    height={20}
                  />
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerLinks}>
            <Link
              href="/policy/terms"
              className={styles.footerLink}
              onClick={onClose}
            >
              {tFooter("terms")}
            </Link>
            <span className={styles.divider}>|</span>
            <Link
              href="/policy/privacy"
              className={styles.footerLink}
              onClick={onClose}
            >
              {tFooter("privacy")}
            </Link>
          </div>
        </footer>
      </div>

      {/* Withdraw Confirmation Modal */}
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
                    {t("withdrawModal.title")}
                  </h2>
                </div>
                <p className={styles.modalDescription}>
                  {t("withdrawModal.description")}
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
                    ? t("withdrawModal.withdrawing")
                    : t("withdrawModal.confirm")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
