#!/usr/bin/env node

/**
 * X (Twitter) 자동 발행 스크립트 — OAuth 2.0 PKCE refresh flow.
 *
 * 사용법:
 *   node scripts/marketing/post-to-x.js --text "포스트 내용"
 *
 * 실행 환경에 따라 자동으로 경로를 선택합니다:
 *   - 로컬(CMO 에이전트): GitHub Actions를 트리거하여 발행
 *   - GitHub Actions 런너: refresh_token으로 access_token 발급 후 X API 직접 호출
 *
 * 동작 (GitHub Actions 런너):
 *   1. refresh_token으로 access_token + 새 refresh_token 발급
 *   2. 새 refresh_token을 GitHub Secret(X_REFRESH_TOKEN)에 즉시 갱신
 *      (트윗 POST 실패 시에도 다음 발행이 가능하도록 먼저 저장)
 *   3. access_token으로 트윗 발행
 *
 * 환경변수 (GitHub Actions 전용):
 *   X_OAUTH2_CLIENT_ID, X_OAUTH2_CLIENT_SECRET, X_REFRESH_TOKEN
 *   AUTO_FIX_PAT — refresh_token 자동 갱신용 (repo scope 필요)
 *   TWEET_TEXT   — --text 대신 환경변수로 본문 전달
 */

const { spawnSync } = require("child_process");

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

const refreshAccessToken = async () => {
  const clientId = process.env.X_OAUTH2_CLIENT_ID;
  const clientSecret = process.env.X_OAUTH2_CLIENT_SECRET;
  const refreshToken = process.env.X_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "환경변수 미설정: X_OAUTH2_CLIENT_ID, X_OAUTH2_CLIENT_SECRET, X_REFRESH_TOKEN"
    );
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );
  const formBody = [
    "grant_type=refresh_token",
    `refresh_token=${encodeURIComponent(refreshToken)}`,
    `client_id=${encodeURIComponent(clientId)}`,
  ].join("&");

  const { statusCode, body } = await proxyRequest({
    method: "POST",
    url: "https://api.twitter.com/2/oauth2/token",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody,
  });

  if (statusCode !== 200) {
    throw new Error(
      `Token refresh 실패 (HTTP ${statusCode}): ${body.substring(0, 300)}`
    );
  }

  const tokens = JSON.parse(body);
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error(
      `Token refresh 응답에 access_token/refresh_token 없음: ${body.substring(0, 300)}`
    );
  }
  return tokens;
};

const persistNewRefreshToken = (newToken) => {
  if (process.env.GITHUB_ACTIONS !== "true") {
    console.error(
      "[INFO] 로컬 실행이므로 자동 저장 안 함. 새 refresh_token:",
      newToken
    );
    return;
  }

  const pat = process.env.AUTO_FIX_PAT;
  const repo = process.env.GITHUB_REPOSITORY;

  if (!pat || !repo) {
    console.error(
      "[FATAL] AUTO_FIX_PAT 또는 GITHUB_REPOSITORY 미설정 — refresh_token 회전 후 저장 실패"
    );
    console.error("[FATAL] 새 refresh_token을 수동으로 저장하세요:", newToken);
    process.exit(1);
  }

  const result = spawnSync(
    "gh",
    ["secret", "set", "X_REFRESH_TOKEN", "--repo", repo],
    {
      input: newToken,
      env: { ...process.env, GH_TOKEN: pat },
      encoding: "utf8",
    }
  );

  if (result.status !== 0) {
    console.error(
      "[FATAL] X_REFRESH_TOKEN 갱신 실패. 다음 발행이 invalid_grant로 실패합니다."
    );
    console.error("stderr:", result.stderr);
    console.error(
      "[FATAL] 수동 갱신 명령:\n  printf '%s' '" +
        newToken +
        "' | gh secret set X_REFRESH_TOKEN"
    );
    process.exit(1);
  }

  console.error("[INFO] X_REFRESH_TOKEN 회전 저장 완료");
};

const postTweet = async (accessToken, tweetText) => {
  const url = "https://api.twitter.com/2/tweets";
  const body = JSON.stringify({ text: tweetText });

  const { statusCode, body: responseBody } = await proxyRequest({
    method: "POST",
    url,
    headers: {
      Authorization: `Bearer ${accessToken}`,
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
    const tokens = await refreshAccessToken();
    // refresh_token 회전: 트윗 POST 실패해도 다음 발행이 가능하도록 먼저 저장.
    persistNewRefreshToken(tokens.refresh_token);
    await postTweet(tokens.access_token, text);
  } else {
    await dispatchViaGithub();
  }
};

main().catch((err) => {
  console.error(`요청 실패: ${err.message}`);
  process.exit(1);
});
