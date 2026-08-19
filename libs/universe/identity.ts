import { createHash, createHmac } from "crypto";

import { customAlphabet } from "nanoid";

import { env } from "@/env";
import { logger } from "@/libs/logger";

/**
 * 공유 링크에 쓰이는 public_id 알파벳.
 * 혼동하기 쉬운 문자(0/O, 1/l/I)를 제외한 소문자+숫자 31자.
 * 12자리 = 약 59.6bit로 열거/추측이 불가능하다.
 * (마이그레이션 005의 CHECK 제약과 동일한 정의 — 바꿀 때 양쪽을 함께 고쳐야 한다)
 */
const PUBLIC_ID_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
const PUBLIC_ID_LENGTH = 12;

const generateId = customAlphabet(PUBLIC_ID_ALPHABET, PUBLIC_ID_LENGTH);

export const generatePublicId = (): string => generateId();

/** URL 파라미터로 들어온 값이 public_id 형식인지 (DB 조회 전 1차 차단) */
export const isValidPublicId = (value: string): boolean =>
  new RegExp(`^[${PUBLIC_ID_ALPHABET}]{${PUBLIC_ID_LENGTH}}$`).test(value);

/** 별 배치 시드 (전역 유니크, DB DEFAULT와 같은 길이) */
export const generateStarSeed = (): string =>
  customAlphabet("0123456789abcdef", 16)();

/** owner 소유권 증명용 원문 토큰 (HttpOnly 쿠키로만 전달) */
export const generateOwnerToken = (): string =>
  customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 32)();

/**
 * owner 토큰 해시.
 *
 * IP와 달리 토큰은 32자 무작위(약 165bit)라 전수 대입이 불가능하므로
 * 단순 SHA-256으로 충분하다. HMAC이 필요한 것은 정의역이 좁은 IP 쪽이다.
 */
export const hashOwnerToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

/**
 * IP 해시.
 *
 * **단순 SHA-256 금지.** IPv4는 정의역이 43억개뿐이라 무염(salt 없는) 해시는
 * 전수 대입으로 몇 분 만에 역산된다. 반드시 서버 시크릿을 키로 하는 HMAC을 쓴다.
 * (CTO 확정 사항)
 */
export const hashIp = (ip: string): string => {
  const secret = env.UNIVERSE_IP_HASH_SECRET;

  if (!secret) {
    throw new Error("UNIVERSE_IP_HASH_SECRET 환경 변수가 설정되지 않았습니다.");
  }

  return createHmac("sha256", secret).update(ip).digest("hex");
};

/**
 * 요청에서 클라이언트 IP를 추출한다.
 *
 * Vercel은 `x-forwarded-for`의 **첫 번째** 항목을 신뢰할 수 있는 클라이언트 IP로 채운다.
 * 클라이언트가 헤더를 위조해도 프록시가 실제 IP를 앞에 붙이므로 첫 항목을 쓴다.
 * IP를 알 수 없으면 null을 반환하고, 호출부는 rate limit을 건너뛴다
 * (IP 미상을 이유로 정상 사용자를 차단하지 않는다).
 */
export const extractClientIp = (request: Request): string | null => {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  return request.headers.get("x-real-ip");
};

/**
 * 시크릿 미설정 경고를 프로세스당 1회만 남기기 위한 플래그.
 * 요청마다 찍으면 로그가 도배되어 오히려 안 보이게 된다.
 */
let hasWarnedMissingSecret = false;

/**
 * 요청 → IP HMAC. rate limit을 적용할 수 없으면 null (fail-open).
 *
 * null이 되는 경로는 두 가지이고 **성격이 완전히 다르다.**
 * - IP를 못 얻음: 정상적으로 일어날 수 있는 일이라 로그를 남기지 않는다.
 * - 시크릿 미설정: **설정 오류**이며 rate limit이 통째로 꺼진 상태다.
 *   조용히 넘어가면 어뷰징이 터지기 전까지 아무도 모르므로 경고를 남긴다.
 */
export const resolveIpHash = (request: Request): string | null => {
  if (!env.UNIVERSE_IP_HASH_SECRET) {
    if (!hasWarnedMissingSecret) {
      hasWarnedMissingSecret = true;
      logger.warn(
        "[universe] UNIVERSE_IP_HASH_SECRET 미설정 — IP 기반 rate limit이 비활성화된 상태로 동작합니다. 프로덕션에서는 반드시 설정해야 합니다."
      );
    }
    return null;
  }

  const ip = extractClientIp(request);

  if (!ip) {
    return null;
  }

  return hashIp(ip);
};
