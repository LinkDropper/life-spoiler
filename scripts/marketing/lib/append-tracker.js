#!/usr/bin/env node

/**
 * social-tracker.csv 에 발행 결과 한 행을 append.
 *
 * 환경변수:
 *   TWEET_TEXT    — 본문 (summary 미제공 시 앞 50자 사용)
 *   TWEET_SUMMARY — 한 줄 요약 (선택)
 *   TWEET_TYPE    — 포스트 유형 (cta/knowledge/question/story/trend/empathy)
 *   TWEET_URL     — 발행된 트윗 URL
 *
 * 중복 방지: 같은 URL이 이미 있으면 append 안 함.
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const TRACKER_PATH = path.join(REPO_ROOT, "docs", "social-tracker.csv");

const text = process.env.TWEET_TEXT || "";
const summaryRaw = process.env.TWEET_SUMMARY || "";
const url = process.env.TWEET_URL || "";

if (!url) {
  console.error("TWEET_URL 환경변수가 필요합니다. tracker 기록을 건너뜁니다.");
  process.exit(0);
}

const csvEscape = (value) => {
  const v = String(value ?? "");
  if (v.includes(",") || v.includes("\"") || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
};

const summary = (summaryRaw || text.replace(/\s+/g, " ").slice(0, 50)).trim();
const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
const date = kstNow.toISOString().slice(0, 10);
const time = kstNow.toISOString().slice(11, 16);

if (fs.existsSync(TRACKER_PATH)) {
  const existing = fs.readFileSync(TRACKER_PATH, "utf8");
  if (existing.includes(url)) {
    console.log(`이미 기록된 URL: ${url} — 건너뜀`);
    process.exit(0);
  }
}

const row = [
  date,
  time,
  "x",
  "post",
  csvEscape(summary),
  url,
  "posted",
  csvEscape("GitHub Actions 자동 기록"),
].join(",");

let header = "date,time,platform,type,content_summary,url,status,engagement_notes\n";
if (fs.existsSync(TRACKER_PATH)) {
  header = "";
}

fs.appendFileSync(TRACKER_PATH, `${header}${row}\n`);
console.log(`social-tracker.csv 에 1행 append: ${date} ${time} ${url}`);
