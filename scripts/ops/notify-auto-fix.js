#!/usr/bin/env node

/**
 * Auto-Fix 워크플로 결과를 Discord로 알림
 *
 * 사용법:
 *   node scripts/ops/notify-auto-fix.js \
 *     --status pr-opened \
 *     --reason "" \
 *     --fingerprint a1b2c3d4e5f6 \
 *     --error-type TypeError \
 *     --path /api/foo \
 *     --pr-url https://github.com/.../pull/123 \
 *     --run-url https://github.com/.../actions/runs/...
 *
 * 환경변수:
 *   DISCORD_OPS_WEBHOOK : 운영 알림용 Discord 웹훅 URL
 */

const args = process.argv.slice(2);
const getArg = (name, fallback = "") => {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return fallback;
  const value = args[idx + 1];
  // 값이 누락되고 다음 플래그가 바로 따라오는 경우 fallback 반환
  return value.startsWith("--") ? fallback : value;
};

const status = getArg("status");
const reason = getArg("reason");
const fingerprint = getArg("fingerprint");
const errorType = getArg("error-type");
const path = getArg("path");
const prUrl = getArg("pr-url");
const runUrl = getArg("run-url");

const webhook = process.env.DISCORD_OPS_WEBHOOK;
if (!webhook) {
  console.error("DISCORD_OPS_WEBHOOK 환경변수가 필요합니다.");
  process.exit(1);
}

const STATUS_CONFIG = {
  "pr-opened": { emoji: "✅", title: "Auto-Fix PR 생성됨" },
  skipped: { emoji: "⏭️", title: "Auto-Fix 스킵" },
  "no-commit": { emoji: "🤔", title: "Auto-Fix 커밋 없음 (Claude SKIP)" },
  failed: { emoji: "❌", title: "Auto-Fix 워크플로 실패" },
};

const REASON_DESCRIPTIONS = {
  killswitch: "AUTO_FIX_DISABLED 파일이 존재합니다",
  "guarded-path": "민감 경로(결제/인증/OAuth 등) — 사람 확인 필요",
  "branch-exists": "동일 fingerprint 브랜치가 이미 존재 (이전 시도 처리 중)",
  "attempts-exceeded": "재시도 3회 초과 — 사람 개입 필요",
  cooldown: "24시간 쿨다운 중 (직전 closed PR 이후)",
  "claude-skipped": "Claude가 SKIP_REASON으로 수정을 건너뜀",
  "workflow-error": "워크플로 실행 중 오류 발생",
};

const config = STATUS_CONFIG[status] ?? {
  emoji: "ℹ️",
  title: `Auto-Fix: ${status}`,
};

const lines = [`${config.emoji} **${config.title}**`];

if (fingerprint) lines.push(`fingerprint: \`${fingerprint}\``);
if (errorType) lines.push(`type: \`${errorType}\``);
if (path) lines.push(`path: \`${path}\``);
if (reason) {
  const desc = REASON_DESCRIPTIONS[reason] ?? reason;
  lines.push(`reason: ${desc}`);
}
if (prUrl) lines.push(`PR: ${prUrl}`);
if (runUrl) lines.push(`logs: ${runUrl}`);

const content = lines.join("\n");

const run = async () => {
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "Auto-Fix Bot", content }),
  });
  if (!res.ok) {
    console.error(`Discord 알림 실패: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  console.log("Discord 알림 전송 완료");
};

run().catch((err) => {
  console.error(`알림 실패: ${err.message}`);
  process.exit(1);
});
