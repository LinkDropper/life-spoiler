#!/usr/bin/env node

/**
 * 네이버 트렌드 감지 (시드 키워드 자동 확장 버전)
 *
 * 1. 고정 시드 키워드에서 네이버 자동완성으로 연관 키워드 확장 (20~50개)
 * 2. 확장된 키워드 풀에 대해 네이버 데이터랩 Search API로 30일 검색량 조회
 * 3. 최근 7일 평균 vs 직전 평균 비교 → rising 감지
 * 4. 신호 크기(recent7_avg) 최소값 필터로 노이즈 제거
 *
 * 사용법:
 *   node scripts/marketing/naver-trends.js
 *   node scripts/marketing/naver-trends.js --days 30 --seeds "자미두수,사주,MBTI"
 *   node scripts/marketing/naver-trends.js --per-seed 5 --min-signal 5
 *
 * 옵션:
 *   --days        : 조회 기간 (기본 30일, 최대 90)
 *   --seeds       : 쉼표로 구분된 시드 키워드 (기본: 하드코딩된 8개)
 *   --per-seed    : 시드당 가져올 자동완성 후보 수 (기본 5)
 *   --min-signal  : rising 판정에 필요한 최소 recent7_avg (기본 5.0, 이하는 노이즈로 간주)
 *   --rising-pct  : rising 판정 임계값 (기본 20%)
 *   --json        : raw 결과를 JSON으로 출력
 *
 * 환경변수:
 *   NAVER_CLIENT_ID, NAVER_CLIENT_SECRET (데이터랩 호출용)
 */

const { proxyRequest } = require("./lib/proxy-fetch");

const clientId = process.env.NAVER_CLIENT_ID;
const clientSecret = process.env.NAVER_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(
    "Error: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 환경변수가 필요합니다."
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
};

const jsonMode = args.includes("--json");
const days = Math.min(parseInt(getArg("days") || "30", 10), 90);
const perSeed = parseInt(getArg("per-seed") || "5", 10);
const minSignal = parseFloat(getArg("min-signal") || "5");
const risingPct = parseFloat(getArg("rising-pct") || "20");

const DEFAULT_SEEDS = [
  "자미두수",
  "사주",
  "MBTI",
  "연애운",
  "이상형",
  "성격유형",
  "궁합",
  "운세",
];

const seeds = (getArg("seeds") || DEFAULT_SEEDS.join(","))
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const formatDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
};

const NOISE_PATTERNS = [
  /^\d+$/,
  /^[a-zA-Z]$/,
  /(뜻|의미|무료|사이트|어플|앱|링크|사기)/,
];

const isNoise = (kw) => {
  if (!kw || kw.length < 2 || kw.length > 20) return true;
  return NOISE_PATTERNS.some((p) => p.test(kw));
};

const fetchAutoComplete = async (query) => {
  const url = `https://ac.search.naver.com/nx/ac?q=${encodeURIComponent(
    query
  )}&r_format=json&r_enc=UTF-8&q_enc=UTF-8&st=100&frm=nv&r_lt=100`;

  const { statusCode, body } = await proxyRequest({
    method: "GET",
    url,
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  if (statusCode !== 200) {
    throw new Error(`자동완성 오류 (${statusCode}): ${body.slice(0, 200)}`);
  }

  const data = JSON.parse(body);
  const items = (data.items && data.items[0]) || [];
  return items
    .map((it) => (Array.isArray(it) ? it[0] : null))
    .filter((v) => typeof v === "string");
};

const expandSeeds = async () => {
  const pool = new Map();
  for (const seed of seeds) {
    pool.set(seed, { keyword: seed, source: "seed" });
  }

  for (const seed of seeds) {
    try {
      const suggestions = await fetchAutoComplete(seed);
      let added = 0;
      for (const s of suggestions) {
        if (added >= perSeed) break;
        if (pool.has(s)) continue;
        if (isNoise(s)) continue;
        pool.set(s, { keyword: s, source: `auto:${seed}` });
        added += 1;
      }
    } catch (err) {
      console.error(`시드 "${seed}" 자동완성 실패: ${err.message}`);
    }
  }

  return Array.from(pool.values());
};

const requestDataLab = async (keywordGroups) => {
  const body = JSON.stringify({
    startDate: formatDate(days),
    endDate: formatDate(0),
    timeUnit: "date",
    keywordGroups,
  });

  const { statusCode, body: responseBody } = await proxyRequest({
    method: "POST",
    url: "https://openapi.naver.com/v1/datalab/search",
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
      "Content-Type": "application/json",
    },
    body,
  });

  if (statusCode !== 200) {
    throw new Error(
      `데이터랩 오류 (${statusCode}): ${responseBody.slice(0, 300)}`
    );
  }

  return JSON.parse(responseBody);
};

const analyzeGroup = (result) => {
  const points = result.data;
  if (points.length < 10) {
    return { insufficient: true };
  }

  const last7 = points.slice(-7);
  const prev = points.slice(0, points.length - 7);
  const avg = (arr) =>
    arr.reduce((sum, p) => sum + p.ratio, 0) / arr.length;
  const recent7Avg = avg(last7);
  const prevAvg = avg(prev);
  const changePct =
    prevAvg === 0 ? 0 : ((recent7Avg - prevAvg) / prevAvg) * 100;

  const peak = points.reduce((max, p) => (p.ratio > max.ratio ? p : max));

  const rising = changePct >= risingPct && recent7Avg >= minSignal;

  return {
    insufficient: false,
    recent7Avg,
    prevAvg,
    changePct,
    rising,
    peak,
  };
};

const run = async () => {
  const pool = await expandSeeds();
  console.error(
    `확장 완료: 시드 ${seeds.length}개 → 총 ${pool.length}개 키워드`
  );

  const allResults = [];

  // 데이터랩은 한 요청당 최대 5 키워드 그룹. 각 그룹 1개 키워드로 개별 분석.
  for (let i = 0; i < pool.length; i += 5) {
    const batch = pool.slice(i, i + 5);
    const groups = batch.map((entry) => ({
      groupName: entry.keyword,
      keywords: [entry.keyword],
    }));

    try {
      const data = await requestDataLab(groups);
      for (let j = 0; j < data.results.length; j += 1) {
        const result = data.results[j];
        const entry = batch[j];
        const analysis = analyzeGroup(result);
        allResults.push({ ...entry, ...analysis, raw: result });
      }
    } catch (err) {
      console.error(`배치 실패 (offset ${i}): ${err.message}`);
    }
  }

  if (jsonMode) {
    console.log(JSON.stringify(allResults, null, 2));
    return;
  }

  allResults.sort((a, b) => (b.changePct || -Infinity) - (a.changePct || -Infinity));

  console.log(
    "keyword,source,recent7_avg,prev_avg,change_pct,rising,peak_date,peak_ratio"
  );
  for (const r of allResults) {
    if (r.insufficient) {
      console.log(`${r.keyword},${r.source},,,,insufficient_data,,`);
      continue;
    }
    const rising = r.rising ? "rising" : "stable";
    console.log(
      `${r.keyword},${r.source},${r.recent7Avg.toFixed(1)},${r.prevAvg.toFixed(1)},${r.changePct.toFixed(1)}%,${rising},${r.peak.period},${r.peak.ratio}`
    );
  }

  const risingCount = allResults.filter((r) => r.rising).length;
  console.error(
    `\n분석 완료: ${allResults.length}개 키워드 중 rising ${risingCount}개 (min_signal=${minSignal}, rising_pct=${risingPct}%)`
  );
};

run().catch((err) => {
  console.error(`네이버 트렌드 수집 실패: ${err.message}`);
  process.exit(1);
});
