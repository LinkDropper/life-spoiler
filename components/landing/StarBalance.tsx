"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useUser } from "@/libs/stores/user";

import styles from "./StarBalance.module.css";

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

export const StarBalance = () => {
  const router = useRouter();
  const user = useUser();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setBalance(null);
      return;
    }

    const fetchBalance = async () => {
      try {
        const response = await fetch("/api/wallet/balance");
        if (response.ok) {
          const data = await response.json();
          setBalance(data.balance);
        }
      } catch {
        setBalance(0);
      }
    };

    fetchBalance();
  }, [user?.id]);

  if (!user?.id || balance === null) {
    return null;
  }

  return (
    <button
      type="button"
      className={styles.badge}
      onClick={() => router.push("/packages")}
    >
      <StarIcon />
      <span className={styles.count}>{balance}</span>
    </button>
  );
};
