/**
 * 마케팅 스크립트용 프록시 HTTP 클라이언트.
 *
 * 스케쥴러 샌드박스는 외부 도메인(api.twitter.com, discord.com, googleapis.com)에
 * 직접 egress가 차단되어 있어, life-spoiler.com의 /api/internal/proxy를
 * 경유하여 요청을 전달한다.
 *
 * 환경변수:
 *   PROXY_URL       기본값: https://life-spoiler.com/api/internal/proxy
 *   PROXY_TOKEN     Bearer 토큰 (Vercel의 INTERNAL_API_TOKEN과 동일)
 *
 * 반환값:
 *   { statusCode, headers, body }
 */

const DEFAULT_PROXY_URL = "https://life-spoiler.com/api/internal/proxy";

const proxyRequest = async ({ method, url, headers = {}, body }) => {
  const proxyUrl = process.env.PROXY_URL || DEFAULT_PROXY_URL;
  const token = process.env.PROXY_TOKEN;

  if (!token) {
    throw new Error("PROXY_TOKEN 환경변수가 설정되지 않았습니다.");
  }

  const res = await fetch(proxyUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ method, url, headers, body }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`프록시 요청 실패 (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return {
    statusCode: data.status,
    headers: data.headers || {},
    body: data.body || "",
  };
};

module.exports = { proxyRequest };
