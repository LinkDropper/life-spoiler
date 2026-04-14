#!/usr/bin/env node

/**
 * X (Twitter) 트윗 메트릭 수집 스크립트
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
 *   X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET
 *   PROXY_TOKEN - life-spoiler.com 프록시 인증
 */

const crypto = require("crypto");

const { proxyRequest } = require("./lib/proxy-fetch");

const args = process.argv.slice(2);

const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
};

const config = {
  apiKey: process.env.X_API_KEY,
  apiSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
};

const missingKeys = Object.entries(config)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missingKeys.length > 0) {
  console.error(`Error: 환경변수 미설정: ${missingKeys.join(", ")}`);
  process.exit(1);
}

const percentEncode = (str) =>
  encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );

const generateOAuthSignature = (method, url, params) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join("&");

  const baseString = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(sortedParams),
  ].join("&");

  const signingKey = `${percentEncode(config.apiSecret)}&${percentEncode(config.accessSecret)}`;

  return crypto
    .createHmac("sha1", signingKey)
    .update(baseString)
    .digest("base64");
};

const generateOAuthHeader = (method, url, queryParams = {}) => {
  const oauthParams = {
    oauth_consumer_key: config.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: config.accessToken,
    oauth_version: "1.0",
  };

  const allParams = { ...oauthParams, ...queryParams };
  oauthParams.oauth_signature = generateOAuthSignature(
    method,
    url,
    allParams
  );

  const header = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(", ");

  return `OAuth ${header}`;
};

const apiGet = async (path, queryParams = {}) => {
  const baseUrl = `https://api.twitter.com${path}`;
  const queryString = Object.entries(queryParams)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  const fullUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;
  const authHeader = generateOAuthHeader("GET", baseUrl, queryParams);

  const { statusCode, body } = await proxyRequest({
    method: "GET",
    url: fullUrl,
    headers: { Authorization: authHeader },
  });

  if (statusCode === 200) {
    return JSON.parse(body);
  }
  throw new Error(`HTTP ${statusCode}: ${body}`);
};

const formatMetrics = (tweets) => {
  if (!tweets || tweets.length === 0) {
    console.log("조회된 트윗이 없습니다.");
    return;
  }

  console.log("date,tweet_id,text_preview,impressions,likes,retweets,replies,quotes,bookmarks,url_clicks");

  for (const tweet of tweets) {
    const m = tweet.public_metrics || {};
    const nm = tweet.non_public_metrics || {};
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
        nm.url_link_clicks || 0,
      ].join(",")
    );
  }
};

const main = async () => {
  const userId = getArg("user-id");
  const tweetId = getArg("tweet-id");
  const count = getArg("count") || "10";

  try {
    if (tweetId) {
      const result = await apiGet(`/2/tweets/${tweetId}`, {
        "tweet.fields": "public_metrics,non_public_metrics,created_at",
      });
      formatMetrics(result.data ? [result.data] : []);
    } else if (userId) {
      const result = await apiGet(`/2/users/${userId}/tweets`, {
        max_results: count,
        "tweet.fields": "public_metrics,non_public_metrics,created_at",
      });
      formatMetrics(result.data || []);
    } else {
      const me = await apiGet("/2/users/me");
      const myId = me.data.id;
      console.error(`유저: ${me.data.name} (@${me.data.username}), ID: ${myId}`);

      const result = await apiGet(`/2/users/${myId}/tweets`, {
        max_results: count,
        "tweet.fields": "public_metrics,non_public_metrics,created_at",
      });
      formatMetrics(result.data || []);
    }
  } catch (err) {
    console.error(`오류: ${err.message}`);
    process.exit(1);
  }
};

main();
