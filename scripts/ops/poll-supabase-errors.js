#!/usr/bin/env node

/**
 * Supabase 자체 에러 폴링 스크립트 (Phase 1 관측용)
 *
 * 목적:
 *   Vercel Log Drain이 잡지 못하는 Supabase 내부 에러(Postgres, Edge Function,
 *   Auth 등)를 주기적으로 조회하여 Discord로 알림을 보낸다.
 *
 * 실행:
 *   node scripts/ops/poll-supabase-errors.js [--since-minutes 60]
 *
 * 환경변수:
 *   SUPABASE_ACCESS_TOKEN  : Supabase Management API PAT
 *   SUPABASE_PROJECT_REF   : 프로젝트 ref (예: abcdefghij)
 *   DISCORD_OPS_WEBHOOK    : 운영 알림용 Discord 웹훅 URL
 *
 * 동작:
 *   1. Management API로 최근 N분 에러 로그 조회 (postgres + edge-function)
 *   2. Edge Function과 동일한 방식으로 fingerprint 생성
 *   3. Guarded path 체크 (stack 기반)
 *   4. Discord에 에러별 1건씩 알림
 *
 * 중복 방지:
 *   Phase 1은 상태 저장 없음 — cron 주기(1h)와 since 윈도우(1h)를 동일하게
 *   설정하면 각 에러는 최대 1번 알림된다. (정확한 dedup은 Phase 2에서 GitHub
 *   라벨 기반으로 처리.)
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const crypto = require("crypto");

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return fallback;
  return args[idx + 1];
};

const SINCE_MINUTES = parseInt(getArg("since-minutes", "60"), 10);
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const DISCORD_WEBHOOK = process.env.DISCORD_OPS_WEBHOOK;

if (!TOKEN || !PROJECT_REF || !DISCORD_WEBHOOK) {
  console.error(
    "Error: SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF, DISCORD_OPS_WEBHOOK 필요"
  );
  process.exit(1);
}

const GUARDED_STACK_PATTERNS = [
  /app\/api\/pay\//,
  /app\/api\/auth\//,
  /libs\/services\/oauth\//,
  /supabase\/migrations\//,
  /\/env\.ts(:|$)/,
];

const maskPII = (text) =>
  text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "<email>")
    .replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
      "<uuid>"
    )
    .replace(/\b(sk|pk|ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_-]{20,}\b/g, "<token>")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer <token>");

const extractErrorType = (message) => {
  const match = message.match(/\b([A-Z][a-zA-Z]*(?:Error|Exception))\b/);
  return match ? match[1] : "RuntimeError";
};

const extractTopFrame = (stack) => {
  for (const line of stack.split("\n")) {
    if (/node_modules|node:internal/.test(line)) continue;
    const m = line.match(
      /at\s+.*?\(?([^\s()]+\.(?:ts|tsx|js|jsx)):(\d+):(\d+)\)?/
    );
    if (m) return `${m[1]}:${m[2]}`;
  }
  return "unknown";
};

const isGuarded = (stack) =>
  GUARDED_STACK_PATTERNS.some((re) => re.test(stack));

const fingerprint = (errorType, topFrame, identifier) =>
  crypto
    .createHash("sha256")
    .update(`${errorType}|${topFrame}|${identifier}`)
    .digest("hex")
    .slice(0, 12);

const queryLogs = async (source) => {
  // Supabase Logflare 테이블은 timestamp를 microseconds(epoch)로 저장한다.
  const sinceMicros = (Date.now() - SINCE_MINUTES * 60_000) * 1000;
  const sql = `
    select id, timestamp, event_message, metadata
    from ${source}_logs
    where timestamp > ${sinceMicros}
      and (event_message ilike '%error%' or event_message ilike '%exception%')
    order by timestamp desc
    limit 100
  `.trim();

  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/analytics/endpoints/logs.all?sql=${encodeURIComponent(
    sql
  )}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Logs API ${source} 실패 (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.result ?? [];
};

const normalize = (row, source) => {
  const rawMessage = row.event_message ?? "";
  if (!rawMessage) return null;
  const masked = maskPII(rawMessage);
  const errorType = extractErrorType(masked);
  const topFrame = extractTopFrame(masked);
  const fp = fingerprint(errorType, topFrame, source);
  return {
    fingerprint: fp,
    source: `supabase-${source}`,
    errorType,
    message: masked.split("\n")[0].slice(0, 500),
    stack: masked.slice(0, 4000),
    timestamp: row.timestamp,
  };
};

const formatAlert = (err, tag) => {
  const prefix = tag === "GUARDED" ? "🛡️ Guarded" : "🚨 Detected";
  return [
    `${prefix} \`${err.fingerprint}\` [${err.source}] ${err.errorType}`,
    "```",
    err.message,
    "```",
  ].join("\n");
};

const sendDiscord = async (content) => {
  const res = await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "Error Watch", content }),
  });
  if (!res.ok) {
    console.error(`Discord 알림 실패: ${res.status} ${await res.text()}`);
  }
};

const MAX_ALERTS = 10;

const run = async () => {
  // Supabase Logflare 실제 테이블명:
  //   postgres_logs, edge_logs (API gateway), function_logs (Edge Functions)
  const sources = ["postgres", "edge", "function"];
  const unique = new Map(); // fingerprint -> { normalized, guarded }

  for (const source of sources) {
    let rows;
    try {
      rows = await queryLogs(source);
    } catch (e) {
      console.warn(`[${source}] ${e.message}`);
      continue;
    }

    for (const row of rows) {
      const normalized = normalize(row, source);
      if (!normalized) continue;
      if (unique.has(normalized.fingerprint)) continue;
      unique.set(normalized.fingerprint, {
        normalized,
        guarded: isGuarded(normalized.stack),
      });
    }
  }

  const list = Array.from(unique.values());
  const toAlert = list.slice(0, MAX_ALERTS);
  const overflow = list.length - toAlert.length;
  let detected = 0;
  let guarded = 0;

  for (const { normalized, guarded: isGuard } of toAlert) {
    await sendDiscord(formatAlert(normalized, isGuard ? "GUARDED" : "DETECTED"));
    if (isGuard) guarded += 1;
    else detected += 1;
  }

  if (overflow > 0) {
    await sendDiscord(
      `⚠️ 폴링 윈도우 내 고유 에러 ${list.length}건 감지, 상위 ${MAX_ALERTS}건만 알림 (${overflow}건 생략)`
    );
  }

  console.log(
    `완료: 감지 ${detected}건, guarded ${guarded}건 (윈도우 ${SINCE_MINUTES}분)`
  );
};

run().catch((err) => {
  console.error(`폴링 실패: ${err.message}`);
  process.exit(1);
});
