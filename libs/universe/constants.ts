/** owner 소유권 증명 토큰 쿠키명 (Phase 1은 발급만, 검증은 Phase 2) */
export const OWNER_TOKEN_COOKIE = "universe_owner_token";

/** owner 토큰 쿠키 수명 — 1년 */
export const OWNER_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** 게스트 참여 기록 쿠키 접두사. 우주(publicId)마다 별도 쿠키를 쓴다 */
export const GUEST_STAR_SEED_COOKIE_PREFIX = "universe_guest_";

/** 우주(publicId)별 게스트 참여 기록 쿠키명. 한 브라우저가 여러 우주에 참여할 수 있다 */
export const guestStarSeedCookieName = (publicId: string): string =>
  `${GUEST_STAR_SEED_COOKIE_PREFIX}${publicId}`;

/** IP당 우주 생성 상한 (사용자 확정: 일 5회) */
export const UNIVERSE_CREATE_LIMIT_PER_DAY = 5;

/** 우주당 참여 인원 하드캡 (사용자 확정: 300명) */
export const GUEST_LIMIT_PER_UNIVERSE = 300;

/**
 * IP당 친구 등록 상한 (시간당).
 *
 * 사용자 확정 수치가 아니라 fullstack 제안값이다. PRD는 "동일 IP가 짧은 시간 내
 * 여러 우주에 반복 등록하는 패턴을 차단"만 요구하고 수치를 지정하지 않았다.
 * 정상 사용(친구 여러 명이 같은 카페/사무실 와이파이에서 참여)을 막지 않으면서
 * 자동화 도배는 걸리는 선으로 잡았다. 운영 데이터로 조정 전제.
 */
export const GUEST_SUBMIT_LIMIT_PER_HOUR = 30;

/** 시각화에서 개별 렌더링하는 별의 최대 개수 (초과분은 +N 배지) */
export const MAX_RENDERED_STARS = 30;
