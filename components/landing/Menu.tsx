"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

import { ConfirmSheet } from "@/components/common/sheet";
import {
  getFortuneHref,
  isFortuneOwned,
  pickOwnProfile,
} from "@/libs/home/home-profile";
import { buildMenuLineup, summarizeCoupons } from "@/libs/home/menu-lineup";
import type { MenuCouponItem, MenuShow } from "@/libs/home/menu-lineup";
import { useProfiles } from "@/libs/stores/profile";
import { useUser, useUserActions } from "@/libs/stores/user";

import { LanguageSelector } from "./LanguageSelector";
import styles from "./Menu.module.css";

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
}

type CouponState =
  | { status: "loading" }
  | { status: "loaded"; count: number; earliestExpiry: string | null }
  | { status: "error" };

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Chevron = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    aria-hidden="true"
    className={styles.chevron}
  >
    <path
      d="M6 3l5 5-5 5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}.${month}.${day}`;
};

interface TicketField {
  label: string;
  value: string;
}

interface TicketProps {
  href: string;
  kind: string;
  count: string;
  title: string;
  fields: TicketField[];
  action: string;
  tone: "feature" | "coupon";
  onNavigate: () => void;
}

/** 실물 영화표: 본문 + 점선으로 나뉜 꼬리표, 절취선 위아래와 왼쪽 가장자리의 홈 */
const Ticket = ({
  href,
  kind,
  count,
  title,
  fields,
  action,
  tone,
  onNavigate,
}: TicketProps) => (
  <Link
    href={href}
    className={`${styles.ticket} ${tone === "coupon" ? styles.ticketCoupon : ""}`}
    onClick={onNavigate}
  >
    <span className={styles.ticketBody}>
      <span className={styles.ticketKind}>
        {kind}
        <span className={styles.ticketCount}>{count}</span>
      </span>
      <strong className={styles.ticketTitle}>{title}</strong>
      <span className={styles.ticketFields}>
        {fields.map((field) => (
          <span key={field.label} className={styles.ticketField}>
            <span className={styles.ticketFieldLabel}>{field.label}</span>
            <span className={styles.ticketFieldValue}>{field.value}</span>
          </span>
        ))}
      </span>
    </span>
    <span className={styles.ticketStub}>
      <span className={styles.barcode} aria-hidden="true" />
      <span className={styles.ticketAction}>
        {action}
        <Chevron size={12} />
      </span>
    </span>
  </Link>
);

export const Menu = ({ isOpen, onClose }: MenuProps) => {
  const t = useTranslations("landing.menu");
  const tHome = useTranslations("home");
  const tUniverse = useTranslations("universe.home");
  const tFooter = useTranslations("landing.footer");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const user = useUser();
  const profiles = useProfiles();
  const { logout } = useUserActions();

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<CouponState>({ status: "loading" });

  const isLoggedIn = Boolean(user);
  const profile = isLoggedIn ? pickOwnProfile(profiles) : null;
  const lineup = buildMenuLineup({
    profile,
    isLoggedIn,
    showUniverse: locale === "ko",
  });
  const ownsLifetime = isFortuneOwned(profile, "lifetime");

  const getLoginProviderMessage = () => {
    if (!user) return "";

    const providerMessages: Record<string, string> = {
      google: t("loginViaGoogle"),
      kakao: t("loginViaKakao"),
    };

    return providerMessages[user.provider] ?? t("loggedIn");
  };

  const getShowTitle = (show: MenuShow) => {
    if (show.key === "daily") return t("daily.title");
    if (show.key === "universe") return tUniverse("title");
    return tHome(`${show.key}.title`);
  };

  const getShowSubtitle = (show: MenuShow) => {
    if (show.key === "daily") return t("daily.subtitle");
    if (show.key === "universe") return tUniverse("subtitle");
    return tHome(`${show.key}.subtitle`);
  };

  const getStatusLabel = (show: MenuShow) => {
    if (show.status === "owned") return tHome("timetable.owned");
    if (show.status === "free") return tHome("timetable.free");
    if (show.status === "trailer") return t("trailerFree");
    return null;
  };

  // 메뉴를 열 때마다 쿠폰 수를 새로 받는다(쿠폰함에서 쓰고 돌아올 수 있다)
  useEffect(() => {
    if (!isOpen || !isLoggedIn) {
      return;
    }

    const controller = new AbortController();
    setCoupons({ status: "loading" });

    fetch("/api/coupon/list", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`쿠폰 목록 요청 실패: ${response.status}`);
        }
        const result = (await response.json()) as {
          success?: boolean;
          data?: MenuCouponItem[];
        };
        if (!result.success || !Array.isArray(result.data)) {
          throw new Error("쿠폰 목록 응답 형식이 올바르지 않습니다.");
        }
        setCoupons({ status: "loaded", ...summarizeCoupons(result.data) });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        console.error("[menu] 쿠폰 목록을 불러오지 못했습니다.", error);
        setCoupons({ status: "error" });
      });

    return () => controller.abort();
  }, [isOpen, isLoggedIn]);

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

  const handleOpenWithdraw = useCallback(() => {
    setWithdrawError(null);
    setShowWithdrawModal(true);
  }, []);

  const handleCloseWithdraw = useCallback(() => {
    setShowWithdrawModal(false);
  }, []);

  const handleWithdraw = useCallback(async () => {
    setIsWithdrawing(true);
    setWithdrawError(null);

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
        // 서버 문구는 언어가 섞일 수 있어 번역된 고정 문구만 보여 준다
        console.error("회원탈퇴 실패:", response.status);
        setWithdrawError(t("withdrawError"));
      }
    } catch (error) {
      console.error("회원탈퇴 실패:", error);
      setWithdrawError(t("withdrawError"));
    } finally {
      setIsWithdrawing(false);
    }
  }, [logout, onClose, router, t]);

  // ESC로 닫기, 열려 있는 동안 배경 스크롤 잠금, 열리면 닫기 버튼에 포커스
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !showWithdrawModal) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, showWithdrawModal]);

  // Tab 포커스를 메뉴 안에 가둔다
  const handleDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab" || !dialogRef.current) {
      return;
    }
    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    );
    const [first] = focusable;
    const last = focusable.at(-1);
    if (!first || !last) {
      return;
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const renderCouponTicket = () => {
    const count = coupons.status === "loaded" ? coupons.count : null;
    // 불러오는 중이면 안내, 실패하면 값을 비우고(—), 받았으면 가장 빠른 기한
    const getExpiryLabel = () => {
      if (coupons.status === "loading") return t("ticket.couponLoading");
      if (coupons.status === "error") return "—";
      return coupons.earliestExpiry
        ? formatDate(coupons.earliestExpiry)
        : t("ticket.couponNoExpiry");
    };

    return (
      <Ticket
        href="/coupon"
        tone="coupon"
        kind={t("ticket.couponKind")}
        count={t("ticket.count")}
        title={
          count === null
            ? t("ticket.couponAction")
            : t("ticket.couponTitle", { count })
        }
        fields={[
          { label: t("ticket.couponUse"), value: t("ticket.couponUseValue") },
          {
            label: t("ticket.couponExpiry"),
            value: getExpiryLabel(),
          },
        ]}
        action={t("ticket.couponAction")}
        onNavigate={onClose}
      />
    );
  };

  return (
    <>
      <div
        className={`${styles.root} ${isOpen ? styles.rootOpen : ""}`}
        aria-hidden={!isOpen}
      >
        <div className={styles.backdrop} onClick={onClose} />
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={t("dialogLabel")}
          className={styles.panel}
          onKeyDown={handleDialogKeyDown}
        >
          <header className={styles.header}>
            <Link
              href={isLoggedIn ? "/home" : "/"}
              className={styles.logoLink}
              onClick={onClose}
            >
              <Image
                src="/images/landing/logo.png"
                alt={t("logoAlt")}
                width={87}
                height={32}
                quality={100}
              />
            </Link>
            <button
              ref={closeButtonRef}
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label={tCommon("close")}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </header>

          <div className={styles.content}>
            {profile && (
              <Link
                href="/home"
                className={styles.nowShowing}
                onClick={onClose}
              >
                <span className={styles.nowShowingDot} aria-hidden="true" />
                <span className={styles.nowShowingText}>
                  <b>{t("nowShowing", { name: profile.name })}</b>{" "}
                  <span className={styles.nowShowingStatus}>
                    {t("nowShowingStatus")}
                  </span>
                </span>
                <span className={styles.nowShowingAction}>
                  {t("toTheater")}
                  <Chevron size={14} />
                </span>
              </Link>
            )}

            <section
              className={styles.section}
              aria-labelledby="menu-timetable-title"
            >
              <h2 id="menu-timetable-title" className={styles.sectionTitle}>
                {t("timetableTitle")}
              </h2>
              <ul className={styles.timetable}>
                {lineup.map((show) => {
                  const statusLabel = getStatusLabel(show);
                  return (
                    <li key={show.key}>
                      <Link
                        href={show.href}
                        className={styles.row}
                        onClick={onClose}
                      >
                        <span className={styles.slot}>
                          {t(`slot.${show.key}`, {
                            year: new Date().getFullYear(),
                          })}
                        </span>
                        <span className={styles.rowText}>
                          <b className={styles.rowTitle}>
                            {getShowTitle(show)}
                          </b>
                          <span className={styles.rowSubtitle}>
                            {getShowSubtitle(show)}
                          </span>
                        </span>
                        {statusLabel ? (
                          <span
                            className={
                              show.status === "owned"
                                ? styles.statusOwned
                                : styles.statusFree
                            }
                          >
                            {statusLabel}
                          </span>
                        ) : (
                          <span />
                        )}
                        <Chevron />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section
              className={styles.section}
              aria-labelledby="menu-tickets-title"
            >
              <h2 id="menu-tickets-title" className={styles.sectionTitle}>
                {t("ticketsTitle")}
              </h2>
              {isLoggedIn ? (
                <div className={styles.tickets}>
                  {profile && ownsLifetime && (
                    <Ticket
                      href={getFortuneHref(profile, "lifetime")}
                      tone="feature"
                      kind={t("ticket.featureKind")}
                      count={t("ticket.count")}
                      title={tHome("lifetime.title")}
                      fields={[
                        {
                          label: t("ticket.screening"),
                          value: t("ticket.screeningValue"),
                        },
                        {
                          label: t("ticket.viewer"),
                          value: t("ticket.viewerValue", {
                            name: profile.name,
                          }),
                        },
                        {
                          label: t("ticket.status"),
                          value: t("ticket.statusOwned"),
                        },
                      ]}
                      action={t("ticket.rewatch")}
                      onNavigate={onClose}
                    />
                  )}
                  {renderCouponTicket()}
                </div>
              ) : (
                <div className={styles.guestTickets}>
                  <p className={styles.guestText}>{t("guestTickets")}</p>
                  <Link
                    href="/login"
                    className={styles.loginButton}
                    onClick={onClose}
                  >
                    {t("login")}
                  </Link>
                </div>
              )}
            </section>

            <footer className={styles.footer}>
              {user && (
                <p className={styles.account}>
                  {getLoginProviderMessage()} · {user.email}
                </p>
              )}
              <div className={styles.footerActions}>
                <LanguageSelector variant="labeled" />
                {user && (
                  <>
                    <button
                      type="button"
                      className={styles.footerButton}
                      onClick={handleLogout}
                    >
                      {t("logout")}
                    </button>
                    <button
                      type="button"
                      className={`${styles.footerButton} ${styles.footerButtonFaint}`}
                      onClick={handleOpenWithdraw}
                    >
                      {t("withdraw")}
                    </button>
                  </>
                )}
              </div>
              <div className={styles.policyLinks}>
                <Link
                  href="/policy/terms"
                  className={styles.policyLink}
                  onClick={onClose}
                >
                  {tFooter("terms")}
                </Link>
                <Link
                  href="/policy/privacy"
                  className={styles.policyLink}
                  onClick={onClose}
                >
                  {tFooter("privacy")}
                </Link>
              </div>
            </footer>
          </div>
        </div>
      </div>

      <ConfirmSheet
        isOpen={showWithdrawModal}
        onClose={handleCloseWithdraw}
        onConfirm={handleWithdraw}
        eyebrow="WITHDRAW"
        title={t("withdrawModal.title")}
        description={t("withdrawModal.description")}
        cancelLabel={tCommon("cancel")}
        confirmLabel={t("withdrawModal.confirm")}
        busyLabel={t("withdrawModal.withdrawing")}
        isBusy={isWithdrawing}
        errorMessage={withdrawError}
      />
    </>
  );
};
