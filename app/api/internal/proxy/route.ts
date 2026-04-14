import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

/**
 * 마케팅 스케쥴러 샌드박스가 외부 도메인(api.twitter.com 등)에 직접
 * 접근할 수 없는 환경 제약을 우회하기 위한 HTTP 포워딩 프록시.
 *
 * 보안:
 * - Bearer 토큰(INTERNAL_API_TOKEN) 검증
 * - 목적지 도메인 allowlist 검증 (SSRF 방지)
 *
 * 요청 본문:
 *   {
 *     "method": "POST",
 *     "url": "https://api.twitter.com/2/tweets",
 *     "headers": { "Authorization": "OAuth ..." },
 *     "body": "<string or undefined>"
 *   }
 *
 * 응답:
 *   { status: number, headers: Record<string,string>, body: string }
 */

const ALLOWED_HOSTS = new Set([
  "api.twitter.com",
  "api.x.com",
  "discord.com",
  "discordapp.com",
  "oauth2.googleapis.com",
  "analyticsdata.googleapis.com",
]);

const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

interface ProxyRequestBody {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
}

export const POST = async (request: NextRequest) => {
  const token = process.env.INTERNAL_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "INTERNAL_API_TOKEN 미설정" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: ProxyRequestBody;
  try {
    payload = (await request.json()) as ProxyRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { method, url, headers = {}, body } = payload;

  if (!ALLOWED_METHODS.has(method.toUpperCase())) {
    return NextResponse.json(
      { error: `허용되지 않은 메서드: ${method}` },
      { status: 400 }
    );
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json({ error: "잘못된 URL" }, { status: 400 });
  }

  if (target.protocol !== "https:") {
    return NextResponse.json({ error: "HTTPS만 허용됩니다." }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(target.hostname)) {
    return NextResponse.json(
      { error: `허용되지 않은 호스트: ${target.hostname}` },
      { status: 400 }
    );
  }

  try {
    const upstreamResponse = await fetch(target.toString(), {
      method: method.toUpperCase(),
      headers,
      body: body ?? undefined,
    });

    const responseHeaders: Record<string, string> = {};
    upstreamResponse.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const responseBody = await upstreamResponse.text();

    return NextResponse.json({
      status: upstreamResponse.status,
      headers: responseHeaders,
      body: responseBody,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      { error: `업스트림 요청 실패: ${message}` },
      { status: 502 }
    );
  }
};
