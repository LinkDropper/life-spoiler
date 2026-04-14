import type { NormalizedLandmark } from "./face-detector";

/**
 * MediaPipe 468 랜드마크로부터 얼굴 포즈(yaw, pitch, roll)를 간이 추정.
 *
 * 복잡한 solvePnP 없이, 정면 대칭 가정을 기반으로 한 기하학적 heuristic:
 * - yaw: 코끝이 좌우 광대 중점에서 얼마나 수평으로 벗어났는지 (좌우 비대칭)
 * - pitch: 코뿌리-코끝 대비 이마-턱 상하 비율 (상하 비대칭)
 * - roll: 두 눈 내곽을 잇는 선의 수평 대비 기울기
 *
 * 부호 규약:
 * - yaw > 0: 얼굴이 피사체 기준 오른쪽으로 회전 (카메라에서 볼 때 왼쪽 뺨이 더 보임)
 * - pitch > 0: 얼굴이 위로 들림 (턱을 들어올림)
 * - roll > 0: 시계방향으로 갸웃 (오른쪽 눈이 아래로)
 */

/** 얼굴 포즈 각도 (degree) */
export interface FacePose {
  yaw: number;
  pitch: number;
  roll: number;
}

/** 정면 사진으로 간주하는 허용 범위 — 초과 시 업로드 거부 */
export const FRONTAL_POSE_THRESHOLDS = {
  yaw: 15,
  pitch: 15,
  roll: 10,
} as const;

const LM_POSE = {
  foreheadTop: 10,
  chinBottom: 152,
  cheekLeft: 93,
  cheekRight: 323,
  eyeLeftInner: 133,
  eyeRightInner: 362,
  noseRoot: 6,
  noseTip: 1,
} as const;

const round1 = (n: number): number => Math.round(n * 10) / 10;

export const estimateFacePose = (
  landmarks: NormalizedLandmark[]
): FacePose | null => {
  if (landmarks.length < 468) {
    return null;
  }

  const lm = (idx: number) => landmarks[idx];

  // ── Roll: 두 눈 내곽을 잇는 선의 수평 대비 기울기 ──
  const eyeL = lm(LM_POSE.eyeLeftInner);
  const eyeR = lm(LM_POSE.eyeRightInner);
  // MediaPipe 좌표계: 피사체 왼쪽 눈(우리가 보는 방향 기준 오른쪽)의 x가 더 작음.
  // 오른쪽 눈(eyeRightInner) x > 왼쪽 눈(eyeLeftInner) x
  const rollDx = eyeR.x - eyeL.x;
  const rollDy = eyeR.y - eyeL.y;
  // y 아래로 증가 → 오른쪽 눈이 아래로 내려가면 dy > 0 → 시계방향 roll > 0
  const roll = (Math.atan2(rollDy, rollDx) * 180) / Math.PI;

  // ── Yaw: 코끝이 좌우 광대 중점에서 얼마나 벗어났는지 ──
  const cheekL = lm(LM_POSE.cheekLeft);
  const cheekR = lm(LM_POSE.cheekRight);
  const noseTip = lm(LM_POSE.noseTip);
  const cheekCenterX = (cheekL.x + cheekR.x) / 2;
  const cheekWidth = Math.abs(cheekR.x - cheekL.x) || 1e-6;
  // 코끝이 오른쪽 광대 쪽으로 치우침 (noseTip.x > cheekCenterX) → 피사체가 왼쪽으로 돌아간 상태
  // 부호 규약(yaw > 0 = 피사체 기준 오른쪽 회전): 코끝이 왼쪽(작은 x)으로 치우치면 yaw > 0
  const yawRatio = (cheekCenterX - noseTip.x) / (cheekWidth / 2);
  // ratio (-1..1)를 degree로 근사: ±1 ≈ ±60°. 작은 각도에서 선형 근사.
  const yaw = Math.max(-90, Math.min(90, yawRatio * 60));

  // ── Pitch: 이마-코끝 대비 코끝-턱의 세로 거리 비율 ──
  const forehead = lm(LM_POSE.foreheadTop);
  const chin = lm(LM_POSE.chinBottom);
  const upperDy = noseTip.y - forehead.y; // 이마 → 코끝 (양수: 코끝이 아래)
  const lowerDy = chin.y - noseTip.y; // 코끝 → 턱
  const totalDy = upperDy + lowerDy || 1e-6;
  // 정면일 때 upper/total ≈ 0.55 근처(개인차). 얼굴이 위로 들리면 upper 비율 증가(이마가 더 보임 아님,
  // 오히려 원근으로 상반부가 짧아짐) — 실제로는 카메라에서 볼 때 얼굴이 위로 들리면 아래쪽(코끝~턱)이
  // 축소되어 upper 비율이 커진다. 여기선 간단히 상반부/하반부 비율 편차를 pitch로 환산.
  const upperRatio = upperDy / totalDy;
  const PITCH_NEUTRAL = 0.55;
  // ratio 0.05 편차 ≈ 약 10° (경험적 근사). 부호: ratio가 커지면 pitch > 0 (얼굴 위로 들림)
  const pitch = Math.max(-90, Math.min(90, (upperRatio - PITCH_NEUTRAL) * 200));

  return {
    yaw: round1(yaw),
    pitch: round1(pitch),
    roll: round1(roll),
  };
};

/**
 * 추정된 포즈가 정면 허용 범위 안에 있는지 판정.
 * @returns 정면이면 { ok: true }, 아니면 { ok: false }와 초과된 포즈 정보
 */
export const checkFrontalPose = (
  pose: FacePose
): { ok: true } | { ok: false; pose: FacePose } => {
  const { yaw, pitch, roll } = pose;
  if (
    Math.abs(yaw) < FRONTAL_POSE_THRESHOLDS.yaw &&
    Math.abs(pitch) < FRONTAL_POSE_THRESHOLDS.pitch &&
    Math.abs(roll) < FRONTAL_POSE_THRESHOLDS.roll
  ) {
    return { ok: true };
  }
  return { ok: false, pose };
};
