"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useCallback, useEffect } from "react";

import { useUser } from "@/libs/stores/user";

import styles from "./Menu.module.css";
import { SettingsDrawer } from "./SettingsDrawer";

const SettingsIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.1667 12.5C16.0557 12.7513 16.0226 13.0302 16.0716 13.3005C16.1207 13.5708 16.2495 13.8203 16.4417 14.0167L16.4917 14.0667C16.6466 14.2215 16.7695 14.4053 16.8534 14.6076C16.9373 14.8099 16.9805 15.0268 16.9805 15.2458C16.9805 15.4649 16.9373 15.6817 16.8534 15.8841C16.7695 16.0864 16.6466 16.2702 16.4917 16.425C16.3369 16.5799 16.1531 16.7028 15.9507 16.7867C15.7484 16.8706 15.5316 16.9138 15.3125 16.9138C15.0934 16.9138 14.8766 16.8706 14.6743 16.7867C14.4719 16.7028 14.2881 16.5799 14.1333 16.425L14.0833 16.375C13.887 16.1828 13.6374 16.054 13.3671 16.005C13.0968 15.9559 12.818 15.989 12.5667 16.1C12.3203 16.2056 12.1124 16.3812 11.9674 16.6057C11.8225 16.8302 11.7469 17.0935 11.75 17.3625V17.5C11.75 17.942 11.5744 18.366 11.2631 18.6773C10.9518 18.9887 10.5278 19.1642 10.0858 19.1642C9.6439 19.1642 9.21987 18.9887 8.90856 18.6773C8.59725 18.366 8.42167 17.942 8.42167 17.5V17.425C8.41834 17.148 8.33124 16.879 8.17254 16.6538C8.01385 16.4285 7.79138 16.2578 7.53334 16.1633C7.28209 16.0524 7.00326 16.0192 6.73293 16.0683C6.4626 16.1173 6.21305 16.2461 6.01667 16.4383L5.96667 16.4883C5.81188 16.6432 5.62806 16.7662 5.42573 16.85C5.2234 16.9339 5.00654 16.9771 4.7875 16.9771C4.56846 16.9771 4.3516 16.9339 4.14927 16.85C3.94694 16.7662 3.76312 16.6432 3.60834 16.4883C3.45345 16.3336 3.33052 16.1497 3.24665 15.9474C3.16277 15.7451 3.11954 15.5282 3.11954 15.3092C3.11954 15.0901 3.16277 14.8733 3.24665 14.6709C3.33052 14.4686 3.45345 14.2848 3.60834 14.13L3.65834 14.08C3.85052 13.8836 3.97934 13.6341 4.02837 13.3638C4.0774 13.0934 4.04428 12.8146 3.93334 12.5633C3.82779 12.317 3.65215 12.109 3.42768 11.9641C3.20322 11.8191 2.93985 11.7435 2.67084 11.7467H2.53334C2.09139 11.7467 1.66736 11.5711 1.35605 11.2598C1.04474 10.9485 0.869171 10.5244 0.869171 10.0825C0.869171 9.64055 1.04474 9.21652 1.35605 8.90521C1.66736 8.5939 2.09139 8.41833 2.53334 8.41833H2.60834C2.88534 8.41501 3.15436 8.3279 3.37961 8.16921C3.60486 8.01051 3.77555 7.78804 3.87 7.53C3.98095 7.27876 4.01407 6.99993 3.96504 6.7296C3.91601 6.45927 3.78719 6.20972 3.595 6.01333L3.545 5.96333C3.39011 5.80855 3.26718 5.62473 3.18331 5.4224C3.09943 5.22007 3.0562 5.00321 3.0562 4.78417C3.0562 4.56513 3.09943 4.34827 3.18331 4.14594C3.26718 3.94361 3.39011 3.75978 3.545 3.605C3.69978 3.45011 3.88361 3.32718 4.08594 3.24331C4.28827 3.15943 4.50513 3.1162 4.72417 3.1162C4.94321 3.1162 5.16007 3.15943 5.3624 3.24331C5.56473 3.32718 5.74855 3.45011 5.90334 3.605L5.95334 3.655C6.14972 3.84719 6.39927 3.97601 6.6696 4.02504C6.93993 4.07407 7.21876 4.04095 7.47 3.93V3.86667C7.57556 3.62035 7.75119 3.41238 7.97566 3.26741C8.20012 3.12244 8.46349 3.04688 8.7325 3.05H8.83334C8.83334 2.608 9.00893 2.18402 9.32024 1.87271C9.63155 1.5614 10.0556 1.38583 10.4975 1.38583C10.9395 1.38583 11.3635 1.5614 11.6748 1.87271C11.9861 2.18402 12.1617 2.608 12.1617 3.05V3.125C12.1648 3.39401 12.2404 3.65738 12.3853 3.88185C12.5303 4.10631 12.7383 4.28195 12.9846 4.3875C13.2359 4.49845 13.5147 4.53157 13.785 4.48254C14.0554 4.43351 14.3049 4.30469 14.5013 4.1125L14.5513 4.0625C14.7061 3.90761 14.8899 3.78468 15.0923 3.70081C15.2946 3.61693 15.5115 3.5737 15.7305 3.5737C15.9495 3.5737 16.1664 3.61693 16.3687 3.70081C16.5711 3.78468 16.7549 3.90761 16.9097 4.0625C17.0645 4.21728 17.1875 4.40111 17.2714 4.60344C17.3552 4.80577 17.3985 5.02263 17.3985 5.24167C17.3985 5.4607 17.3552 5.67757 17.2714 5.87989C17.1875 6.08222 17.0645 6.26605 16.9097 6.42083L16.8597 6.47083C16.6675 6.66722 16.5387 6.91677 16.4896 7.1871C16.4406 7.45743 16.4737 7.73626 16.5847 7.9875V8.05C16.6902 8.29632 16.8659 8.50429 17.0903 8.64926C17.3148 8.79423 17.5782 8.86979 17.8472 8.86667H18C18.442 8.86667 18.866 9.04224 19.1773 9.35355C19.4886 9.66486 19.6642 10.0889 19.6642 10.5308C19.6642 10.9728 19.4886 11.3968 19.1773 11.7081C18.866 12.0194 18.442 12.195 18 12.195H17.925C17.656 12.1982 17.3926 12.2737 17.1682 12.4187C16.9437 12.5637 16.7681 12.7716 16.6625 13.0179"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

  const handleCompatibilityNavigate = useCallback(() => {
    onClose();
    if (!user) {
      router.push("/login");
      return;
    }
    router.push("/compatibility");
  }, [onClose, router, user]);

  const handleSettingsOpen = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const handleSettingsClose = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  const handleMenuClose = useCallback(() => {
    setIsSettingsOpen(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else {
          onClose();
        }
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
  }, [isOpen, isSettingsOpen, onClose]);

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`}
        aria-hidden={!isOpen}
      >
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

        <div className={styles.content}>
          {user && (
            <button
              type="button"
              className={styles.profileCard}
              onClick={handleSettingsOpen}
            >
              <div className={styles.profileInfo}>
                <p className={styles.loginInfo}>
                  {getLoginProviderMessage(user.provider, t)}
                </p>
                <SettingsIcon />
              </div>
              <p className={styles.email}>{user.email}</p>
            </button>
          )}

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
            <li>
              <button
                type="button"
                className={styles.menuItem}
                onClick={handleCompatibilityNavigate}
              >
                <span className={styles.menuItemText}>
                  {t("compatibilityFortune")}
                </span>
                <Image
                  src="/images/landing/chevron-right.svg"
                  alt=""
                  width={20}
                  height={20}
                />
              </button>
            </li>
            {!user && (
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

        <footer className={styles.footer}>
          <div className={styles.footerLinks}>
            <button
              type="button"
              className={styles.footerLink}
              onClick={() => handleNavigate("/policy/terms")}
            >
              {tFooter("terms")}
            </button>
            <span className={styles.divider}>|</span>
            <button
              type="button"
              className={styles.footerLink}
              onClick={() => handleNavigate("/policy/privacy")}
            >
              {tFooter("privacy")}
            </button>
          </div>
        </footer>
      </div>

      {user && (
        <SettingsDrawer
          isOpen={isSettingsOpen}
          onClose={handleSettingsClose}
          onMenuClose={handleMenuClose}
        />
      )}
    </>
  );
};

const getLoginProviderMessage = (
  provider: string,
  t: ReturnType<typeof useTranslations>
): string => {
  const providerMessages: Record<string, string> = {
    google: t("loginViaGoogle"),
    kakao: t("loginViaKakao"),
  };
  return providerMessages[provider] ?? t("loggedIn");
};
