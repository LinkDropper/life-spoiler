/**
 * X 발행 안전 게이트 (G1~G6)
 *
 * post-approval.md의 G1~G6 게이트를 코드 레벨로 강제합니다.
 * G7(shadow ban)은 별도 일별 메트릭 잡에서 처리합니다.
 *
 * 모든 함수는 { ok: boolean, reason?: string } 형태로 결과를 반환합니다.
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const KILL_SWITCH_PATH = path.join(
  REPO_ROOT,
  "docs",
  "strategy",
  "auto-post-disabled"
);
const TRACKER_PATH = path.join(REPO_ROOT, "docs", "social-tracker.csv");

const PHASE_TABLE = [
  { id: "phase-1", start: "2026-04-27", end: "2026-05-10", dailyLimit: 1 },
  { id: "phase-2", start: "2026-05-11", end: "2026-05-26", dailyLimit: 2 },
  { id: "phase-3", start: "2026-05-27", end: "9999-12-31", dailyLimit: 3 },
];

const STAR_KEYWORDS = [
  "자미성",
  "탐랑성",
  "파군성",
  "천기성",
  "태양성",
  "태음성",
  "천부성",
  "천상성",
  "천량성",
  "천동성",
  "거문성",
  "염정성",
  "무곡성",
  "칠살성",
];
const PALACE_KEYWORDS = [
  "명궁",
  "재물궁",
  "관록궁",
  "복덕궁",
  "부처궁",
  "부모궁",
  "형제궁",
  "자녀궁",
  "전택궁",
  "교우궁",
  "천이궁",
  "질액궁",
];

const todayKst = () => {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
};

const getCurrentPhase = (date = todayKst()) => {
  for (const phase of PHASE_TABLE) {
    if (date >= phase.start && date <= phase.end) return phase;
  }
  return PHASE_TABLE[PHASE_TABLE.length - 1];
};

const parseTracker = () => {
  if (!fs.existsSync(TRACKER_PATH)) return [];
  const raw = fs.readFileSync(TRACKER_PATH, "utf8");
  const lines = raw.split("\n").filter((l) => l.trim());
  if (lines.length <= 1) return [];

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length < 7) continue;
    rows.push({
      date: cols[0],
      time: cols[1],
      platform: cols[2],
      type: cols[3],
      summary: cols[4],
      url: cols[5],
      status: cols[6],
      notes: cols.slice(7).join(","),
    });
  }
  return rows;
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const checkKillSwitch = () => {
  if (fs.existsSync(KILL_SWITCH_PATH)) {
    return {
      ok: false,
      reason: `G1: kill switch 활성 (${KILL_SWITCH_PATH})`,
    };
  }
  return { ok: true };
};

const checkDailyLimit = (rows = parseTracker()) => {
  const phase = getCurrentPhase();
  const today = todayKst();
  const todayPosted = rows.filter(
    (r) => r.date === today && r.platform === "x" && r.status === "posted"
  ).length;
  if (todayPosted >= phase.dailyLimit) {
    return {
      ok: false,
      reason: `G2: ${phase.id} 일일 상한 초과 (${todayPosted}/${phase.dailyLimit}건)`,
    };
  }
  return { ok: true, phase, todayPosted };
};

const checkSameHour = (rows = parseTracker()) => {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 60 * 60 * 1000);
  const recent = rows
    .filter((r) => r.platform === "x" && r.status === "posted")
    .map((r) => ({ ...r, ts: new Date(`${r.date}T${r.time}:00+09:00`) }))
    .filter((r) => r.ts >= cutoff);
  if (recent.length > 0) {
    return {
      ok: false,
      reason: `G3: 직전 60분 이내 발행 기록 있음 (${recent[recent.length - 1].time})`,
    };
  }
  return { ok: true };
};

const checkLinkPolicy = (text, rows = parseTracker()) => {
  const phase = getCurrentPhase();
  const hasUtmLink = /utm_source=|utm_medium=|utm_campaign=/.test(text);

  if (phase.id === "phase-1" && hasUtmLink) {
    return { ok: false, reason: "G5: Phase 1은 외부 링크 0건 정책" };
  }

  if (phase.id === "phase-2" && hasUtmLink) {
    const cutoff = daysAgo(7);
    const recentLinkPosts = rows.filter(
      (r) =>
        r.date >= cutoff &&
        r.platform === "x" &&
        r.status === "posted" &&
        r.url &&
        r.url.startsWith("http")
    ).length;
    if (recentLinkPosts >= 2) {
      return {
        ok: false,
        reason: `G5: Phase 2 외부 링크 주 2건 상한 도달 (직전 7일 ${recentLinkPosts}건)`,
      };
    }
  }

  return { ok: true };
};

const checkTemplateRepetition = (text, rows = parseTracker()) => {
  const cutoff = daysAgo(7);
  const recentSummaries = rows
    .filter((r) => r.date >= cutoff && r.platform === "x" && r.status === "posted")
    .map((r) => r.summary || "")
    .join(" ");

  const allKeywords = [...STAR_KEYWORDS, ...PALACE_KEYWORDS];
  for (const kw of allKeywords) {
    if (!text.includes(kw)) continue;
    const occurrences = recentSummaries.split(kw).length - 1;
    if (occurrences >= 3) {
      return {
        ok: false,
        reason: `G6: 키워드 "${kw}"가 직전 7일 ${occurrences}회 사용됨 (3회 상한)`,
      };
    }
  }

  if (/오늘의\s*운세.*[1-9]\s*\/\s*[1-9]/.test(text)) {
    return {
      ok: false,
      reason: "G6: 분할 포스트 형식(N/M) 영구 금지 — 단일 포스트로 작성",
    };
  }

  return { ok: true };
};

const computeJitterDelaySeconds = (rows = parseTracker()) => {
  const cutoff = daysAgo(7);
  const recentMinutes = new Set(
    rows
      .filter(
        (r) => r.date >= cutoff && r.platform === "x" && r.status === "posted"
      )
      .map((r) => r.time?.split(":")[1])
      .filter(Boolean)
  );

  let minute;
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = 8 + Math.floor(Math.random() * 45);
    if (!recentMinutes.has(String(candidate).padStart(2, "0"))) {
      minute = candidate;
      break;
    }
  }
  if (minute === undefined) {
    minute = 8 + Math.floor(Math.random() * 45);
  }

  return minute * 60;
};

const runAllGates = (text) => {
  const rows = parseTracker();
  const checks = [
    checkKillSwitch(),
    checkDailyLimit(rows),
    checkSameHour(rows),
    checkLinkPolicy(text, rows),
    checkTemplateRepetition(text, rows),
  ];
  for (const result of checks) {
    if (!result.ok) return result;
  }
  return { ok: true, phase: getCurrentPhase() };
};

module.exports = {
  PHASE_TABLE,
  getCurrentPhase,
  parseTracker,
  checkKillSwitch,
  checkDailyLimit,
  checkSameHour,
  checkLinkPolicy,
  checkTemplateRepetition,
  computeJitterDelaySeconds,
  runAllGates,
};
