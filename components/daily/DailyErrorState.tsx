"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { HeaderClient } from "@/components/landing";

import styles from "./DailyFortuneScreen.module.css";

/** 서버에서 결과를 만들지 못했을 때(계산 실패·사전 미스 등). 임의 결과로 대체하지 않고 재시도만 제공한다 */
export const DailyErrorState = () => {
  const t = useTranslations("daily.result");
  const router = useRouter();

  return (
    <div className={styles.page}>
      <HeaderClient />
      <main className={styles.main}>
        <div className={styles.errorBox} role="alert">
          <p className={styles.errorText}>{t("errorMessage")}</p>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => router.refresh()}
          >
            {t("retry")}
          </button>
        </div>
      </main>
    </div>
  );
};
