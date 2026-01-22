"use client";

import Script from "next/script";
import { GA_MEASUREMENT_ID } from "@/libs/analytics";

/**
 * Google Analytics 스크립트 컴포넌트
 * 프로덕션 환경에서만 활성화됩니다.
 */
export default function GoogleAnalytics() {
  // GA ID가 없거나 개발 환경이면 렌더링하지 않음
  if (!GA_MEASUREMENT_ID || process.env.NODE_ENV !== "production") {
    return null;
  }

  return (
    <>
      {/* Google Analytics gtag.js 로드 */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />

      {/* GA 초기화 */}
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
