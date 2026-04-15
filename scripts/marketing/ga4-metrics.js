#!/usr/bin/env node

/**
 * Google Analytics 4 메트릭 수집 스크립트
 *
 * 사용법:
 *   node scripts/marketing/ga4-metrics.js --days 7
 *   node scripts/marketing/ga4-metrics.js --days 30 --type traffic
 *   node scripts/marketing/ga4-metrics.js --days 7 --type sources
 *   node scripts/marketing/ga4-metrics.js --days 7 --type pages
 *   node scripts/marketing/ga4-metrics.js --days 28 --type campaigns
 *
 * 옵션:
 *   --days    : 조회 기간 (기본 7일)
 *   --type    : traffic (트래픽 요약), sources (유입 소스별), pages (페이지별),
 *               campaigns (utm_campaign별 집계 — 상위 포스트 선정용)
 *
 * 환경변수:
 *   GA4_PROPERTY_ID - GA4 속성 ID
 *   GA4_SERVICE_ACCOUNT_JSON - 서비스 계정 JSON (문자열)
 */

const crypto = require("crypto");

const { proxyRequest } = require("./lib/proxy-fetch");

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
};

const propertyId = process.env.GA4_PROPERTY_ID;
const serviceAccountJson = process.env.GA4_SERVICE_ACCOUNT_JSON;

if (!propertyId || !serviceAccountJson) {
  console.error(
    "Error: GA4_PROPERTY_ID, GA4_SERVICE_ACCOUNT_JSON 환경변수가 필요합니다."
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountJson);
const days = parseInt(getArg("days") || "7", 10);
const reportType = getArg("type") || "traffic";

// JWT 생성
const base64url = (obj) =>
  Buffer.from(typeof obj === "string" ? obj : JSON.stringify(obj))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const createJwt = () => {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const unsigned = `${base64url(header)}.${base64url(payload)}`;
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(unsigned);
  const signature = sign
    .sign(serviceAccount.private_key, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${unsigned}.${signature}`;
};

// OAuth 토큰 획득
const getAccessToken = async () => {
  const jwt = createJwt();
  const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;

  const { statusCode, body: responseBody } = await proxyRequest({
    method: "POST",
    url: "https://oauth2.googleapis.com/token",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (statusCode !== 200) {
    throw new Error(`토큰 발급 실패 (${statusCode}): ${responseBody}`);
  }
  return JSON.parse(responseBody).access_token;
};

// GA4 API 호출
const runReport = async (accessToken, requestBody) => {
  const body = JSON.stringify(requestBody);

  const { statusCode, body: responseBody } = await proxyRequest({
    method: "POST",
    url: `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body,
  });

  if (statusCode !== 200) {
    throw new Error(`GA4 API 오류 (${statusCode}): ${responseBody}`);
  }
  return JSON.parse(responseBody);
};

const formatDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0].replace(/-/g, "-");
};

const dateRange = {
  startDate: `${days}daysAgo`,
  endDate: "today",
};

const reports = {
  traffic: {
    dimensions: [{ name: "date" }],
    metrics: [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "averageSessionDuration" },
      { name: "bounceRate" },
    ],
    orderBys: [{ dimension: { dimensionName: "date", orderType: "ALPHANUMERIC" } }],
    format: (rows) => {
      console.log("date,active_users,sessions,pageviews,avg_duration_sec,bounce_rate");
      for (const row of rows) {
        const date = row.dimensionValues[0].value;
        const formatted = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
        const metrics = row.metricValues.map((m) => m.value);
        const duration = parseFloat(metrics[3]).toFixed(1);
        const bounce = (parseFloat(metrics[4]) * 100).toFixed(1);
        console.log(`${formatted},${metrics[0]},${metrics[1]},${metrics[2]},${duration},${bounce}%`);
      }
    },
  },
  sources: {
    dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
    metrics: [
      { name: "sessions" },
      { name: "activeUsers" },
      { name: "screenPageViews" },
      { name: "averageSessionDuration" },
    ],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    format: (rows) => {
      console.log("source,medium,sessions,users,pageviews,avg_duration_sec");
      for (const row of rows) {
        const dims = row.dimensionValues.map((d) => d.value);
        const metrics = row.metricValues.map((m) => m.value);
        const duration = parseFloat(metrics[3]).toFixed(1);
        console.log(`${dims[0]},${dims[1]},${metrics[0]},${metrics[1]},${metrics[2]},${duration}`);
      }
    },
  },
  campaigns: {
    dimensions: [{ name: "sessionCampaignName" }],
    metrics: [
      { name: "sessions" },
      { name: "activeUsers" },
      { name: "screenPageViews" },
      { name: "averageSessionDuration" },
    ],
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
    limit: "100",
    format: (rows) => {
      console.log("campaign,sessions,users,pageviews,avg_duration_sec");
      for (const row of rows) {
        const campaign = row.dimensionValues[0].value || "(not set)";
        const metrics = row.metricValues.map((m) => m.value);
        const duration = parseFloat(metrics[3]).toFixed(1);
        console.log(
          `${campaign},${metrics[0]},${metrics[1]},${metrics[2]},${duration}`
        );
      }
    },
  },
  pages: {
    dimensions: [{ name: "pagePath" }],
    metrics: [
      { name: "screenPageViews" },
      { name: "activeUsers" },
      { name: "averageSessionDuration" },
    ],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: "20",
    format: (rows) => {
      console.log("page,pageviews,users,avg_duration_sec");
      for (const row of rows) {
        const page = row.dimensionValues[0].value;
        const metrics = row.metricValues.map((m) => m.value);
        const duration = parseFloat(metrics[2]).toFixed(1);
        console.log(`${page},${metrics[0]},${metrics[1]},${duration}`);
      }
    },
  },
};

const main = async () => {
  try {
    const accessToken = await getAccessToken();
    const report = reports[reportType];

    if (!report) {
      console.error(`Error: 알 수 없는 리포트 유형: ${reportType}`);
      console.error("사용 가능: traffic, sources, pages, campaigns");
      process.exit(1);
    }

    const requestBody = {
      dateRanges: [dateRange],
      dimensions: report.dimensions,
      metrics: report.metrics,
      orderBys: report.orderBys,
    };

    if (report.limit) {
      requestBody.limit = report.limit;
    }

    const result = await runReport(accessToken, requestBody);

    if (!result.rows || result.rows.length === 0) {
      console.log("조회 기간 내 데이터가 없습니다.");
      return;
    }

    console.error(`[GA4] ${reportType} 리포트 (최근 ${days}일)`);
    report.format(result.rows);
  } catch (err) {
    console.error(`오류: ${err.message}`);
    process.exit(1);
  }
};

main();
