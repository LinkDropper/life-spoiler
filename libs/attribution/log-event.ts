/**
 * utm_events 테이블 기록.
 *
 * middleware(edge runtime)에서도 호출하므로 supabase-js 클라이언트 대신
 * PostgREST에 service role key로 직접 INSERT 한다.
 * 로그 기록 실패가 랜딩·가입·결제 흐름을 막으면 안 되므로 예외를 던지지 않고
 * 콘솔에만 남긴다.
 */

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

export const logUtmEvent = async (params: LogUtmEventParams): Promise<void> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn(
      "[utm_events] Supabase 서버 환경 변수가 없어 UTM 로그를 남기지 않습니다."
    );
    return;
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/utm_events`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(buildRow(params)),
    });

    if (!response.ok) {
      console.error("[utm_events] UTM 로그 기록 실패:", {
        eventType: params.eventType,
        status: response.status,
        body: await response.text(),
      });
    }
  } catch (error) {
    console.error("[utm_events] UTM 로그 기록 오류:", {
      eventType: params.eventType,
      error,
    });
  }
};
