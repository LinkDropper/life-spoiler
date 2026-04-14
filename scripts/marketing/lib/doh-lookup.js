/**
 * DNS-over-HTTPS 기반 lookup 함수.
 *
 * 샌드박스 환경에서 UDP 53 포트가 차단되어 일반 DNS 쿼리가 실패할 때,
 * HTTPS(443)로 Cloudflare DoH(1.1.1.1)에 쿼리하여 이름을 해석한다.
 *
 * 사용 예:
 *   const { dohLookup } = require("./lib/doh-lookup");
 *   https.request({ hostname, path, lookup: dohLookup, ... }, ...);
 *
 * Node의 dns.lookup 시그니처 호환: (hostname, options?, callback).
 */

const https = require("https");

const TTL_MS = 5 * 60 * 1000;
const cache = new Map();

const queryDoh = (hostname) =>
  new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "1.1.1.1",
        path: `/dns-query?name=${encodeURIComponent(hostname)}&type=A`,
        method: "GET",
        headers: { Accept: "application/dns-json" },
        timeout: 5000,
        servername: "cloudflare-dns.com",
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (json.Status !== 0 || !Array.isArray(json.Answer)) {
              reject(
                new Error(
                  `DoH resolve failed for ${hostname} (Status=${json.Status})`
                )
              );
              return;
            }
            const record = json.Answer.find((r) => r.type === 1);
            if (!record) {
              reject(new Error(`No A record for ${hostname}`));
              return;
            }
            resolve(record.data);
          } catch (err) {
            reject(err);
          }
        });
      }
    );

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy(new Error(`DoH timeout for ${hostname}`));
    });
    req.end();
  });

const dohLookup = (hostname, options, callback) => {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }

  const respond = (address) => {
    if (options && options.all) {
      callback(null, [{ address, family: 4 }]);
    } else {
      callback(null, address, 4);
    }
  };

  const cached = cache.get(hostname);
  if (cached && cached.expires > Date.now()) {
    process.nextTick(() => respond(cached.address));
    return;
  }

  queryDoh(hostname)
    .then((address) => {
      cache.set(hostname, { address, expires: Date.now() + TTL_MS });
      respond(address);
    })
    .catch((err) => callback(err));
};

module.exports = { dohLookup };
