/**
 * Google Analytics 유틸리티
 */

// gtag 타입 선언
declare global {
  interface Window {
    gtag?: {
      (
        command: "config",
        targetId: string,
        config?: Record<string, unknown>
      ): void;
      (
        command: "event",
        eventName: string,
        eventParams?: Record<string, unknown>
      ): void;
      (command: "js", date: Date): void;
    };
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// GA가 활성화되어 있는지 확인
export const isGAEnabled = (): boolean => {
  return (
    !!GA_MEASUREMENT_ID &&
    process.env.NODE_ENV === "production" &&
    typeof window !== "undefined" &&
    !!window.gtag
  );
};

// 페이지뷰 추적
export const trackPageView = (url: string) => {
  if (!isGAEnabled()) {
    console.log("[GA Debug] Page view:", url);
    return;
  }

  window.gtag?.("config", GA_MEASUREMENT_ID!, {
    page_path: url,
  });
};

// 결제 완료 이벤트 추적
interface PurchaseParams {
  transaction_id: string;
  value: number;
  currency: string;
  items: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
  }>;
  [key: string]: unknown;
}

export const trackPurchase = (params: PurchaseParams) => {
  if (!isGAEnabled()) {
    console.log("[GA Debug] Purchase event:", params);
    return;
  }

  window.gtag?.("event", "purchase", params as Record<string, unknown>);
};
