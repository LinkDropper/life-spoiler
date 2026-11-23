/**
 * UTM 유입 정보(attribution) 파싱·직렬화·표시 유틸.
 *
 * middleware(edge)와 route handler 양쪽에서 쓰므로 next/headers 등
 * 서버 전용 API에 의존하지 않는다.
 */

export const ATTRIBUTION_COOKIE = "ls_attr";
export const VISITOR_ID_COOKIE = "ls_vid";

/** 마지막 UTM 유입을 가입·결제에 귀속시키는 기간 */
export const ATTRIBUTION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30일
export const VISITOR_ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1년

const MAX_VALUE_LENGTH = 200;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface Attribution {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  landingPath: string | null;
  referrerHost: string | null;
  /** UTM 유입이 발생한 시각 (ISO 8601) */
  touchedAt: string;
}

const normalizeValue = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, MAX_VALUE_LENGTH);
};

/** 같은 사이트 내부 이동은 referrer로 취급하지 않는다. */
const resolveReferrerHost = (
  referrer: string | null,
  currentHost: string
): string | null => {
  if (!referrer) {
    return null;
  }
  try {
    const { hostname } = new URL(referrer);
    const bareHost = (host: string) => host.replace(/^www\./, "");
    if (bareHost(hostname) === bareHost(currentHost)) {
      return null;
    }
    return normalizeValue(hostname);
  } catch {
    return null;
  }
};

interface ParseAttributionParams {
  url: URL;
  referrer: string | null;
  now?: Date;
}

/**
 * 요청 URL에서 UTM 유입 정보를 뽑는다.
 * utm_source/utm_medium/utm_campaign 중 하나도 없으면 null.
 */
export const parseAttributionFromUrl = ({
  url,
  referrer,
  now = new Date(),
}: ParseAttributionParams): Attribution | null => {
  const { searchParams } = url;
  const utmSource = normalizeValue(searchParams.get("utm_source"));
  const utmMedium = normalizeValue(searchParams.get("utm_medium"));
  const utmCampaign = normalizeValue(searchParams.get("utm_campaign"));

  if (!utmSource && !utmMedium && !utmCampaign) {
    return null;
  }

  return {
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent: normalizeValue(searchParams.get("utm_content")),
    utmTerm: normalizeValue(searchParams.get("utm_term")),
    landingPath: normalizeValue(url.pathname),
    referrerHost: resolveReferrerHost(referrer, url.hostname),
    touchedAt: now.toISOString(),
  };
};

/** 쿠키 값 인코딩은 Next.js의 cookies API가 처리하므로 JSON 그대로 넘긴다. */
export const serializeAttribution = (attribution: Attribution): string =>
  JSON.stringify(attribution);

const readStringField = (
  record: Record<string, unknown>,
  key: keyof Attribution
): string | null => {
  const value = record[key];
  return typeof value === "string" ? normalizeValue(value) : null;
};

/**
 * 쿠키 값(클라이언트가 조작 가능한 외부 입력)을 검증해 Attribution으로 복원한다.
 * 형식이 맞지 않으면 null.
 */
export const parseAttributionCookie = (
  value: string | null | undefined
): Attribution | null => {
  if (!value) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) {
    return null;
  }

  const record = parsed as Record<string, unknown>;
  const touchedAt = readStringField(record, "touchedAt");
  if (!touchedAt || Number.isNaN(Date.parse(touchedAt))) {
    return null;
  }

  const attribution: Attribution = {
    utmSource: readStringField(record, "utmSource"),
    utmMedium: readStringField(record, "utmMedium"),
    utmCampaign: readStringField(record, "utmCampaign"),
    utmContent: readStringField(record, "utmContent"),
    utmTerm: readStringField(record, "utmTerm"),
    landingPath: readStringField(record, "landingPath"),
    referrerHost: readStringField(record, "referrerHost"),
    touchedAt,
  };

  if (
    !attribution.utmSource &&
    !attribution.utmMedium &&
    !attribution.utmCampaign
  ) {
    return null;
  }

  return attribution;
};

export const parseVisitorId = (
  value: string | null | undefined
): string | null => (value && UUID_PATTERN.test(value) ? value : null);

const formatElapsed = (touchedAt: string, now: Date): string => {
  const elapsedMinutes = Math.max(
    0,
    Math.floor((now.getTime() - Date.parse(touchedAt)) / 60000)
  );
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}분 전`;
  }
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours}시간 전`;
  }
  return `${Math.floor(elapsedHours / 24)}일 전`;
};

/**
 * 디스코드 알림용 유입경로 문자열.
 * 예: "x / social / 2026-04-ziwei-intro\n랜딩 / · 2시간 전 유입"
 */
export const formatAttributionForDiscord = (
  attribution: Attribution | null,
  now: Date = new Date()
): string => {
  if (!attribution) {
    return "UTM 없음 (직접/미확인)";
  }

  const channel = [
    attribution.utmSource ?? "-",
    attribution.utmMedium ?? "-",
    attribution.utmCampaign ?? "-",
  ].join(" / ");

  const extras = [
    attribution.utmContent && `content: ${attribution.utmContent}`,
    attribution.utmTerm && `term: ${attribution.utmTerm}`,
  ].filter(Boolean);

  const context = [
    attribution.landingPath && `랜딩 ${attribution.landingPath}`,
    attribution.referrerHost && `referrer ${attribution.referrerHost}`,
    `${formatElapsed(attribution.touchedAt, now)} 유입`,
  ].filter(Boolean);

  return [
    `\`${channel}\``,
    extras.length > 0 ? extras.join(" · ") : null,
    context.join(" · "),
  ]
    .filter(Boolean)
    .join("\n");
};

interface CookieReader {
  get: (name: string) => { value: string } | undefined;
}

/**
 * 요청 쿠키에서 마지막 UTM 유입과 방문자 ID를 읽는다.
 * `request.cookies`(NextRequest)와 `await cookies()` 둘 다 받을 수 있다.
 */
export const readAttributionCookies = (
  cookieReader: CookieReader
): { attribution: Attribution | null; visitorId: string | null } => ({
  attribution: parseAttributionCookie(
    cookieReader.get(ATTRIBUTION_COOKIE)?.value
  ),
  visitorId: parseVisitorId(cookieReader.get(VISITOR_ID_COOKIE)?.value),
});
