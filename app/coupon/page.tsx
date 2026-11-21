"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

import { HeaderClient } from "@/components/landing";
import { useAuthStatus } from "@/libs/stores/user";

import styles from "./page.module.css";

interface CouponItem {
  id: string;
  code: string;
  benefitType: "free_fortune" | "discount";
  fortuneType: string;
  discountPercent: number | null;
  status: "active" | "used" | "expired";
  validUntil: string | null;
  campaignName: string | null;
  createdAt: string;
}

const FORTUNE_TYPE_LABEL: Record<string, string> = {
  all: "전체 운세",
  lifetime: "인생 운세",
  yearly: "연간 운세",
  compatibility: "궁합 운세",
  past_life: "전생 운세",
  yearly_2027: "내년 운세",
};

const STATUS_LABEL: Record<string, string> = {
  active: "사용 가능",
  used: "사용 완료",
  expired: "기간 만료",
};

const formatBenefit = (coupon: CouponItem): string => {
  if (coupon.benefitType === "free_fortune") {
    return "무료 운세 1회";
  }
  if (coupon.benefitType === "discount" && coupon.discountPercent) {
    return `${coupon.discountPercent}% 할인`;
  }
  return "쿠폰 혜택";
};

const formatDate = (dateStr: string | null): string | null => {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  } catch {
    return null;
  }
};

export default function CouponPage() {
  const router = useRouter();
  const authStatus = useAuthStatus();

  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
    }
  }, [authStatus, router]);

  useEffect(() => {
    const fetchCoupons = async () => {
      if (authStatus !== "authenticated") return;

      try {
        const response = await fetch("/api/coupon/list");
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          setCoupons(result.data);
        }
      } catch {
        // 쿠폰 목록 로딩 실패 시 빈 목록 유지
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoupons();
  }, [authStatus]);

  const handleCopyCode = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);

      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }

      setShowToast(true);
      toastTimerRef.current = setTimeout(() => {
        setShowToast(false);
      }, 2000);
    } catch {
      // 클립보드 복사 실패 시 무시
    }
  }, []);

  const handleGoHome = useCallback(() => {
    router.push("/home");
  }, [router]);

  if (authStatus === "loading" || authStatus === "unauthenticated") {
    return null;
  }

  return (
    <div className={styles.page}>
      <HeaderClient />

      {showToast && (
        <div className={styles.toast} role="status" aria-live="polite">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6.00004 10.78L3.22004 8L2.27337 8.94L6.00004 12.6667L14 4.66667L13.06 3.72667L6.00004 10.78Z"
              fill="white"
            />
          </svg>
          <span className={styles.toastText}>복사되었습니다</span>
        </div>
      )}

      <main className={styles.main}>
        <h1 className={styles.pageTitle}>쿠폰함</h1>

        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} aria-label="로딩 중" />
          </div>
        ) : coupons.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyMessage}>
              {
                "아직 쿠폰이 없어요.\n친구를 초대하고 무료 운세 쿠폰을 받아보세요!"
              }
            </p>
            <button
              type="button"
              className={styles.emptyButton}
              onClick={handleGoHome}
            >
              친구 초대하기
            </button>
          </div>
        ) : (
          coupons.map((coupon) => {
            const isInactive =
              coupon.status === "used" || coupon.status === "expired";
            const formattedDate = formatDate(coupon.validUntil);
            const fortuneLabel =
              FORTUNE_TYPE_LABEL[coupon.fortuneType] ?? coupon.fortuneType;

            return (
              <div
                key={coupon.id}
                className={`${styles.couponCard} ${isInactive ? styles.couponCardInactive : ""}`}
              >
                <div className={styles.couponHeader}>
                  <p className={styles.couponBenefit}>
                    {formatBenefit(coupon)}
                  </p>
                  <span
                    className={`${styles.badge} ${coupon.status === "active" ? styles.badgeActive : styles.badgeInactive}`}
                  >
                    {STATUS_LABEL[coupon.status] ?? coupon.status}
                  </span>
                </div>

                <div className={styles.couponCodeRow}>
                  <span className={styles.couponCode}>{coupon.code}</span>
                  {coupon.status === "active" && (
                    <button
                      type="button"
                      className={styles.copyButton}
                      onClick={() => handleCopyCode(coupon.code)}
                      aria-label={`쿠폰 코드 ${coupon.code} 복사`}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 18 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M15 6.75H8.25C7.42157 6.75 6.75 7.42157 6.75 8.25V15C6.75 15.8284 7.42157 16.5 8.25 16.5H15C15.8284 16.5 16.5 15.8284 16.5 15V8.25C16.5 7.42157 15.8284 6.75 15 6.75Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M3.75 11.25H3C2.60218 11.25 2.22064 11.092 1.93934 10.8107C1.65804 10.5294 1.5 10.1478 1.5 9.75V3C1.5 2.60218 1.65804 2.22064 1.93934 1.93934C2.22064 1.65804 2.60218 1.5 3 1.5H9.75C10.1478 1.5 10.5294 1.65804 10.8107 1.93934C11.092 2.22064 11.25 2.60218 11.25 3V3.75"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                <div className={styles.couponMeta}>
                  {formattedDate && (
                    <span className={styles.couponMetaText}>
                      ~{formattedDate}까지
                    </span>
                  )}
                  {formattedDate && (
                    <span className={styles.metaDivider} aria-hidden="true" />
                  )}
                  <span className={styles.couponMetaText}>{fortuneLabel}</span>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
