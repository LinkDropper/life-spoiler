#!/usr/bin/env node

/**
 * X (Twitter) 자동 발행 스크립트
 *
 * 사용법:
 *   node scripts/marketing/post-to-x.js --text "포스트 내용"
 *   node scripts/marketing/post-to-x.js --text "포스트 내용" --via-github
 *
 * 옵션:
 *   --via-github : GitHub Actions 릴레이를 통해 발행 (api.twitter.com 차단 환경)
 *
 * 환경변수:
 *   X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET
 *   TWEET_TEXT   : --text 대신 환경변수로 본문 전달 (GitHub Actions 전용)
 *   GITHUB_PAT   : --via-github 사용 시 필요
 */

const crypto = require("crypto");

const { proxyRequest } = require("./lib/proxy-fetch");

const args = process.argv.slice(2);

const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
};

const text = getArg("text") || process.env.TWEET_TEXT;
const viaGithub = args.includes("--via-github");

if (!text) {
  console.error("Error: --text 또는 TWEET_TEXT 환경변수가 필요합니다.");
  process.exit(1);
}

// --via-github: GitHub Actions 릴레이를 통해 트윗 발행
// Claude Code 웹 세션에서 api.twitter.com이 차단된 경우 사용
const runViaGithub = async () => {
  const { dispatch } = require("./lib/github-dispatch");
  await dispatch("post-to-x", { text });
  console.log(
    "GitHub Actions 릴레이로 트윗 발행 요청 완료.\n" +
      "→ https://github.com/linkdropper/life-spoiler/actions 에서 진행 확인"
  );
};

const config = {
  apiKey: process.env.X_API_KEY,
  apiSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
};

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

const generateOAuthHeader = (method, url) => {
  const oauthParams = {
    oauth_consumer_key: config.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: config.accessToken,
    oauth_version: "1.0",
  };

  oauthParams.oauth_signature = generateOAuthSignature(
    method,
    url,
    oauthParams
  );

  const header = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(", ");

  return `OAuth ${header}`;
};

const postTweet = async (tweetText) => {
  const url = "https://api.twitter.com/2/tweets";
  const body = JSON.stringify({ text: tweetText });
  const authHeader = generateOAuthHeader("POST", url);

  const { statusCode, body: responseBody } = await proxyRequest({
    method: "POST",
    url,
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body,
  });

  if (statusCode === 201) {
    const result = JSON.parse(responseBody);
    console.log(`트윗 발행 완료: https://x.com/i/status/${result.data.id}`);
    return result;
  }

  console.error(`X API 오류 (${statusCode}): ${responseBody}`);
  throw new Error(`HTTP ${statusCode}`);
};

const main = async () => {
  if (viaGithub) {
    await runViaGithub();
    return;
  }

  const missingKeys = Object.entries(config)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missingKeys.length > 0) {
    console.error(
      `Error: 환경변수가 설정되지 않았습니다: ${missingKeys.join(", ")}`
    );
    process.exit(1);
  }

  await postTweet(text);
};

main().catch((err) => {
  console.error(`요청 실패: ${err.message}`);
  process.exit(1);
});
