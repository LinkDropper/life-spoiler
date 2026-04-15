// Supabase Edge Function: ingest-error
//
// Vercel Log Drain의 runtime 로그를 수신하여:
//   1. 서명 검증 (x-vercel-signature, HMAC-SHA1)
//   2. 5xx / uncaught exception 필터
//   3. Guarded path 필터 (결제/인증/OAuth/migrations/env)
//   4. fingerprint 생성 (sha256(error.name + top app frame).slice(0,12))
//   5. PII 마스킹
//   6. Discord 알림 (Phase 1: 관측만)
//      Phase 2에서 GitHub repository_dispatch 호출 추가 예정.
//
// 환경변수:
//   VERCEL_LOG_DRAIN_SECRET : Vercel Log Drain secret (HMAC 검증)
//   DISCORD_OPS_WEBHOOK     : 운영 알림용 Discord 웹훅 URL
//   PHASE                   : "observe" (기본) | "dispatch" — Phase 2 전환용
//   GITHUB_DISPATCH_TOKEN   : (PHASE=dispatch일 때) repo dispatch PAT
//   GITHUB_REPO             : (PHASE=dispatch일 때) "owner/repo"

const GUARDED_PATH_PATTERNS: RegExp[] = [
  /^\/api\/pay(\/|$)/,
  /^\/api\/auth(\/|$)/,
  /\/oauth\//,
  /\/callback(\/|$)/,
];

const GUARDED_STACK_PATTERNS: RegExp[] = [
  /app\/api\/pay\//,
  /app\/api\/auth\//,
  /libs\/services\/oauth\//,
  /supabase\/migrations\//,
  /\/env\.ts(:|$)/,
];

interface VercelLogEntry {
  id?: string;
  timestamp?: number;
  message?: string;
  level?: string;
  source?: string;
  statusCode?: number;
  path?: string;
  host?: string;
  requestId?: string;
  environment?: string;
  proxy?: { statusCode?: number; path?: string };
  [key: string]: unknown;
}

interface NormalizedError {
  fingerprint: string;
  source: "vercel";
  errorType: string;
  message: string;
  stack: string;
  path: string | null;
  statusCode: number | null;
  environment: string | null;
  rawExcerpt: string;
}

const verifySignature = async (
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> => {
  if (!signatureHeader) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody)
  );
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return timingSafeEqual(hex, signatureHeader);
};

const timingSafeEqual = (a: string, b: string): boolean => {
  // 길이가 다른 경우에도 fixed-time으로 비교해 길이 정보를 노출하지 않는다.
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i += 1) {
    diff |= a.charCodeAt(i % Math.max(a.length, 1)) ^
      b.charCodeAt(i % Math.max(b.length, 1));
  }
  return diff === 0 && a.length === b.length;
};

const parsePayload = (body: string): VercelLogEntry[] => {
  const trimmed = body.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    return JSON.parse(trimmed) as VercelLogEntry[];
  }
  const entries: VercelLogEntry[] = [];
  for (const line of trimmed.split("\n")) {
    if (line.trim().length === 0) continue;
    try {
      entries.push(JSON.parse(line) as VercelLogEntry);
    } catch (e) {
      console.warn("NDJSON 라인 파싱 실패, 건너뜀", e);
    }
  }
  return entries;
};

const isErrorEntry = (entry: VercelLogEntry): boolean => {
  const status = entry.statusCode ?? entry.proxy?.statusCode ?? 0;
  if (status >= 500) return true;
  if (entry.level === "error") return true;
  const msg = entry.message ?? "";
  return /uncaught|unhandled|TypeError|ReferenceError/i.test(msg);
};

const isGuarded = (path: string | null, stack: string): boolean => {
  if (path) {
    if (GUARDED_PATH_PATTERNS.some((re) => re.test(path))) return true;
  }
  return GUARDED_STACK_PATTERNS.some((re) => re.test(stack));
};

const maskPII = (text: string): string => {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "<email>")
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "<uuid>")
    .replace(/\b(sk|pk|ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_-]{20,}\b/g, "<token>")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer <token>");
};

const extractTopAppFrame = (stack: string): string => {
  const lines = stack.split("\n");
  for (const line of lines) {
    if (/node_modules|node:internal/.test(line)) continue;
    const match = line.match(/at\s+.*?\(?([^\s()]+\.(?:ts|tsx|js|jsx)):(\d+):(\d+)\)?/);
    if (match) {
      return `${match[1]}:${match[2]}`;
    }
  }
  return "unknown";
};

const extractErrorType = (message: string): string => {
  const match = message.match(/\b([A-Z][a-zA-Z]*(?:Error|Exception))\b/);
  return match ? match[1] : "RuntimeError";
};

const sha256Hex = async (text: string): Promise<string> => {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const normalize = async (
  entry: VercelLogEntry
): Promise<NormalizedError | null> => {
  const rawMessage = entry.message ?? "";
  if (!rawMessage) return null;

  const maskedMessage = maskPII(rawMessage);
  const stack = maskedMessage;
  const topFrame = extractTopAppFrame(stack);
  const errorType = extractErrorType(maskedMessage);
  const path = entry.path ?? entry.proxy?.path ?? null;
  const fpSource = `${errorType}|${topFrame}|${path ?? ""}`;
  const fingerprint = (await sha256Hex(fpSource)).slice(0, 12);

  return {
    fingerprint,
    source: "vercel",
    errorType,
    message: maskedMessage.split("\n")[0].slice(0, 500),
    stack: stack.slice(0, 4000),
    path,
    statusCode: entry.statusCode ?? entry.proxy?.statusCode ?? null,
    environment: entry.environment ?? null,
    rawExcerpt: maskedMessage.slice(0, 1000),
  };
};

const notifyDiscord = async (
  webhookUrl: string,
  content: string
): Promise<void> => {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "Error Watch", content }),
  });
  if (!res.ok) {
    console.error(`Discord 알림 실패: ${res.status} ${await res.text()}`);
  }
};

const dispatchGithub = async (
  token: string,
  repo: string,
  err: NormalizedError
): Promise<void> => {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: "error-detected",
        client_payload: err,
      }),
    }
  );
  if (!res.ok) {
    console.error(`GitHub dispatch 실패: ${res.status} ${await res.text()}`);
  }
};

const formatAlert = (
  err: NormalizedError,
  tag: "DETECTED" | "GUARDED"
): string => {
  const prefix = tag === "GUARDED" ? "🛡️ Guarded" : "🚨 Detected";
  const lines = [
    `${prefix} \`${err.fingerprint}\` ${err.errorType}`,
    `path: \`${err.path ?? "?"}\` status: ${err.statusCode ?? "?"}`,
    `env: ${err.environment ?? "?"}`,
    "```",
    err.message,
    "```",
  ];
  return lines.join("\n");
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  const secret = Deno.env.get("VERCEL_LOG_DRAIN_SECRET");
  const webhookUrl = Deno.env.get("DISCORD_OPS_WEBHOOK");
  const phase = Deno.env.get("PHASE") ?? "observe";

  if (!secret || !webhookUrl) {
    return new Response("missing env", { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-vercel-signature");
  const signatureOk = await verifySignature(rawBody, signature, secret);
  if (!signatureOk) {
    return new Response("invalid signature", { status: 401 });
  }

  let entries: VercelLogEntry[];
  try {
    entries = parsePayload(rawBody);
  } catch (e) {
    console.error("payload parse failed", e);
    return new Response("bad payload", { status: 400 });
  }

  // 한 payload 안에서 같은 fingerprint가 여러 번 나오면 1번만 알림한다.
  // Discord 웹훅 rate limit(분당 ~30건)과 Edge Function 타임아웃(150s) 방어.
  const seen = new Map<string, { normalized: NormalizedError; guarded: boolean }>();

  for (const entry of entries) {
    if (!isErrorEntry(entry)) continue;
    const normalized = await normalize(entry);
    if (!normalized) continue;
    if (seen.has(normalized.fingerprint)) continue;
    const guarded = isGuarded(normalized.path, normalized.stack);
    seen.set(normalized.fingerprint, { normalized, guarded });
  }

  // 한 payload당 최대 10개 알림까지만 발송. 초과분은 요약 1건으로 대체.
  const MAX_ALERTS = 10;
  const uniqueList = Array.from(seen.values());
  const toAlert = uniqueList.slice(0, MAX_ALERTS);
  const overflow = uniqueList.length - toAlert.length;

  let detected = 0;
  let guarded = 0;

  for (const { normalized, guarded: isGuard } of toAlert) {
    try {
      await notifyDiscord(
        webhookUrl,
        formatAlert(normalized, isGuard ? "GUARDED" : "DETECTED")
      );
    } catch (e) {
      console.error("Discord 알림 예외", e);
    }
    if (isGuard) {
      guarded += 1;
      continue;
    }
    detected += 1;

    if (phase === "dispatch") {
      const token = Deno.env.get("GITHUB_DISPATCH_TOKEN");
      const repo = Deno.env.get("GITHUB_REPO");
      if (token && repo) {
        try {
          await dispatchGithub(token, repo, normalized);
        } catch (e) {
          console.error("GitHub dispatch 예외", e);
        }
      } else {
        console.warn("dispatch phase이지만 GITHUB_* 환경변수 누락");
      }
    }
  }

  if (overflow > 0) {
    try {
      await notifyDiscord(
        webhookUrl,
        `⚠️ payload에 고유 에러 ${uniqueList.length}건 감지, 상위 ${MAX_ALERTS}건만 알림 (${overflow}건 생략)`
      );
    } catch (_e) {
      // swallow
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      detected,
      guarded,
      total: entries.length,
      unique: uniqueList.length,
      overflow,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
