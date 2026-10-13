#!/usr/bin/env node

/**
 * IndexNow URL 제출 스크립트
 *
 * IndexNow 참여 엔진(Bing·Naver·Yandex·Seznam 등)에 변경된 URL을 즉시 알린다.
 * Bing 색인은 Copilot 답변의 근거로 쓰이고, 한 엔진에 제출하면 참여 엔진 전체에 공유된다.
 *
 * 사용법:
 *   node scripts/seo/indexnow.mjs                  # sitemap lastmod가 최근 7일 이내인 URL만 제출
 *   node scripts/seo/indexnow.mjs --since-days 30  # 기준 기간 변경
 *   node scripts/seo/indexnow.mjs --all            # sitemap 전체 제출 (최초 1회 / 대규모 변경 시)
 *   node scripts/seo/indexnow.mjs --url https://www.life-spoiler.com/ziwei-doushu
 *   node scripts/seo/indexnow.mjs --dry-run        # 제출 없이 대상 URL만 출력
 *
 * 키:
 *   INDEXNOW_KEY 환경변수 → 없으면 public/{32자 hex}.txt (파일명 = 내용) 에서 자동 탐지.
 *   키 파일은 공개 파일이 맞다 (IndexNow 소유권 확인 방식).
 *
 * 환경변수:
 *   INDEXNOW_KEY : (선택) 키 값
 *   SITE_URL     : (선택) 기본 https://www.life-spoiler.com — libs/seo/site.ts의 SITE_URL과 동일해야 함
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

const SITE_URL = process.env.SITE_URL || "https://www.life-spoiler.com";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const KEY_PATTERN = /^[a-f0-9]{32}$/;
const DEFAULT_SINCE_DAYS = 7;
const MAX_URLS_PER_REQUEST = 10000;

const args = process.argv.slice(2);

const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
};

const hasFlag = (name) => args.includes(`--${name}`);

const findKey = () => {
  if (process.env.INDEXNOW_KEY) return process.env.INDEXNOW_KEY.trim();

  const publicDir = path.join(SCRIPT_DIR, "..", "..", "public");
  const keyFile = fs.readdirSync(publicDir).find((file) => {
    const stem = file.replace(/\.txt$/, "");
    if (stem === file || !KEY_PATTERN.test(stem)) return false;
    return fs.readFileSync(path.join(publicDir, file), "utf8").trim() === stem;
  });

  if (!keyFile) {
    throw new Error(
      "IndexNow 키를 찾지 못했습니다. INDEXNOW_KEY를 지정하거나 public/{키}.txt를 추가하세요."
    );
  }
  return keyFile.replace(/\.txt$/, "");
};

const decodeXml = (value) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

/** sitemap의 각 <url>에서 loc, hreflang 대체 URL, lastmod를 뽑는다. */
const parseSitemap = (xml) =>
  [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, block]) => {
    const loc = block.match(/<loc>([\s\S]*?)<\/loc>/)?.[1];
    const lastmod = block.match(/<lastmod>([\s\S]*?)<\/lastmod>/)?.[1];
    const alternates = [
      ...block.matchAll(/<xhtml:link[^>]*href="([^"]+)"[^>]*\/?>/g),
    ].map(([, href]) => decodeXml(href));

    return {
      urls: [decodeXml(loc.trim()), ...alternates],
      lastmod: lastmod ? new Date(lastmod.trim()) : null,
    };
  });

const fetchText = async (url) => {
  const response = await fetch(url, { redirect: "manual" });
  if (response.status !== 200) {
    throw new Error(`${url} 응답 ${response.status} (200이어야 함)`);
  }
  return response.text();
};

const collectUrls = async () => {
  const explicitUrl = getArg("url");
  if (explicitUrl) return [explicitUrl];

  const entries = parseSitemap(await fetchText(`${SITE_URL}/sitemap.xml`));
  const sinceDays = Number(getArg("since-days") ?? DEFAULT_SINCE_DAYS);
  const threshold = Date.now() - sinceDays * 24 * 60 * 60 * 1000;

  const targets = hasFlag("all")
    ? entries
    : entries.filter(
        ({ lastmod }) => lastmod && lastmod.getTime() >= threshold
      );

  return [...new Set(targets.flatMap(({ urls }) => urls))];
};

const main = async () => {
  const key = findKey();
  const keyLocation = `${SITE_URL}/${key}.txt`;
  const urls = await collectUrls();

  if (urls.length === 0) {
    console.log("제출할 변경 URL이 없습니다.");
    return;
  }

  const { host } = new URL(SITE_URL);
  const foreignUrl = urls.find((url) => new URL(url).host !== host);
  if (foreignUrl) {
    throw new Error(`호스트가 ${host}가 아닌 URL이 있습니다: ${foreignUrl}`);
  }

  console.log(`대상 URL ${urls.length}개:\n${urls.join("\n")}`);

  if (hasFlag("dry-run")) return;

  // 엔진이 키를 확인하러 오기 전에 키 파일이 실제로 배포돼 있는지 먼저 검증한다.
  const servedKey = (await fetchText(keyLocation)).trim();
  if (servedKey !== key) {
    throw new Error(`${keyLocation}의 내용이 키와 다릅니다.`);
  }

  for (let i = 0; i < urls.length; i += MAX_URLS_PER_REQUEST) {
    const urlList = urls.slice(i, i + MAX_URLS_PER_REQUEST);
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key, keyLocation, urlList }),
    });

    // 200: 제출 완료, 202: 접수됨(키 검증 대기). 그 외는 실패.
    if (response.status !== 200 && response.status !== 202) {
      const body = await response.text();
      throw new Error(`IndexNow 제출 실패 (${response.status}): ${body}`);
    }
    console.log(`IndexNow 제출 완료 (${response.status}): ${urlList.length}개`);
  }
};

main().catch((error) => {
  console.error(`❌ ${error.message}`);
  process.exit(1);
});
