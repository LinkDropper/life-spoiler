"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import {
  IntermissionScreen,
  errorPageStyles,
} from "@/components/common/error-page";
import { HeaderClient } from "@/components/landing";
import { logger } from "@/libs/logger";

interface AppErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** 페이지 안에서 처리하지 못한 오류 = 상영 중단(INTERMISSION) */
export default function AppError({ error, reset }: AppErrorProps) {
  const t = useTranslations("errorPage.error");

  useEffect(() => {
    logger.error("화면을 그리다 처리하지 못한 오류", error, {
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className={errorPageStyles.page}>
      <HeaderClient />
      <IntermissionScreen
        intermission={t("intermission")}
        title={t("title")}
        description={t("desc")}
        codeText={error.digest ? t("code", { code: error.digest }) : undefined}
        retryLabel={t("retry")}
        homeLabel={t("home")}
        onRetry={reset}
      />
    </div>
  );
}
