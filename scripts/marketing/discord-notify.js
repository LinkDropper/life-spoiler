#!/usr/bin/env node

/**
 * Discord Webhook 알림 스크립트
 *
 * 사용법:
 *   node scripts/marketing/discord-notify.js \
 *     --webhook "$DISCORD_MARKETING_WEBHOOK" \
 *     --username "CMO" \
 *     --text "브리핑 내용"
 *   node scripts/marketing/discord-notify.js --username "CMO" --text "내용" --via-github
 *
 * 옵션:
 *   --via-github : GitHub Actions 릴레이를 통해 발송 (discord.com 차단 환경)
 *
 * 환경변수:
 *   DISCORD_MARKETING_WEBHOOK : Discord 웹훅 URL
 *   DISCORD_TEXT              : --text 대신 환경변수로 본문 전달 (GitHub Actions 전용)
 *   DISCORD_USERNAME          : --username 대신 환경변수로 전달 (GitHub Actions 전용)
 *   GITHUB_PAT                : --via-github 사용 시 필요
 */

const { proxyRequest } = require("./lib/proxy-fetch");

const args = process.argv.slice(2);

const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
};

const webhookUrl = getArg("webhook") || process.env.DISCORD_MARKETING_WEBHOOK;
const username =
  getArg("username") || process.env.DISCORD_USERNAME || "Marketing Bot";
const text = getArg("text") || process.env.DISCORD_TEXT;
const viaGithub = args.includes("--via-github");

if (!text) {
  console.error("Error: --text 또는 DISCORD_TEXT 환경변수가 필요합니다.");
  process.exit(1);
}

// --via-github: GitHub Actions 릴레이를 통해 Discord 알림 발송
// Claude Code 웹 세션에서 discord.com이 차단된 경우 사용
// 웹훅 URL은 GitHub Secret(DISCORD_MARKETING_WEBHOOK)에서 읽으므로 전달 불필요
const runViaGithub = async () => {
  const { dispatch } = require("./lib/github-dispatch");
  await dispatch("discord-notify", { text, username });
  console.log(
    `GitHub Actions 릴레이로 Discord 알림 요청 완료 (${username}).\n` +
      "→ https://github.com/linkdropper/life-spoiler/actions 에서 진행 확인"
  );
};

const run = async () => {
  if (viaGithub) {
    await runViaGithub();
    return;
  }

  if (!webhookUrl) {
    console.error(
      "Error: Discord webhook URL이 필요합니다. --webhook 또는 DISCORD_MARKETING_WEBHOOK 환경변수를 설정하세요."
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

run().catch((err) => {
  console.error(`Discord 알림 실패: ${err.message}`);
  process.exit(1);
});
