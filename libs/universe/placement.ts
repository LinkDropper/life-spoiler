// 서버 전용 모듈 — 절대 클라이언트 컴포넌트에서 import하지 않는다.
// (별 좌표는 등록 시점에 한 번만 계산해 DB에 저장하는 서버 로직이라
// 클라이언트가 이 계산을 다시 수행할 이유가 없다. `star-visual.ts`는 반대로
// 클라이언트 번들에 포함되는 모듈이라는 점을 그 파일 상단 주석이 명시하고 있다.)
import {
  getStarVisual,
  OVERFLOW_SELF_ANGLE_RADIANS,
  OVERFLOW_SELF_RADIUS_RATIO,
  OWNER_STAR_VISUAL,
} from "./star-visual";

/**
 * 친구 별 좌표 랜덤 배치.
 *
 * 위치는 등록 시점에 한 번만 산출해 DB에 영구 저장한다. 이후 다른 친구가 등록되든
 * 점수가 어떻든 재조회하든 절대 바뀌지 않는다 — 점수-거리 결합("1등이 owner와 가장
 * 가깝다")은 폐기됐고, 점수는 별의 크기/밝기(`getStarVisual`)에만 남는다.
 *
 * 판정 좌표계는 기존 겹침 회귀 테스트가 쓰던 375px 뷰포트 기준 캔버스(335×352px)를
 * 그대로 재사용한다. 캔버스 종횡비가 CSS로 고정(`aspect-ratio: 1/1.05`)되어 있어
 * px 거리가 균일하게 스케일되므로, 이 기준 크기에서 검증하면 모든 화면 크기에서
 * 유효하다.
 */

/** 375px 뷰포트 기준 캔버스 크기 (기존 회귀 테스트와 동일한 기준) */
export const CANVAS_WIDTH_PX = 335;
export const CANVAS_HEIGHT_PX = 352;

/** 이름 라벨: max-width 56px + 좌우 padding 6px씩, 가운데 정렬 */
const LABEL_HALF_WIDTH_PX = (56 + 12) / 2;

/** getStarVisual 정의역 상한(99점)에서의 반지름. 오버플로 궤도 회피 시 보수적으로 사용한다 */
const MAX_STAR_RADIUS_PX = getStarVisual(99).diameterPx / 2;

const OWNER_RADIUS_PX = OWNER_STAR_VISUAL.diameterPx / 2;

/**
 * 오버플로 본인 별의 고정 궤도 좌표(40°, 반경비 0.49).
 *
 * 이 지점은 "이미 점유된 좌표"로 취급해 항상 회피한다. 기존에는 이 각도가 링2
 * 정원(18)이 만드는 각도 사각지대라 안전했지만, 랜덤 배치에서는 그 구조적 보장이
 * 사라지므로 명시적으로 예약 구역을 둔다. 아직 등록되지 않은 미래의 어떤 친구가
 * 언젠가 30위 밖으로 밀려나 자기 별을 볼 때, 이 자리에 이미 다른 별이 있으면
 * 겹쳐 보이기 때문이다.
 */
const OVERFLOW_ORBIT_RATIO = {
  xRatio:
    0.5 + Math.cos(OVERFLOW_SELF_ANGLE_RADIANS) * OVERFLOW_SELF_RADIUS_RATIO,
  yRatio:
    0.5 + Math.sin(OVERFLOW_SELF_ANGLE_RADIANS) * OVERFLOW_SELF_RADIUS_RATIO,
};

const CENTER_RATIO = { xRatio: 0.5, yRatio: 0.5 };

export interface StarPosition {
  /** 컨테이너 기준 좌측 비율 (0~1) */
  xRatio: number;
  /** 컨테이너 기준 상단 비율 (0~1) */
  yRatio: number;
}

export interface PlacedStar extends StarPosition {
  /** 반지름 계산용 궁합 점수 */
  score: number;
}

/**
 * 후보 좌표와 다른 지점 사이의 px 거리.
 * 비율을 각 축의 실제 px 폭으로 환산한 뒤 유클리드 거리를 구한다 — 캔버스가
 * 정사각형이 아니므로 비율 그대로 거리를 재면 세로 방향 거리가 과소평가된다.
 */
const distancePx = (a: StarPosition, b: StarPosition): number =>
  Math.hypot(
    (a.xRatio - b.xRatio) * CANVAS_WIDTH_PX,
    (a.yRatio - b.yRatio) * CANVAS_HEIGHT_PX
  );

/**
 * 후보 좌표를 균등 랜덤으로 뽑는다.
 *
 * 라벨 반폭(34px)과 별 자신의 반지름을 각각 x/y 여유로 미리 빼두고 그 안에서만
 * 뽑으므로, 캔버스 이탈 여부를 별도로 검사할 필요가 없다 — 구조적으로 항상 안쪽이다.
 */
const randomCandidate = (candidateRadiusPx: number): StarPosition => {
  const marginXRatio = LABEL_HALF_WIDTH_PX / CANVAS_WIDTH_PX;
  const marginYRatio = candidateRadiusPx / CANVAS_HEIGHT_PX;

  return {
    xRatio: marginXRatio + Math.random() * (1 - 2 * marginXRatio),
    yRatio: marginYRatio + Math.random() * (1 - 2 * marginYRatio),
  };
};

/** 후보와 owner/오버플로 궤도/기존 별 전체 중 가장 가까운 거리(px) */
const minDistanceToObstaclesPx = (
  candidate: StarPosition,
  existingStars: PlacedStar[]
): number => {
  const distances = [
    distancePx(candidate, CENTER_RATIO) - OWNER_RADIUS_PX,
    distancePx(candidate, OVERFLOW_ORBIT_RATIO) - MAX_STAR_RADIUS_PX,
    ...existingStars.map(
      (star) =>
        distancePx(candidate, star) - getStarVisual(star.score).diameterPx / 2
    ),
  ];

  return Math.min(...distances);
};

const isValidCandidate = (
  candidate: StarPosition,
  candidateRadiusPx: number,
  existingStars: PlacedStar[],
  relaxationFactor: number
): boolean =>
  minDistanceToObstaclesPx(candidate, existingStars) >
  candidateRadiusPx * relaxationFactor;

/**
 * 재시도 단계별 최소 간격 완화 계수.
 * 1000회 시뮬레이션에서 30개 배치는 항상 성공하고 실패가 시작되는 지점은 48명
 * 부근이라 확인됐다 — 완화는 그 이후의 초고밀도 우주에서만 발동하는 안전망이다.
 */
const RELAXATION_STEPS = [1, 0.9, 0.8, 0.7] as const;

/** 완화 단계별 재시도 횟수 (권장값) */
const MAX_ATTEMPTS_PER_STEP = 200;

/** 모든 완화 단계도 실패했을 때 "가장 덜 겹치는 후보"를 고르기 위한 표본 수 */
const FALLBACK_CANDIDATE_COUNT = 200;

/**
 * 새 친구 별의 좌표를 계산한다.
 *
 * 등록 자체를 절대 실패시키지 않는다: 정상 조건으로 못 찾으면 최소 간격을 단계적으로
 * 완화하며 재시도하고, 그래도 못 찾으면 기존 별들과의 최소 거리가 가장 큰 후보를
 * 채택한다(약간의 겹침을 감수) — 48명을 넘는 우주에서만 이 경로를 탄다.
 */
export const computeGuestPlacement = (
  existingStars: PlacedStar[],
  score: number
): StarPosition => {
  const candidateRadiusPx = getStarVisual(score).diameterPx / 2;

  for (const relaxationFactor of RELAXATION_STEPS) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_STEP; attempt += 1) {
      const candidate = randomCandidate(candidateRadiusPx);

      if (
        isValidCandidate(
          candidate,
          candidateRadiusPx,
          existingStars,
          relaxationFactor
        )
      ) {
        return candidate;
      }
    }
  }

  const firstFallback = randomCandidate(candidateRadiusPx);
  let best = firstFallback;
  let bestMinDistance = minDistanceToObstaclesPx(firstFallback, existingStars);

  for (let attempt = 1; attempt < FALLBACK_CANDIDATE_COUNT; attempt += 1) {
    const candidate = randomCandidate(candidateRadiusPx);
    const minDistance = minDistanceToObstaclesPx(candidate, existingStars);

    if (minDistance > bestMinDistance) {
      bestMinDistance = minDistance;
      best = candidate;
    }
  }

  return best;
};
