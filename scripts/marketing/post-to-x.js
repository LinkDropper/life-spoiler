#!/usr/bin/env node

/**
 * X (Twitter) 자동 발행 스크립트
 *
 * 사용법:
 *   node scripts/marketing/post-to-x.js --text "포스트 내용"
 *
 * 환경변수:
 *   X_API_KEY - API Key
 *   X_API_SECRET - API Key Secret
 *   X_ACCESS_TOKEN - Access Token
 *   X_ACCESS_SECRET - Access Token Secret
 */

const crypto = require("crypto");
const https = require("https");

const args = process.argv.slice(2);

const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
};

const text = getArg("text");

const config = {
  apiKey: process.env.X_API_KEY,
  apiSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
};

if (!text) {
  console.error("Error: --text 인자가 필요합니다.");
  process.exit(1);
}

const missingKeys = Object.entries(config)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missingKeys.length > 0) {
  console.error(
    `Error: 환경변수가 설정되지 않았습니다: ${missingKeys.join(", ")}`
  );
  console.error(
    "X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET을 .env.local에 설정하세요."
  );
  process.exit(1);
}

const percentEncode = (str) =>
  encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );

const generateOAuthSignature = (method, url, params) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join("&");

  const baseString = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(sortedParams),
  ].join("&");

  const signingKey = `${percentEncode(config.apiSecret)}&${percentEncode(config.accessSecret)}`;

  return crypto
    .createHmac("sha1", signingKey)
    .update(baseString)
    .digest("base64");
};

const generateOAuthHeader = (method, url) => {
  const oauthParams = {
    oauth_consumer_key: config.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: config.accessToken,
    oauth_version: "1.0",
  };

  oauthParams.oauth_signature = generateOAuthSignature(
    method,
    url,
    oauthParams
  );

  const header = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(", ");

  return `OAuth ${header}`;
};

const postTweet = (tweetText) => {
  const url = "https://api.twitter.com/2/tweets";
  const body = JSON.stringify({ text: tweetText });
  const authHeader = generateOAuthHeader("POST", url);

  const options = {
    hostname: "api.twitter.com",
    path: "/2/tweets",
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode === 201) {
          const result = JSON.parse(data);
          console.log(`트윗 발행 완료: https://x.com/i/status/${result.data.id}`);
          resolve(result);
        } else {
          console.error(`X API 오류 (${res.statusCode}): ${data}`);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on("error", (err) => {
      console.error(`요청 실패: ${err.message}`);
      reject(err);
    });

    req.write(body);
    req.end();
  });
};

postTweet(text).catch(() => process.exit(1));
