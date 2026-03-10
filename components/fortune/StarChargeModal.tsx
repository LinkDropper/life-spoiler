"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useUser } from "@/libs/stores/user";

import styles from "./StarChargeModal.module.css";

type FortuneType = "lifetime" | "yearly" | "compatibility";

interface StarChargeModalProps {
  fortuneLabel: string;
  fortuneType: FortuneType;
  profileId: string;
  /** 결과 페이지 경로 (별조각 차감 성공 시 이동) */
  resultPath: string;
  year?: number;
  onClose: () => void;
}

const STAR_COST = 3;

const StarIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 1.5L9.85 5.85L14.5 6.35L11 9.55L11.95 14.1L8 11.7L4.05 14.1L5 9.55L1.5 6.35L6.15 5.85L8 1.5Z"
      fill="white"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15 5L5 15M5 5L15 15"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const StarChargeModal = ({
  fortuneLabel,
  fortuneType,
  profileId,
  resultPath,
  year,
  onClose,
}: StarChargeModalProps) => {
  const router = useRouter();
  const user = useUser();
  const tModal = useTranslations("fortune.starChargeModal");
  const [balance, setBalance] = useState<number | null>(null);
  const spendAttemptedRef = useRef(false);

  useEffect(() => {
    if (!user?.id) return;

    const fetchBalance = async () => {
      try {
        const response = await fetch("/api/wallet/balance");
        if (response.ok) {
          const data = await response.json();
          setBalance(data.balance ?? 0);
        }
      } catch {
        setBalance(0);
      }
    };

    fetchBalance();
  }, [user?.id]);

  // 잔액이 충분하면 자동으로 별조각 차감 시도 (1회만)
  useEffect(() => {
    if (balance === null || balance < STAR_COST || spendAttemptedRef.current)
      return;

    spendAttemptedRef.current = true;

    const spendStars = async () => {
      try {
        const response = await fetch("/api/wallet/spend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fortuneType, profileId, year }),
        });

        if (response.ok) {
          router.push(resultPath);
          return;
        }
      } catch {
        // 실패 시 모달 유지
      }
      // 실패 시 잔액 부족 모달 표시
      setBalance(0);
    };

    spendStars();
  }, [balance, fortuneType, profileId, year, resultPath, router]);

  const handleCharge = () => {
    // 결제 완료 후 돌아올 경로를 sessionStorage에 저장
    try {
      sessionStorage.setItem("starChargeReturnPath", resultPath);
    } catch {
      // sessionStorage 사용 불가 시 무시
    }
    router.push("/packages");
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 잔액 로딩 중이거나 차감 진행 중이면 모달 표시하지 않음
  if (balance === null || balance >= STAR_COST) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.titleRow}>
              <h2 className={styles.title}>{fortuneLabel}</h2>
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
              >
                <CloseIcon />
              </button>
            </div>
            <div className={styles.balanceRow}>
              <span className={styles.balanceLabel}>
                {tModal("balanceLabel")}
              </span>
              <div className={styles.balanceValue}>
                <StarIcon />
                <span className={styles.balanceCount}>{balance}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className={styles.chargeButton}
            onClick={handleCharge}
          >
            {tModal("chargeButton")}
          </button>
        </div>
      </div>
    </div>
  );
};
