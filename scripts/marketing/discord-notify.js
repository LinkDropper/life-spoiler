#!/usr/bin/env node

/**
 * Discord Webhook 알림 스크립트
 *
 * 사용법:
 *   node scripts/marketing/discord-notify.js \
 *     --webhook "$DISCORD_MARKETING_WEBHOOK" \
 *     --username "CMO" \
 *     --text "브리핑 내용"
 *
 * 환경변수:
 *   DISCORD_MARKETING_WEBHOOK - Discord 웹훅 URL
 */

const args = process.argv.slice(2);

const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
};

const webhookUrl =
  getArg("webhook") || process.env.DISCORD_MARKETING_WEBHOOK;
const username = getArg("username") || "Marketing Bot";
const text = getArg("text");

if (!webhookUrl) {
  console.error(
    "Error: Discord webhook URL이 필요합니다. --webhook 또는 DISCORD_MARKETING_WEBHOOK 환경변수를 설정하세요."
  );
  process.exit(1);
}

if (!text) {
  console.error("Error: --text 인자가 필요합니다.");
  process.exit(1);
}

const payload = {
  username,
  content: text,
};

fetch(webhookUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
})
  .then((res) => {
    if (!res.ok) {
      throw new Error(`Discord API error: ${res.status} ${res.statusText}`);
    }
    console.log(`Discord 알림 전송 완료 (${username})`);
  })
  .catch((err) => {
    console.error(`Discord 알림 실패: ${err.message}`);
    process.exit(1);
  });
