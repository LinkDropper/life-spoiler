"use client";

import { Copy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { HeaderClient } from "@/components/landing";
import {
  formatInvitationDate,
  getInvitationHref,
  sortInvitations,
  toInvitationFilm,
  type CouponInvitation,
} from "@/libs/coupon/invitation";
import { useAuthStatus } from "@/libs/stores/user";
import { showToast } from "@/libs/toast";

import styles from "./page.module.css";

const HOW_TO_STEPS = ["step1", "step2", "step3"] as const;

/**
 * 쿠폰함 = 시사회 초대장 서랍 (2026-11-06).
 * 쓸 수 있는 초대장부터 보이고, 주 행동은 "그 운세 보러 가기"(결제 화면이 쿠폰을 자동으로 보여 준다).
 * 코드는 카드 안에 작게 남긴다. 없으면 초대장을 받는 방법 3단계.
 */
export default function CouponPage() {
  const router = useRouter();
  const authStatus = useAuthStatus();
  const t = useTranslations("coupon");

  const [coupons, setCoupons] = useState<CouponInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;

    const fetchCoupons = async () => {
      try {
        const response = await fetch("/api/coupon/list");
        const result: { success?: boolean; data?: CouponInvitation[] } =
          await response.json();
        if (result.success && Array.isArray(result.data)) {
          setCoupons(sortInvitations(result.data));
        }
      } catch {
        showToast({ kind: "error", message: t("loadError") });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCoupons();
  }, [authStatus, t]);

  const handleCopyCode = useCallback(
    async (code: string) => {
      try {
        await navigator.clipboard.writeText(code);
        showToast({ kind: "notice", message: t("copied") });
      } catch {
        showToast({ kind: "error", message: t("copyError") });
      }
    },
    [t]
  );

  const toBenefit = (coupon: CouponInvitation): string =>
    coupon.benefitType === "discount" && coupon.discountPercent
      ? t("benefit.discount", { percent: coupon.discountPercent })
      : t("benefit.free");

  const isPending =
    authStatus === "loading" || authStatus === "unauthenticated" || isLoading;

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={styles.main}>
        <header className={styles.head}>
          <span className={styles.kicker}>INVITATIONS</span>
          <h1 className={styles.title}>{t("title")}</h1>
          <p className={styles.desc}>
            {isPending || coupons.length > 0 ? t("desc") : t("emptyDesc")}
          </p>
        </header>

        {isPending ? (
          <p className={styles.status} role="status">
            {t("loading")}
          </p>
        ) : coupons.length === 0 ? (
          <>
            <section className={styles.empty}>
              <span className={styles.emptyCard} aria-hidden="true">
                PREMIERE
                <br />
                INVITATION
              </span>
              <b className={styles.emptyTitle}>{t("emptyTitle")}</b>
            </section>
            <ol className={styles.steps} aria-label={t("howToAria")}>
              {HOW_TO_STEPS.map((step, index) => (
                <li key={step}>
                  <span className={styles.stepNo} aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <b>{t(`howTo.${step}`)}</b>
                </li>
              ))}
            </ol>
            <Link href="/home" className={styles.primaryLink}>
              {t("emptyCta")}
            </Link>
          </>
        ) : (
          <ul className={styles.list}>
            {coupons.map((coupon) => {
              const isActive = coupon.status === "active";
              const film = t(`films.${toInvitationFilm(coupon.fortuneType)}`);
              const until = formatInvitationDate(coupon.validUntil);
              return (
                <li key={coupon.id}>
                  <article
                    className={`${styles.card} ${isActive ? styles.cardActive : styles.cardInactive}`}
                  >
                    <span className={styles.perforation} aria-hidden="true" />
                    <div className={styles.cardTop}>
                      <span className={styles.cardCode}>
                        PREMIERE INVITATION
                      </span>
                      {coupon.campaignName && (
                        <span className={styles.source}>
                          {coupon.campaignName}
                        </span>
                      )}
                    </div>
                    <div className={styles.cardBody}>
                      <b className={styles.benefit}>{toBenefit(coupon)}</b>
                      <span className={styles.meta}>
                        {film}
                        {until && ` · ${t("until", { date: until })}`}
                      </span>
                    </div>
                    {!isActive && (
                      <span className={styles.stamp}>
                        {t(`stamp.${coupon.status}`)}
                      </span>
                    )}
                    <span className={styles.srOnly}>
                      {t(`statusAria.${coupon.status}`)}
                    </span>
                    {isActive && (
                      <div className={styles.cardActions}>
                        <Link
                          href={getInvitationHref(coupon.fortuneType)}
                          className={styles.useLink}
                        >
                          {t("use", { film })}
                        </Link>
                        <button
                          type="button"
                          className={styles.codeButton}
                          onClick={() => handleCopyCode(coupon.code)}
                          aria-label={t("copyAria", { code: coupon.code })}
                        >
                          <span>{coupon.code}</span>
                          <Copy size={14} aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
