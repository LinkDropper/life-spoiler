/**
 * 마케팅 스크립트용 HTTP 클라이언트.
 *
 * Node.js의 네이티브 fetch/https 모듈은 https_proxy 환경변수를 무시하므로,
 * 시스템 curl을 사용하여 OS 레벨 프록시(Anthropic 샌드박스 egress)를 통해
 * 외부 API에 접근합니다.
 *
 * 네트워크 허용 도메인 설정 방법:
 *   [Web 세션] claude.ai/code > 환경 설정 > 네트워크 > 허용 도메인에 추가 후 세션 재시작
 *   [CLI 세션] .claude/settings.json > sandbox.network.allowedDomains 에 추가
 *
 * 반환값:
 *   { statusCode, headers, body }
 */

const { execFile } = require("child_process");

const proxyRequest = ({ method, url, headers = {}, body }) => {
  return new Promise((resolve, reject) => {
    const args = [
      "-s",
      "-w",
      "\n__CURL_STATUS__%{http_code}",
      "-X",
      method.toUpperCase(),
    ];

    for (const [k, v] of Object.entries(headers)) {
      args.push("-H", `${k}: ${v}`);
    }

    if (body !== undefined && body !== null) {
      args.push("--data-binary", body);
    }

    args.push(url);

    execFile(
      "curl",
      args,
      { encoding: "utf8", timeout: 30000, maxBuffer: 10 * 1024 * 1024 },
      (err, stdout) => {
        if (err) {
          const host = (() => {
            try {
              return new URL(url).hostname;
            } catch {
              return url;
            }
          })();
          return reject(
            new Error(
              `${host} 연결 실패: ${err.message}\n` +
                `→ Web 세션이라면 claude.ai/code 환경 설정 > 네트워크 > 허용 도메인에 '${host}'를 추가하고 세션을 재시작하세요.`
            )
          );
        }

        const lastNewline = stdout.lastIndexOf("\n");
        const statusLine = stdout.substring(lastNewline + 1);
        const statusCode = parseInt(
          statusLine.replace("__CURL_STATUS__", ""),
          10
        );
        const responseBody = stdout.substring(0, lastNewline);

        resolve({ statusCode, headers: {}, body: responseBody });
      }
    );
  });
};

module.exports = { proxyRequest };
