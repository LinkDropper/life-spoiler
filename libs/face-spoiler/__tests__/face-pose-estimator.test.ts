import {
  FRONTAL_POSE_THRESHOLDS,
  checkFrontalPose,
  estimateFacePose,
} from "../face-pose-estimator";
import type { NormalizedLandmark } from "../face-detector";

/** 468개 랜드마크 배열을 0으로 초기화 후 핵심 인덱스만 세팅 */
const buildLandmarks = (overrides: Record<number, NormalizedLandmark>) => {
  const arr: NormalizedLandmark[] = Array.from({ length: 468 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
  }));
  for (const [idx, lm] of Object.entries(overrides)) {
    arr[Number(idx)] = lm;
  }
  return arr;
};

/**
 * 정면 기준 랜드마크 셋:
 * - foreheadTop(10): y=0.1 (위)
 * - chinBottom(152): y=0.9 (아래)
 * - cheekLeft(93): x=0.2, cheekRight(323): x=0.8
 * - eyeLeftInner(133): x=0.4, eyeRightInner(362): x=0.6, 둘 다 y=0.4
 * - noseRoot(6): (0.5, 0.45), noseTip(1): (0.5, 0.55)
 *
 * upper(nose-forehead)=0.45, lower(chin-nose)=0.35, total=0.8
 * upperRatio=0.5625 → pitch ≈ (0.5625 - 0.55) * 200 = 2.5° (정면 수준)
 */
const buildFrontalLandmarks = () =>
  buildLandmarks({
    10: { x: 0.5, y: 0.1, z: 0 },
    152: { x: 0.5, y: 0.9, z: 0 },
    93: { x: 0.2, y: 0.5, z: 0 },
    323: { x: 0.8, y: 0.5, z: 0 },
    133: { x: 0.4, y: 0.4, z: 0 },
    362: { x: 0.6, y: 0.4, z: 0 },
    6: { x: 0.5, y: 0.45, z: 0 },
    1: { x: 0.5, y: 0.55, z: 0 },
  });

describe("estimateFacePose", () => {
  it("랜드마크가 부족하면 null을 반환한다", () => {
    const sparse: NormalizedLandmark[] = Array.from({ length: 100 }, () => ({
      x: 0,
      y: 0,
      z: 0,
    }));
    expect(estimateFacePose(sparse)).toBeNull();
  });

  it("정면 사진은 yaw/pitch/roll이 모두 임계값 이내다", () => {
    const pose = estimateFacePose(buildFrontalLandmarks());
    expect(pose).not.toBeNull();
    const { yaw, pitch, roll } = pose!;
    expect(Math.abs(yaw)).toBeLessThan(FRONTAL_POSE_THRESHOLDS.yaw);
    expect(Math.abs(pitch)).toBeLessThan(FRONTAL_POSE_THRESHOLDS.pitch);
    expect(Math.abs(roll)).toBeLessThan(FRONTAL_POSE_THRESHOLDS.roll);
  });

  it("코끝이 왼쪽으로 치우치면 yaw > 0 (피사체가 오른쪽으로 회전)", () => {
    const lms = buildFrontalLandmarks();
    lms[1] = { x: 0.35, y: 0.55, z: 0 }; // noseTip 왼쪽으로
    const pose = estimateFacePose(lms)!;
    expect(pose.yaw).toBeGreaterThan(0);
  });

  it("코끝이 오른쪽으로 치우치면 yaw < 0 (피사체가 왼쪽으로 회전)", () => {
    const lms = buildFrontalLandmarks();
    lms[1] = { x: 0.65, y: 0.55, z: 0 }; // noseTip 오른쪽으로
    const pose = estimateFacePose(lms)!;
    expect(pose.yaw).toBeLessThan(0);
  });

  it("얼굴이 위로 들리면(상반부 비율 증가) pitch > 0", () => {
    const lms = buildFrontalLandmarks();
    // upper(nose-forehead) 비중을 늘림: noseTip과 chin을 아래로 이동 (상반부 커짐)
    lms[1] = { x: 0.5, y: 0.7, z: 0 };
    lms[152] = { x: 0.5, y: 0.85, z: 0 };
    const pose = estimateFacePose(lms)!;
    expect(pose.pitch).toBeGreaterThan(0);
  });

  it("얼굴이 아래로 숙여지면(상반부 비율 감소) pitch < 0", () => {
    const lms = buildFrontalLandmarks();
    // upper 비중 축소: forehead와 noseTip을 가깝게, chin을 멀리
    lms[10] = { x: 0.5, y: 0.35, z: 0 };
    lms[1] = { x: 0.5, y: 0.42, z: 0 };
    lms[152] = { x: 0.5, y: 0.9, z: 0 };
    const pose = estimateFacePose(lms)!;
    expect(pose.pitch).toBeLessThan(0);
  });

  it("오른쪽 눈이 아래로 내려가면 roll > 0 (시계방향 갸웃)", () => {
    const lms = buildFrontalLandmarks();
    lms[362] = { x: 0.6, y: 0.5, z: 0 }; // eyeRightInner y 증가
    const pose = estimateFacePose(lms)!;
    expect(pose.roll).toBeGreaterThan(0);
  });

  it("오른쪽 눈이 위로 올라가면 roll < 0 (반시계방향 갸웃)", () => {
    const lms = buildFrontalLandmarks();
    lms[362] = { x: 0.6, y: 0.3, z: 0 }; // eyeRightInner y 감소
    const pose = estimateFacePose(lms)!;
    expect(pose.roll).toBeLessThan(0);
  });
});

describe("checkFrontalPose", () => {
  it("허용 범위 내 포즈는 ok=true", () => {
    const result = checkFrontalPose({ yaw: 5, pitch: -3, roll: 2 });
    expect(result.ok).toBe(true);
  });

  it("yaw 임계값 초과 시 ok=false", () => {
    const pose = { yaw: 20, pitch: 0, roll: 0 };
    const result = checkFrontalPose(pose);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.pose).toEqual(pose);
    }
  });

  it("pitch 임계값 초과 시 ok=false", () => {
    expect(checkFrontalPose({ yaw: 0, pitch: 20, roll: 0 }).ok).toBe(false);
  });

  it("roll 임계값 초과 시 ok=false", () => {
    expect(checkFrontalPose({ yaw: 0, pitch: 0, roll: 12 }).ok).toBe(false);
  });
});
