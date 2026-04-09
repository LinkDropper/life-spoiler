"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { HeaderClient } from "@/components/landing";
import { useAuthStatus } from "@/libs/stores/user";

import styles from "./page.module.css";

interface Package {
  id: string;
  name: string;
  description: string;
  bonus?: string;
  price: string;
}

export default function PackagesPage() {
  const t = useTranslations("packages");
  const router = useRouter();
  const authStatus = useAuthStatus();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
    }
  }, [authStatus, router]);

  const packages: Package[] = [
    {
      id: "starter",
      name: t("starter.name"),
      description: t("starter.description"),
      price: t("starter.price"),
    },
    {
      id: "best",
      name: t("best.name"),
      description: t("best.description"),
      bonus: t("best.bonus"),
      price: t("best.price"),
    },
    {
      id: "mania",
      name: t("mania.name"),
      description: t("mania.description"),
      bonus: t("mania.bonus"),
      price: t("mania.price"),
    },
  ];

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  if (authStatus === "loading" || authStatus === "unauthenticated") {
    return null;
  }

  return (
    <div className={styles.page}>
      <HeaderClient />

      <section className={styles.titleSection}>
        <h1 className={styles.title}>{t("title")}</h1>
      </section>

      <div className={styles.packageList}>
        {packages.map((pkg) => (
          <button
            key={pkg.id}
            type="button"
            className={`${styles.packageCard} ${selectedId === pkg.id ? styles.packageCardSelected : ""}`}
            onClick={() => handleSelect(pkg.id)}
          >
            <div className={styles.packageInfo}>
              <span className={styles.packageName}>{pkg.name}</span>
              <span className={styles.packageDescription}>
                {pkg.description}
                {pkg.bonus && (
                  <span className={styles.packageBonus}>{` ${pkg.bonus}`}</span>
                )}
              </span>
            </div>
            <span className={styles.packagePrice}>{pkg.price}</span>
          </button>
        ))}
      </div>

      <div className={styles.bottomBar}>
        <button
          type="button"
          className={styles.backButton}
          onClick={handleBack}
        >
          <ChevronLeftIcon />
        </button>
        <button
          type="button"
          className={styles.submitButton}
          disabled={!selectedId}
          onClick={() => {
            if (selectedId) {
              router.push(`/payment/star/${selectedId}`);
            }
          }}
        >
          {t("selectButton")}
        </button>
      </div>
    </div>
  );
}

const ChevronLeftIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15 18L9 12L15 6"
      stroke="#2D1B4E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
