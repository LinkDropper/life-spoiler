import type { FaceDetector, FaceLandmarker } from "@mediapipe/tasks-vision";

/**
 * MediaPipe Face Detector + Face Landmarker 싱글톤 래퍼
 *
 * - 최초 1회만 WASM + 모델을 로드하고, 이후 재사용
 * - 브라우저 전용 (SSR 시 호출 금지 — "use client" 컴포넌트 내에서만 사용)
 * - 모델·WASM은 CDN에서 로드 (self-host 불필요)
 *
 * Face Detector: 얼굴 존재 여부 + bounding box (업로드 검증용)
 * Face Landmarker: 468개 랜드마크 좌표 (얼굴형 비율 계산용)
 */

const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

const LANDMARKER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let detectorPromise: Promise<FaceDetector> | null = null;

export const getFaceDetector = async (): Promise<FaceDetector> => {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const { FaceDetector: FaceDetectorClass, FilesetResolver } =
        await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
      return FaceDetectorClass.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: "GPU",
        },
        runningMode: "IMAGE",
        minDetectionConfidence: 0.5,
      });
    })().catch((error) => {
      // 로드 실패 시 다음 호출에서 재시도할 수 있도록 promise를 리셋
      detectorPromise = null;
      throw error;
    });
  }
  return detectorPromise;
};

export interface DetectedFaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const detectFaces = async (
  image: HTMLImageElement
): Promise<DetectedFaceBox[]> => {
  const detector = await getFaceDetector();
  const result = detector.detect(image);

  return result.detections.map((detection) => ({
    x: detection.boundingBox?.originX ?? 0,
    y: detection.boundingBox?.originY ?? 0,
    width: detection.boundingBox?.width ?? 0,
    height: detection.boundingBox?.height ?? 0,
  }));
};

/* ── Face Landmarker ────────────────────────────────────── */

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

export const getFaceLandmarker = async (): Promise<FaceLandmarker> => {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FaceLandmarker: FaceLandmarkerClass, FilesetResolver } =
        await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
      return FaceLandmarkerClass.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: LANDMARKER_MODEL_URL,
          delegate: "GPU",
        },
        runningMode: "IMAGE",
        numFaces: 1,
      });
    })().catch((error) => {
      landmarkerPromise = null;
      throw error;
    });
  }
  return landmarkerPromise;
};

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

export const detectFaceLandmarks = async (
  image: HTMLImageElement
): Promise<NormalizedLandmark[] | null> => {
  const landmarker = await getFaceLandmarker();
  const result = landmarker.detect(image);

  if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
    return null;
  }

  return result.faceLandmarks[0].map((lm) => ({
    x: lm.x,
    y: lm.y,
    z: lm.z,
  }));
};
