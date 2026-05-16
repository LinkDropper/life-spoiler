#!/usr/bin/env node

/**
 * X (Twitter) 트윗 메트릭 수집 스크립트
 *
 * Bearer Token (OAuth 2.0 App-only) 인증.
 * impression_count는 public_metrics로 이전됐기 때문에 Bearer Token만으로
 * 주요 지표를 수집할 수 있다.
 * non_public_metrics(url_link_clicks 등)는 OAuth 1.0a User context 필요 → 0으로 기록.
 *
 * 사용법:
 *   node scripts/marketing/x-metrics.js --user-id "USER_ID"
 *   node scripts/marketing/x-metrics.js --tweet-id "TWEET_ID"
 *
 * 옵션:
 *   --user-id   : 해당 유저의 최근 트윗 메트릭 조회
 *   --tweet-id  : 특정 트윗 메트릭 조회
 *   --count     : 조회할 트윗 수 (기본 10, 최대 100)
 *
 * 환경변수:
 *   X_BEARER_TOKEN
 */

const { proxyRequest } = require("./lib/proxy-fetch");

const args = process.argv.slice(2);

const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
};

const bearerToken = process.env.X_BEARER_TOKEN;

if (!bearerToken) {
  console.error("Error: 환경변수 미설정: X_BEARER_TOKEN");
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// curl 기본 User-Agent(`curl/8.x`)는 GitHub Actions 러너 IP에서 Cloudflare가
// 봇으로 분류해 GET /2/users/{id}/tweets에 403 challenge 페이지를 돌려준다.
// 식별 가능한 자체 UA + Accept 헤더로 challenge를 회피한다.
const X_API_HEADERS = {
  "User-Agent": "LifeSpoilerMetrics/1.0 (+https://life-spoiler.com)",
  Accept: "application/json",
  Authorization: `Bearer ${bearerToken}`,
};

const apiGet = async (path, queryParams = {}) => {
  const queryString = Object.entries(queryParams)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  const fullUrl = queryString
    ? `https://api.twitter.com${path}?${queryString}`
    : `https://api.twitter.com${path}`;

  if (process.env.X_METRICS_DEBUG === "1") {
    console.error("[DEBUG] full URL:", fullUrl);
  }

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const { statusCode, headers: respHeaders, body } = await proxyRequest({
      method: "GET",
      url: fullUrl,
      headers: X_API_HEADERS,
    });

    if (process.env.X_METRICS_DEBUG === "1") {
      console.error(`[DEBUG] response status: ${statusCode}`);
      console.error(
        "[DEBUG] response headers:",
        JSON.stringify(respHeaders, null, 2)
      );
      console.error("[DEBUG] response body:", body);
    }

    if (statusCode === 200) {
      return JSON.parse(body);
    }

    const isChallenge = statusCode === 403 && body.includes("Just a moment");
    const isTransient = statusCode === 429 || statusCode >= 500;

    if ((isChallenge || isTransient) && attempt < 3) {
      const waitMs = 2000 * attempt;
      console.error(
        `재시도 ${attempt}/3 — HTTP ${statusCode} (${isChallenge ? "Cloudflare challenge" : "transient"}), ${waitMs}ms 대기 후 재시도`
      );
      await sleep(waitMs);
      continue;
    }

    throw new Error(
      `HTTP ${statusCode}: ${body.substring(0, 500)}${body.length > 500 ? "..." : ""}`
    );
  }
};

const formatMetrics = (tweets) => {
  if (!tweets || tweets.length === 0) {
    console.log("조회된 트윗이 없습니다.");
    return;
  }

  console.log(
    "date,tweet_id,text_preview,impressions,likes,retweets,replies,quotes,bookmarks,url_clicks"
  );

  for (const tweet of tweets) {
    const m = tweet.public_metrics || {};
    const textPreview = tweet.text
      .replace(/\n/g, " ")
      .substring(0, 50)
      .replace(/,/g, ";");
    const createdAt = tweet.created_at
      ? tweet.created_at.substring(0, 10)
      : "unknown";

    console.log(
      [
        createdAt,
        tweet.id,
        `"${textPreview}"`,
        m.impression_count || 0,
        m.like_count || 0,
        m.retweet_count || 0,
        m.reply_count || 0,
        m.quote_count || 0,
        m.bookmark_count || 0,
        0,
      ].join(",")
    );
  }
};

const main = async () => {
  const userId = getArg("user-id");
  const tweetId = getArg("tweet-id");
  const count = getArg("count") || "10";

  if (!userId && !tweetId) {
    console.error(
      "Error: --user-id 또는 --tweet-id 필수 (Bearer Token은 /me endpoint 미지원)"
    );
    process.exit(1);
  }

  try {
    if (tweetId) {
      const result = await apiGet(`/2/tweets/${tweetId}`, {
        "tweet.fields": "public_metrics,created_at",
      });
      formatMetrics(result.data ? [result.data] : []);
    } else {
      const result = await apiGet(`/2/users/${userId}/tweets`, {
        max_results: count,
        "tweet.fields": "public_metrics,created_at",
      });
      formatMetrics(result.data || []);
    }
  } catch (err) {
    console.error(`오류: ${err.message}`);
    process.exit(1);
  }
};

main();
