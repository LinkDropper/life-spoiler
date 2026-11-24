/**
 * access_logs 테이블 기록 (페이지 접속).
 */

import { normalizeValue, resolveReferrerHost } from "./attribution";
import { insertLogRow } from "./insert-row";

export type DeviceType = "mobile" | "tablet" | "desktop";

interface AccessLogParams {
  url: URL;
  referrer: string | null;
  visitorId: string;
  isNewVisitor: boolean;
  locale: string | null;
  /** next/server userAgent()의 device.type (데스크톱은 undefined) */
  rawDeviceType: string | undefined;
  /** x-vercel-ip-country 헤더 */
  country: string | null;
}

const resolveDeviceType = (rawDeviceType: string | undefined): DeviceType => {
  if (rawDeviceType === "mobile" || rawDeviceType === "tablet") {
    return rawDeviceType;
  }
  return "desktop";
};

/** 쿼리스트링은 저장하지 않고 경로와 utm_* 값만 남긴다. */
export const buildAccessLogRow = (params: AccessLogParams) => {
  const { url, referrer, visitorId, isNewVisitor, locale, country } = params;
  const { searchParams } = url;

  return {
    visitor_id: visitorId,
    is_new_visitor: isNewVisitor,
    path: normalizeValue(url.pathname) ?? "/",
    referrer_host: resolveReferrerHost(referrer, url.hostname),
    utm_source: normalizeValue(searchParams.get("utm_source")),
    utm_medium: normalizeValue(searchParams.get("utm_medium")),
    utm_campaign: normalizeValue(searchParams.get("utm_campaign")),
    locale: normalizeValue(locale),
    device_type: resolveDeviceType(params.rawDeviceType),
    country: normalizeValue(country)?.slice(0, 2) ?? null,
  };
};

export const logAccess = (params: AccessLogParams): Promise<void> =>
  insertLogRow("access_logs", buildAccessLogRow(params));
