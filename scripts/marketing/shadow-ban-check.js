#!/usr/bin/env node

/**
 * Shadow ban 자동 감지 (post-approval.md G7)
 *
 * 사용법:
 *   node scripts/marketing/shadow-ban-check.js < x-metrics.csv
 *   또는: node scripts/marketing/shadow-ban-check.js --csv path/to/x-metrics.csv
 *
 * 동작:
 *   - x-metrics.js 출력에서 직전 5건의 impressions 평균을 계산
 *   - 평균 < 30이면 docs/strategy/auto-post-disabled 자동 생성 (Kill switch 활성화)
 *   - GITHUB_OUTPUT에 shadow_ban_detected, avg_impressions 출력
 *   - 메트릭이 5건 미만이면 판정 보류(통과 처리)
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const KILL_SWITCH_PATH = path.join(
  REPO_ROOT,
  "docs",
  "strategy",
  "auto-post-disabled"
);
const THRESHOLD = 30;
const SAMPLE_SIZE = 5;

const writeOutput = (key, value) => {
  if (!process.env.GITHUB_OUTPUT) return;
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
};

const readCsv = () => {
  const args = process.argv.slice(2);
  const csvIdx = args.indexOf("--csv");
  if (csvIdx !== -1 && args[csvIdx + 1]) {
    return fs.readFileSync(args[csvIdx + 1], "utf8");
  }
  return fs.readFileSync(0, "utf8");
};

const parseImpressions = (csv) => {
  const lines = csv.split("\n").filter((l) => l.trim());
  if (lines.length <= 1) return [];

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const impIdx = header.findIndex((h) => h === "impressions" || h === "impression_count");
  if (impIdx === -1) return [];

  return lines
    .slice(1)
    .map((line) => {
      const cols = line.split(",");
      const v = parseInt(cols[impIdx], 10);
      return Number.isFinite(v) ? v : null;
    })
    .filter((v) => v !== null);
};

const enableKillSwitch = (avg) => {
  const content = `자동 발행 중단 (Shadow ban 자동 감지)

생성일: ${new Date().toISOString()}
사유: 직전 ${SAMPLE_SIZE}건 평균 impressions ${avg.toFixed(1)} (임계값 ${THRESHOLD} 미만)
재개 조건:
1. X Account analytics에서 reach 회복 확인
2. 사용자가 본 파일을 수동 삭제
3. 필요 시 Phase 단계 후퇴

post-approval.md G7 규칙에 따라 shadow-ban-check.js가 자동 생성한 파일입니다.
`;
  fs.writeFileSync(KILL_SWITCH_PATH, content);
};

const main = () => {
  const csv = readCsv();
  const impressions = parseImpressions(csv);

  if (impressions.length < SAMPLE_SIZE) {
    console.log(
      `샘플 부족 (${impressions.length}/${SAMPLE_SIZE}건) — shadow ban 판정 보류`
    );
    writeOutput("shadow_ban_detected", "false");
    writeOutput("avg_impressions", "0");
    return;
  }

  const sample = impressions.slice(0, SAMPLE_SIZE);
  const avg = sample.reduce((a, b) => a + b, 0) / sample.length;

  console.log(`직전 ${SAMPLE_SIZE}건 평균 impressions: ${avg.toFixed(1)}`);
  writeOutput("avg_impressions", avg.toFixed(1));

  if (avg < THRESHOLD) {
    console.error(
      `Shadow ban 의심 (평균 ${avg.toFixed(1)} < ${THRESHOLD}). Kill switch 활성화.`
    );
    if (fs.existsSync(KILL_SWITCH_PATH)) {
      console.log("Kill switch 이미 활성 상태");
    } else {
      enableKillSwitch(avg);
      console.log(`Kill switch 파일 생성: ${KILL_SWITCH_PATH}`);
    }
    writeOutput("shadow_ban_detected", "true");
    process.exit(0);
  }

  console.log("Shadow ban 미감지");
  writeOutput("shadow_ban_detected", "false");
};

main();
