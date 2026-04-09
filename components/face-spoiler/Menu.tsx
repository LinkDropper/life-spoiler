"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import type { Locale } from "@/i18n/config";
import { useUser, useUserActions } from "@/libs/stores/user";

import styles from "./Menu.module.css";
import { MenuLanguageDrawer } from "./MenuLanguageDrawer";

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const setLocaleCookie = (locale: Locale) => {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
};

const ChevronRightIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M7.5 5L12.5 10L7.5 15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M6 6L18 18M6 18L18 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const AlertCircleIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="#fa5252"
      strokeWidth="2"
    />
    <path
      d="M12 7V13"
      stroke="#fa5252"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="12" cy="16.5" r="1.25" fill="#fa5252" />
  </svg>
);

export const Menu = ({ isOpen, onClose }: MenuProps) => {
  const t = useTranslations("faceSpoiler.menu");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const currentLocale = useLocale() as Locale;
  const user = useUser();
  const { logout } = useUserActions();

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isLanguageDrawerOpen, setIsLanguageDrawerOpen] = useState(false);

  const getLoginProviderMessage = () => {
    if (!user) return "";
    const providerMessages: Record<string, string> = {
      google: t("loginViaGoogle", { default: "Google로 로그인했어요" }),
      kakao: t("loginViaKakao", { default: "카카오로 로그인했어요" }),
    };
    return providerMessages[user.provider] ?? t("loggedIn", { default: "로그인되어 있어요" });
  };

  const handleLogout = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        logout();
        onClose();
        router.push("/face-spoiler");
      }
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  }, [logout, onClose, router]);

  const handleWithdraw = useCallback(async () => {
    setIsWithdrawing(true);
    try {
      const response = await fetch("/api/auth/withdraw", { method: "DELETE" });
      if (response.ok) {
        logout();
        setShowWithdrawModal(false);
        onClose();
        router.push("/face-spoiler");
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.error || t("withdrawError", { default: "회원탈퇴에 실패했어요" }));
      }
    } catch (error) {
      console.error("회원탈퇴 실패:", error);
      alert(t("withdrawError", { default: "회원탈퇴에 실패했어요" }));
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

  const handleLanguageOpen = useCallback(() => {
    setIsLanguageDrawerOpen(true);
  }, []);

  const handleLanguageClose = useCallback(() => {
    setIsLanguageDrawerOpen(false);
  }, []);

  const handleLanguageSelect = useCallback(
    (locale: Locale) => {
      if (locale === currentLocale) {
        setIsLanguageDrawerOpen(false);
        return;
      }
      setLocaleCookie(locale);
      setIsLanguageDrawerOpen(false);
      window.location.reload();
    },
    [currentLocale]
  );

  // ESC 키로 메뉴 닫기 + body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLanguageDrawerOpen) {
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
  }, [isOpen, isLanguageDrawerOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className={styles.overlay} role="dialog" aria-modal="true">
        {/* Header */}
        <header className={styles.header}>
          <span className={styles.logo}>관상스포</span>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={tCommon("close", { default: "닫기" })}
          >
            <CloseIcon />
          </button>
        </header>

        {/* Content */}
        <div className={styles.content}>
          {user && (
            <div className={styles.profileCard}>
              <p className={styles.loginInfo}>{getLoginProviderMessage()}</p>
              <p className={styles.email}>{user.email}</p>
            </div>
          )}

          <ul className={styles.menuList}>
            <li>
              <button
                type="button"
                className={styles.menuItem}
                onClick={handleLanguageOpen}
              >
                <span className={styles.menuItemText}>
                  {t("languageChange", { default: "언어 변경" })}
                </span>
                <ChevronRightIcon />
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
                    <span className={styles.menuItemText}>
                      {t("logout", { default: "로그아웃" })}
                    </span>
                    <ChevronRightIcon />
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => setShowWithdrawModal(true)}
                  >
                    <span className={styles.menuItemText}>
                      {t("withdraw", { default: "회원탈퇴" })}
                    </span>
                    <ChevronRightIcon />
                  </button>
                </li>
              </>
            ) : (
              <li>
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => handleNavigate("/face-spoiler/login")}
                >
                  <span className={styles.menuItemText}>
                    {t("login", { default: "로그인" })}
                  </span>
                  <ChevronRightIcon />
                </button>
              </li>
            )}
          </ul>
        </div>

        <footer className={styles.footer}>
          <div className={styles.footerLinks}>
            <Link
              href="/face-spoiler/policy/terms"
              className={styles.footerLink}
              onClick={onClose}
            >
              {t("terms", { default: "이용약관" })}
            </Link>
            <span className={styles.footerDivider}>|</span>
            <Link
              href="/face-spoiler/policy/privacy"
              className={styles.footerLink}
              onClick={onClose}
            >
              {t("privacy", { default: "개인정보 처리방침" })}
            </Link>
          </div>
        </footer>
      </div>

      <MenuLanguageDrawer
        isOpen={isLanguageDrawerOpen}
        currentLocale={currentLocale}
        onClose={handleLanguageClose}
        onSelect={handleLanguageSelect}
      />

      {showWithdrawModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => !isWithdrawing && setShowWithdrawModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <AlertCircleIcon />
                <h2 className={styles.modalTitle}>
                  {t("withdrawModal.title", {
                    default: "정말 탈퇴하시겠어요?",
                  })}
                </h2>
              </div>
              <p className={styles.modalDescription}>
                {t("withdrawModal.description", {
                  default:
                    "탈퇴 시 모든 프로필과 관상 리포트가 삭제되며 복구할 수 없습니다.",
                })}
              </p>
            </div>
            <div className={styles.modalButtons}>
              <button
                type="button"
                className={styles.modalCancelButton}
                onClick={() => setShowWithdrawModal(false)}
                disabled={isWithdrawing}
              >
                {tCommon("cancel", { default: "취소" })}
              </button>
              <button
                type="button"
                className={styles.modalConfirmButton}
                onClick={handleWithdraw}
                disabled={isWithdrawing}
              >
                {isWithdrawing
                  ? t("withdrawModal.withdrawing", { default: "탈퇴 중..." })
                  : t("withdrawModal.confirm", { default: "탈퇴하기" })}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
