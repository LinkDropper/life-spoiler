#!/usr/bin/env node

/**
 * Discord Webhook 알림 스크립트
 *
 * 사용법:
 *   node scripts/marketing/discord-notify.js --username "CMO" --text "브리핑 내용"
 *
 * 실행 환경 자동 판별:
 *   - GITHUB_ACTIONS=true (GitHub Actions 러너 내부) → discord.com 직접 POST
 *   - 그 외 (CCR/로컬) → GitHub repository_dispatch 릴레이(marketing-proxy.yml)
 *
 * 환경변수:
 *   DISCORD_MARKETING_WEBHOOK : Discord 웹훅 URL (러너 내부에서 직접 호출 시)
 *   DISCORD_TEXT              : --text 대신 환경변수로 본문 전달 (러너에서 사용)
 *   DISCORD_USERNAME          : --username 대신 환경변수로 전달 (러너에서 사용)
 *   GITHUB_PAT                : 릴레이 경로에서 필요
 */

const args = process.argv.slice(2);

const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
};

const username =
  getArg("username") || process.env.DISCORD_USERNAME || "Marketing Bot";
const text = getArg("text") || process.env.DISCORD_TEXT;
const isGithubRunner = process.env.GITHUB_ACTIONS === "true";

if (!text) {
  console.error("Error: --text 또는 DISCORD_TEXT 환경변수가 필요합니다.");
  process.exit(1);
}

const runDirect = async () => {
  const { proxyRequest } = require("./lib/proxy-fetch");
  const webhookUrl = process.env.DISCORD_MARKETING_WEBHOOK;

  if (!webhookUrl) {
    console.error(
      "Error: DISCORD_MARKETING_WEBHOOK 환경변수가 필요합니다 (러너 내부 직접 호출)."
    );
    process.exit(1);
  }

  const payload = JSON.stringify({ username, content: text });
  const { statusCode, body } = await proxyRequest({
    method: "POST",
    url: webhookUrl,
    headers: { "Content-Type": "application/json" },
    body: payload,
  });

  if (statusCode >= 200 && statusCode < 300) {
    console.log(`Discord 알림 전송 완료 (${username})`);
    return;
  }

  throw new Error(`HTTP ${statusCode}: ${body}`);
};

const runViaGithub = async () => {
  const { dispatch } = require("./lib/github-dispatch");
  await dispatch("discord-notify", { text, username });
  console.log(
    `GitHub Actions 릴레이로 Discord 알림 요청 완료 (${username}).\n` +
      "→ https://github.com/linkdropper/life-spoiler/actions 에서 진행 확인"
  );
};

const run = async () => {
  if (isGithubRunner) {
    await runDirect();
    return;
  }
  await runViaGithub();
};

run().catch((err) => {
  console.error(`Discord 알림 실패: ${err.message}`);
  process.exit(1);
});
