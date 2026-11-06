"use client";

import { useEffect, useState } from "react";

import {
  IntermissionScreen,
  errorPageStyles,
} from "@/components/common/error-page";
import {
  GLOBAL_ERROR_MESSAGES,
  pickGlobalErrorLocale,
} from "@/components/common/error-page/global-error-messages";
import type { Locale } from "@/i18n/config";
import { logger } from "@/libs/logger";

import "./globals.css";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * 루트 레이아웃까지 깨진 오류. 헤더·번역 Provider 없이 같은 INTERMISSION을 최소로 그린다.
 * 문구는 브라우저 언어로 고른다.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const [locale, setLocale] = useState<Locale>("ko");
  const messages = GLOBAL_ERROR_MESSAGES[locale];

  useEffect(() => {
    setLocale(pickGlobalErrorLocale(navigator.language));
  }, []);

  useEffect(() => {
    logger.error("루트 레이아웃에서 처리하지 못한 오류", error, {
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang={locale}>
      <body>
        <div className={errorPageStyles.page}>
          <IntermissionScreen
            intermission={messages.intermission}
            title={messages.title}
            description={messages.desc}
            codeText={error.digest ? messages.code(error.digest) : undefined}
            retryLabel={messages.retry}
            homeLabel={messages.home}
            onRetry={reset}
          />
        </div>
      </body>
    </html>
  );
}
