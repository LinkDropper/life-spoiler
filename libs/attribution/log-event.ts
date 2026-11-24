/**
 * utm_events 테이블 기록 (UTM 랜딩·회원가입·결제).
 */

import { insertLogRow } from "./insert-row";
import type { Attribution } from "./attribution";

type UtmEventType = "landing" | "signup" | "payment";

interface LogUtmEventParams {
  eventType: UtmEventType;
  attribution: Attribution | null;
  visitorId: string | null;
  userId?: string | null;
  orderId?: string;
  amount?: number;
  currency?: string;
  product?: string;
}

const buildRow = (params: LogUtmEventParams) => {
  const { eventType, attribution, visitorId, userId } = params;

  return {
    event_type: eventType,
    visitor_id: visitorId,
    user_id: userId ?? null,
    utm_source: attribution?.utmSource ?? null,
    utm_medium: attribution?.utmMedium ?? null,
    utm_campaign: attribution?.utmCampaign ?? null,
    utm_content: attribution?.utmContent ?? null,
    utm_term: attribution?.utmTerm ?? null,
    landing_path: attribution?.landingPath ?? null,
    referrer_host: attribution?.referrerHost ?? null,
    touched_at: attribution?.touchedAt ?? null,
    order_id: params.orderId ?? null,
    amount: params.amount ?? null,
    currency: params.currency ?? null,
    product: params.product ?? null,
  };
};

export const logUtmEvent = (params: LogUtmEventParams): Promise<void> =>
  insertLogRow("utm_events", buildRow(params));
