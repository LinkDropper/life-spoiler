/**
 * X 발행 안전 게이트
 *
 * 1일 1건 상한과 jitter 지연만 강제합니다.
 * 모든 게이트 함수는 { ok: boolean, reason?: string } 형태로 결과를 반환합니다.
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const TRACKER_PATH = path.join(REPO_ROOT, "docs", "social-tracker.csv");

const DAILY_LIMIT = 1;

const todayKst = () => {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
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

const checkDailyLimit = (rows = parseTracker()) => {
  const today = todayKst();
  const todayPosted = rows.filter(
    (r) => r.date === today && r.platform === "x" && r.status === "posted"
  ).length;
  if (todayPosted >= DAILY_LIMIT) {
    return {
      ok: false,
      reason: `일일 상한 초과 (${todayPosted}/${DAILY_LIMIT}건)`,
    };
  }
  return { ok: true, todayPosted };
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

const runAllGates = (_text) => {
  const rows = parseTracker();
  const result = checkDailyLimit(rows);
  if (!result.ok) return result;
  return { ok: true };
};

module.exports = {
  DAILY_LIMIT,
  parseTracker,
  checkDailyLimit,
  computeJitterDelaySeconds,
  runAllGates,
};
