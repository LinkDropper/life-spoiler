#!/usr/bin/env node

/**
 * X (Twitter) 자동 발행 스크립트
 *
 * 사용법:
 *   node scripts/marketing/post-to-x.js --text "포스트 내용"
 *
 * 실행 환경에 따라 자동으로 경로를 선택합니다:
 *   - 로컬(CMO 에이전트): GitHub Actions를 트리거하여 발행
 *   - GitHub Actions 런너: X API에 직접 발행
 *
 * 환경변수:
 *   PROXY_TOKEN  : GitHub API 인증 토큰 (로컬 실행 시 필요)
 *   TWEET_TEXT   : --text 대신 환경변수로 본문 전달 (GitHub Actions 전용)
 *   X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET
 *                : GitHub Secrets에서 자동 주입 (GitHub Actions 전용)
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

if (!text) {
  console.error("Error: --text 또는 TWEET_TEXT 환경변수가 필요합니다.");
  process.exit(1);
}

// GitHub Actions 런너에서 X API 직접 호출
const percentEncode = (str) =>
  encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );

const generateOAuthHeader = (method, url) => {
  const config = {
    apiKey: process.env.X_API_KEY,
    apiSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET,
  };

  const oauthParams = {
    oauth_consumer_key: config.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: config.accessToken,
    oauth_version: "1.0",
  };

  const sortedParams = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`)
    .join("&");

  const baseString = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(sortedParams),
  ].join("&");

  const signingKey = `${percentEncode(config.apiSecret)}&${percentEncode(config.accessSecret)}`;

  oauthParams.oauth_signature = crypto
    .createHmac("sha1", signingKey)
    .update(baseString)
    .digest("base64");

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
    const tweetUrl = `https://x.com/i/status/${result.data.id}`;
    console.log(`트윗 발행 완료: ${tweetUrl}`);

    if (process.env.GITHUB_OUTPUT) {
      const fs = require("fs");
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `tweet_url=${tweetUrl}\n`);
    }

    return result;
  }

  console.error(`X API 오류 (${statusCode}): ${responseBody}`);
  throw new Error(`HTTP ${statusCode}`);
};

// 로컬에서 GitHub Actions 트리거
const dispatchViaGithub = async () => {
  const { dispatch } = require("./lib/github-dispatch");
  await dispatch("post-to-x", { text });
  console.log(
    "GitHub Actions 릴레이로 트윗 발행 요청 완료.\n" +
      "→ https://github.com/linkdropper/life-spoiler/actions 에서 진행 확인"
  );
};

const main = async () => {
  if (process.env.GITHUB_ACTIONS === "true") {
    // GitHub Actions 런너: X API 직접 호출
    await postTweet(text);
  } else {
    // 로컬(CMO 에이전트): GitHub Actions 릴레이
    await dispatchViaGithub();
  }
};

main().catch((err) => {
  console.error(`요청 실패: ${err.message}`);
  process.exit(1);
});
