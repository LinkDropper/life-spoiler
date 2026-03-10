"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import { HeaderClient } from "@/components/landing";
import {
  CompatibilityFortuneCard,
  LifetimeFortuneCard,
  PastLifeCard,
  YearlyFortuneCard,
} from "@/components/home";
import { useAuthStatus } from "@/libs/stores/user";

import styles from "./page.module.css";

export default function HomePage() {
  const router = useRouter();
  const authStatus = useAuthStatus();

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
    }
  }, [authStatus, router]);

  const handleLifetimeFortune = useCallback(() => {
    router.push("/profiles?type=lifetime");
  }, [router]);

  const handleYearlyFortune = useCallback(() => {
    router.push("/profiles?type=yearly");
  }, [router]);

  const handleCompatibilityFortune = useCallback(() => {
    router.push("/compatibility");
  }, [router]);

  const handlePastLifeFortune = useCallback(() => {
    router.push("/profiles?type=past-life");
  }, [router]);

  if (authStatus === "loading" || authStatus === "unauthenticated") {
    return null;
  }

  return (
    <div className={styles.page}>
      <HeaderClient />
      <main className={styles.main}>
        <LifetimeFortuneCard onClick={handleLifetimeFortune} />
        <YearlyFortuneCard onClick={handleYearlyFortune} />
        <CompatibilityFortuneCard onClick={handleCompatibilityFortune} />
        <PastLifeCard onClick={handlePastLifeFortune} />
      </main>
    </div>
  );
}
