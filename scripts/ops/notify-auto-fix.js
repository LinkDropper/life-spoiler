#!/usr/bin/env node

/**
 * Auto-Fix 워크플로 결과를 Discord로 알림 (embed 기반 리치 카드)
 *
 * 사용법:
 *   node scripts/ops/notify-auto-fix.js \
 *     --status pr-opened \
 *     --reason "" \
 *     --fingerprint a1b2c3d4e5f6 \
 *     --error-type TypeError \
 *     --error-message "Cannot read properties of undefined..." \
 *     --path /api/foo \
 *     --status-code 500 \
 *     --env production \
 *     --source vercel \
 *     --pr-url https://github.com/.../pull/123 \
 *     --pr-title "[auto-fix] ..." \
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
  return value.startsWith("--") ? fallback : value;
};

const status = getArg("status");
const reason = getArg("reason");
const fingerprint = getArg("fingerprint");
const errorType = getArg("error-type");
const errorMessage = getArg("error-message");
const path = getArg("path");
const statusCode = getArg("status-code");
const env = getArg("env");
const source = getArg("source");
const prUrl = getArg("pr-url");
const prTitle = getArg("pr-title");
const runUrl = getArg("run-url");

const webhook = process.env.DISCORD_OPS_WEBHOOK;
if (!webhook) {
  console.error("DISCORD_OPS_WEBHOOK 환경변수가 필요합니다.");
  process.exit(1);
}

// Discord embed color (decimal RGB)
const COLORS = {
  success: 0x2ecc71, // 초록
  warn: 0xf1c40f, // 노랑
  info: 0x5865f2, // 블루
  danger: 0xe74c3c, // 빨강
  neutral: 0x95a5a6, // 회색
};

const STATUS_CONFIG = {
  "pr-opened": {
    emoji: "🛠️",
    title: "Auto-Fix: Draft PR 생성됨",
    color: COLORS.success,
    intent: "사람 리뷰 대기",
  },
  skipped: {
    emoji: "⏭️",
    title: "Auto-Fix: 스킵됨",
    color: COLORS.info,
    intent: "자동 수정 대상 아님",
  },
  "no-commit": {
    emoji: "🤔",
    title: "Auto-Fix: Claude가 SKIP",
    color: COLORS.warn,
    intent: "분석 후 수정하지 않음 (근본 원인 불명확 등)",
  },
  failed: {
    emoji: "❌",
    title: "Auto-Fix: 워크플로 실패",
    color: COLORS.danger,
    intent: "인프라/권한 문제 가능성 — 로그 확인 필요",
  },
};

const REASON_DESCRIPTIONS = {
  killswitch: "`AUTO_FIX_DISABLED` 파일 존재 — 파이프라인 전체 비활성화됨",
  "guarded-path":
    "민감 경로(결제/인증/OAuth/마이그레이션/env)에서 발생한 에러 — 사람 확인 필수",
  "branch-exists":
    "동일 fingerprint 브랜치가 이미 존재 — 이전 PR이 아직 처리 중",
  "attempts-exceeded":
    "같은 fingerprint로 3회 이상 PR 시도 — 사람 개입 필요",
  cooldown:
    "같은 fingerprint의 closed PR 이후 24시간 쿨다운 중",
  "claude-skipped":
    "Claude가 판단 게이트에서 SKIP_REASON 출력 — 근본 원인 불명확 또는 수정 부적합",
  "workflow-error":
    "워크플로 실행 중 예외 발생",
  "uncertain-root-cause":
    "근본 원인 특정 실패 — 방어적 회피 수정 방지를 위해 Claude가 SKIP",
  "verify-failed": "lint/test 3회 반복 실패 — 자동 수정 포기",
};

const config = STATUS_CONFIG[status] ?? {
  emoji: "ℹ️",
  title: `Auto-Fix: ${status}`,
  color: COLORS.neutral,
  intent: "상태 미정의",
};

const truncate = (text, max) => {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

const fields = [];

// 에러 정보 (주요)
if (errorType || errorMessage) {
  fields.push({
    name: "🔥 에러",
    value:
      `**${errorType || "Unknown"}**` +
      (errorMessage
        ? `\n\`\`\`\n${truncate(errorMessage, 800)}\n\`\`\``
        : ""),
    inline: false,
  });
}

// 발생 컨텍스트 (inline 3개 한 줄)
if (path) {
  fields.push({
    name: "📍 Path",
    value: `\`${truncate(path, 64)}\``,
    inline: true,
  });
}
if (statusCode) {
  fields.push({
    name: "🔢 Status",
    value: `\`${statusCode}\``,
    inline: true,
  });
}
if (env) {
  fields.push({
    name: "🌐 Env",
    value: `\`${env}\``,
    inline: true,
  });
}

// Source, fingerprint
if (source) {
  fields.push({
    name: "📡 Source",
    value: `\`${source}\``,
    inline: true,
  });
}
if (fingerprint) {
  fields.push({
    name: "🔖 Fingerprint",
    value: `\`${fingerprint}\``,
    inline: true,
  });
}

// 스킵 사유
if (reason) {
  const desc = REASON_DESCRIPTIONS[reason] ?? `\`${reason}\``;
  fields.push({
    name: "ℹ️ 사유",
    value: desc,
    inline: false,
  });
}

// PR 정보
if (prUrl) {
  const titleLine = prTitle ? `**${truncate(prTitle, 120)}**\n` : "";
  fields.push({
    name: "📝 Draft PR",
    value: `${titleLine}${prUrl}`,
    inline: false,
  });
}

// 워크플로 로그
if (runUrl) {
  fields.push({
    name: "📜 워크플로 로그",
    value: runUrl,
    inline: false,
  });
}

const embed = {
  title: `${config.emoji} ${config.title}`,
  description: config.intent,
  color: config.color,
  fields,
  footer: {
    text: "Life Spoiler · Auto-Fix Pipeline",
  },
  timestamp: new Date().toISOString(),
};

const run = async () => {
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "Auto-Fix Bot",
      embeds: [embed],
    }),
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
