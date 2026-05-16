#!/usr/bin/env node

/**
 * X 발행 사전 검증 (일일 상한 + jitter)
 *
 * 사용법:
 *   node scripts/marketing/preflight-check.js
 *   환경변수 TWEET_TEXT에 발행 예정 본문이 있어야 합니다.
 *
 * 동작:
 *   - 일일 상한(1건) 검증
 *   - 통과 시 jitter 지연(초)을 GITHUB_OUTPUT에 jitter_seconds로 출력
 *   - 실패 시 exit 1, 사유를 GITHUB_OUTPUT에 fail_reason으로 출력
 */

const fs = require("fs");
const { runAllGates, computeJitterDelaySeconds } = require("./lib/safety-gate");

const writeOutput = (key, value) => {
  if (!process.env.GITHUB_OUTPUT) return;
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
};

const main = () => {
  const text = process.env.TWEET_TEXT;
  if (!text) {
    console.error("TWEET_TEXT 환경변수가 필요합니다.");
    process.exit(1);
  }

  const result = runAllGates(text);
  if (!result.ok) {
    console.error(`Preflight 실패: ${result.reason}`);
    writeOutput("fail_reason", result.reason);
    writeOutput("passed", "false");
    process.exit(1);
  }

  const jitterSeconds = computeJitterDelaySeconds();
  console.log(`Preflight 통과. jitter ${jitterSeconds}초 대기.`);
  writeOutput("passed", "true");
  writeOutput("jitter_seconds", String(jitterSeconds));
};

main();
