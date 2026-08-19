// 클라이언트 번들에 포함되는 모듈이라 배럴 대신 상수 모듈을 직접 가리킨다
// (배럴을 쓰면 계산기·명반 생성 코드까지 함께 끌려온다)
import {
  FRIEND_COMPATIBILITY_MAX_SCORE,
  FRIEND_COMPATIBILITY_MIN_SCORE,
} from "@/libs/zi-wei-dou-shu/constants/friend-compatibility-table";

/**
 * 점수 → 별 시각 속성 매핑 (designer 확정, CPO 승인).
 *
 * 정의역은 이론적 0~100이 아니라 엔진의 실제 clamp 경계(12~99)다.
 * 실사용 점수가 12~99에만 존재하므로 0~100으로 매핑하면 변별력을 잃는다.
 * 경계값을 하드코딩하지 않고 엔진 상수를 import해 항상 동기화되게 한다.
 *
 * **정의역은 우주마다 바꾸지 않는다.** `estimated`(시간 미상) 우주는 점수 폭이 좁지만,
 * 우주별로 정의역을 좁히면 같은 70점이 우주마다 다른 크기로 보여
 * 사용자 간 스크린샷 비교가 깨진다.
 */
const SCORE_DOMAIN_MIN = FRIEND_COMPATIBILITY_MIN_SCORE;
const SCORE_DOMAIN_MAX = FRIEND_COMPATIBILITY_MAX_SCORE;
const EASE_EXPONENT = 1.6;

export interface StarVisual {
  diameterPx: number;
  coreOpacity: number;
  glowBlurPx: number;
  glowSpreadPx: number;
  glowAlpha: number;
}

/** owner 별은 점수 매핑과 무관한 고정값 */
export const OWNER_STAR_VISUAL: StarVisual = {
  diameterPx: 44,
  coreOpacity: 1,
  glowBlurPx: 28,
  glowSpreadPx: 4,
  glowAlpha: 0.6,
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const getStarVisual = (score: number): StarVisual => {
  const clamped = clamp(score, SCORE_DOMAIN_MIN, SCORE_DOMAIN_MAX);
  const t =
    (clamped - SCORE_DOMAIN_MIN) / (SCORE_DOMAIN_MAX - SCORE_DOMAIN_MIN);
  const eased = Math.pow(t, EASE_EXPONENT);

  return {
    diameterPx: Math.round(10 + 22 * eased),
    coreOpacity: Number((0.55 + 0.45 * eased).toFixed(2)),
    /*
      55~80점 구간의 변별력은 직경이 아니라 glow가 담당한다 (designer 최종안).
      직경을 더 키우면 원끼리 겹쳤을 때 렌더링 버그처럼 보이지만,
      부드러운 glow끼리 겹치는 것은 성운처럼 자연스럽게 읽힌다.
      그래서 직경(10~32px)은 동결하고 blur만 4~28px로 넓혔다.
    */
    glowBlurPx: Math.round(4 + 24 * eased),
    glowSpreadPx: Math.round(0 + 4 * eased),
    glowAlpha: Number((0.25 + 0.45 * eased).toFixed(2)),
  };
};

/**
 * star_seed → 0~1 실수 (결정론적).
 *
 * `Math.random()`을 쓰면 SSR/CSR hydration이 어긋나고 리렌더마다 별이 튄다.
 * seed는 DB가 발급한 불변값이므로 같은 별은 항상 같은 값을 얻는다.
 * FNV-1a 해시 후 salt별로 다른 스트림을 뽑는다.
 */
const hashSeed = (seed: string, salt: number): number => {
  let hash = 0x811c9dc5 ^ salt;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return ((hash >>> 0) % 100000) / 100000;
};

export interface StarPlacement {
  /** 컨테이너 기준 좌측 비율 (0~1) */
  leftRatio: number;
  /** 컨테이너 기준 상단 비율 (0~1) */
  topRatio: number;
  /** twinkle 애니메이션 위상 (음수 delay, 초) */
  twinkleDelaySeconds: number;
  /** float 애니메이션 위상 (음수 delay, 초) */
  floatDelaySeconds: number;
}

/**
 * 30위 밖 본인 별 전용 궤도의 반경비.
 *
 * 이름 라벨의 가로 여유가 7.8px로 얇으므로 이 값을 더 키우지 않는다.
 * (라벨은 `max-width: 56px` + padding 12px로 상한이 고정되어 이보다 넓어지지 않는다)
 *
 * `libs/universe/placement.ts`가 이 지점을 "이미 점유된 좌표"로 취급해 신규 별
 * 배치 시 항상 회피하므로 export한다.
 */
export const OVERFLOW_SELF_RADIUS_RATIO = 0.49;

/**
 * 오버플로 별의 고정 각도(40°, 우하단).
 *
 * seed 기반 랜덤 각도를 쓰지 않는다: 한 화면에 최대 1개(본인 별)뿐이라 흩뿌릴 이유가 없고,
 * 위치가 고정되어야 재방문 시 "내 별은 항상 여기"라는 예측 가능성이 생긴다.
 * (twinkle/float 위상은 계속 seed 기반이라 개성은 유지된다)
 */
export const OVERFLOW_SELF_ANGLE_RADIANS = (40 * Math.PI) / 180;

const TWINKLE_DURATION_SECONDS = 4.2;
const FLOAT_DURATION_SECONDS = 7.5;

/**
 * 별의 렌더 좌표를 계산한다.
 *
 * 일반 별은 등록 시점에 서버(`libs/universe/placement.ts`)가 랜덤 산출해 DB에
 * 영구 저장한 좌표를 그대로 돌려준다 — 여기서는 좌표를 다시 계산하지 않는다
 * (재계산하면 다른 친구 등록/점수 변화에 따라 위치가 흔들리는 문제가 되살아난다).
 * twinkle/float 애니메이션 위상만 star_seed 해시 기반으로 결정론적으로 계산한다
 * (리렌더마다 별이 튀지 않도록).
 *
 * 오버플로 본인 별(30위 밖이지만 항상 개별 렌더링되는 "방금 등록한 본인 별")은
 * 저장된 좌표를 무시하고 항상 고정 궤도(40°)를 쓴다 — 두 링의 슬롯이 꽉 차 있던
 * 시절의 유산이 아니라, "자기 별이 항상 같은 자리에 보여야 한다"는 요구사항 자체이므로
 * 랜덤 배치로 전환된 뒤에도 유지한다.
 */
export const getStarPlacement = (
  starSeed: string,
  position: { xRatio: number; yRatio: number },
  isOverflowSelf = false
): StarPlacement => {
  const { leftRatio, topRatio } = isOverflowSelf
    ? {
        leftRatio:
          0.5 +
          Math.cos(OVERFLOW_SELF_ANGLE_RADIANS) * OVERFLOW_SELF_RADIUS_RATIO,
        topRatio:
          0.5 +
          Math.sin(OVERFLOW_SELF_ANGLE_RADIANS) * OVERFLOW_SELF_RADIUS_RATIO,
      }
    : { leftRatio: position.xRatio, topRatio: position.yRatio };

  return {
    leftRatio,
    topRatio,
    twinkleDelaySeconds: -(hashSeed(starSeed, 3) * TWINKLE_DURATION_SECONDS),
    floatDelaySeconds: -(hashSeed(starSeed, 4) * FLOAT_DURATION_SECONDS),
  };
};
