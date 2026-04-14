"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef, useState } from "react";

import {
  detectFaces,
  detectFaceLandmarks,
  type DetectedFaceBox,
} from "@/libs/face-spoiler/face-detector";
import {
  checkFrontalPose,
  estimateFacePose,
} from "@/libs/face-spoiler/face-pose-estimator";
import {
  analyzeFaceMetrics,
  buildFaceMetricsHint,
} from "@/libs/face-spoiler/face-shape-analyzer";

import type { FaceMetrics } from "@/libs/face-spoiler/face-shape-analyzer";

import { AnalysisLoading } from "./AnalysisLoading";
import styles from "./PhotoUploader.module.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DIMENSION = 1024;
const MIN_DIMENSION = 200;
const QUALITY = 0.85;

interface ValidationResult {
  error: string | null;
  detections: DetectedFaceBox[];
}

interface UploadMessages {
  imageLoadFailed: string;
  lowResolution: string;
  noFace: string;
  multipleFaces: string;
  canvasUnavailable: string;
  processingFailed: string;
  notFrontal: (params: { yaw: number; pitch: number; roll: number }) => string;
}

const loadImage = (
  file: File,
  messages: UploadMessages
): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(messages.imageLoadFailed));
    reader.readAsDataURL(file);
  });
};

const validateFace = async (
  img: HTMLImageElement,
  messages: UploadMessages
): Promise<ValidationResult> => {
  if (img.naturalWidth < MIN_DIMENSION || img.naturalHeight < MIN_DIMENSION) {
    return {
      error: messages.lowResolution,
      detections: [],
    };
  }

  try {
    const detections = await detectFaces(img);

    if (detections.length === 0) {
      return {
        error: messages.noFace,
        detections: [],
      };
    }
    if (detections.length > 1) {
      return {
        error: messages.multipleFaces,
        detections,
      };
    }
    return { error: null, detections };
  } catch (error) {
    console.warn("Face detection skipped:", error);
    return { error: null, detections: [] };
  }
};

const getContainRect = (imgEl: HTMLImageElement) => {
  const containerW = imgEl.clientWidth;
  const containerH = imgEl.clientHeight;
  const scale = Math.min(
    containerW / imgEl.naturalWidth,
    containerH / imgEl.naturalHeight
  );
  const renderedW = imgEl.naturalWidth * scale;
  const renderedH = imgEl.naturalHeight * scale;
  return {
    scale,
    offsetX: (containerW - renderedW) / 2,
    offsetY: (containerH - renderedH) / 2,
  };
};

const drawFaceBoxes = (
  detections: DetectedFaceBox[],
  imgEl: HTMLImageElement,
  canvasEl: HTMLCanvasElement,
  hasError: boolean
) => {
  canvasEl.width = imgEl.clientWidth;
  canvasEl.height = imgEl.clientHeight;

  const ctx = canvasEl.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

  const { scale, offsetX, offsetY } = getContainRect(imgEl);
  const color = hasError ? "#ef4444" : "#22c55e";

  detections.forEach((det) => {
    const x = det.x * scale + offsetX;
    const y = det.y * scale + offsetY;
    const w = det.width * scale;
    const h = det.height * scale;

    ctx.fillStyle = hasError ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)";
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);
  });
};

const resizeImageFromElement = (
  img: HTMLImageElement,
  mimeType: string,
  messages: UploadMessages
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error(messages.canvasUnavailable));
      return;
    }

    let width = img.naturalWidth;
    let height = img.naturalHeight;

    if (width > height && width > MAX_DIMENSION) {
      height = (height * MAX_DIMENSION) / width;
      width = MAX_DIMENSION;
    } else if (height > MAX_DIMENSION) {
      width = (width * MAX_DIMENSION) / height;
      height = MAX_DIMENSION;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error(messages.processingFailed));
      },
      mimeType,
      QUALITY
    );
  });
};

interface PhotoUploaderProps {
  profileId: string;
}

export const PhotoUploader = ({ profileId }: PhotoUploaderProps) => {
  const router = useRouter();
  const t = useTranslations("faceSpoiler.upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewImgRef = useRef<HTMLImageElement>(null);
  const faceCanvasRef = useRef<HTMLCanvasElement>(null);
  // 최신 파일을 onLoad 클로저에서 안전하게 참조하기 위한 ref
  const selectedFileRef = useRef<File | null>(null);

  const uploadMessages: UploadMessages = useMemo(
    () => ({
      imageLoadFailed: t("errorImageLoadFailed", {
        default: "이미지를 불러올 수 없어요.",
      }),
      lowResolution: t("errorLowResolution", {
        default: "사진 해상도가 너무 낮아요. 더 선명한 사진을 업로드해주세요.",
      }),
      noFace: t("errorNoFace", {
        default:
          "얼굴을 찾을 수 없어요. 얼굴이 잘 보이는 정면 사진을 업로드해주세요.",
      }),
      multipleFaces: t("errorMultipleFaces", {
        default:
          "여러 명의 얼굴이 감지됐어요. 한 명만 나오는 사진을 업로드해주세요.",
      }),
      canvasUnavailable: t("errorCanvasUnavailable", {
        default: "Canvas를 사용할 수 없어요.",
      }),
      processingFailed: t("errorProcessingFailed", {
        default: "이미지 처리에 실패했어요.",
      }),
      notFrontal: ({ yaw, pitch, roll }) =>
        t("errorNotFrontal", {
          yaw: Math.round(Math.abs(yaw)),
          pitch: Math.round(Math.abs(pitch)),
          roll: Math.round(Math.abs(roll)),
          default:
            "정면을 바라보는 사진을 올려주세요. (얼굴이 좌우 {yaw}°, 상하 {pitch}°, 기울기 {roll}° 만큼 벗어나 있어요)",
        }),
    }),
    [t]
  );

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] =
    useState<ValidationResult | null>(null);
  const [faceShapeHint, setFaceShapeHint] = useState<string | null>(null);
  // 코드 결정적 분류기에 그대로 전달할 측정값 객체. 서버 route가 동물상 분류에 사용.
  const [faceMetrics, setFaceMetrics] = useState<FaceMetrics | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 프리뷰 이미지 로드 완료 시 자동으로 얼굴 감지 실행
  const handlePreviewLoad = useCallback(async () => {
    const file = selectedFileRef.current;
    if (!file || !previewImgRef.current || !faceCanvasRef.current) return;

    setIsDetecting(true);
    try {
      const img = await loadImage(file, uploadMessages);
      const result = await validateFace(img, uploadMessages);
      setDetectionResult(result);

      if (
        result.detections.length > 0 &&
        previewImgRef.current &&
        faceCanvasRef.current
      ) {
        drawFaceBoxes(
          result.detections,
          previewImgRef.current,
          faceCanvasRef.current,
          !!result.error
        );
      }

      // 얼굴이 1개 감지되었으면 랜드마크 기반 포즈 게이트 + 얼굴형 분석
      if (!result.error && result.detections.length === 1) {
        try {
          const landmarks = await detectFaceLandmarks(img);
          if (landmarks) {
            const pose = estimateFacePose(landmarks);
            if (pose) {
              const gate = checkFrontalPose(pose);
              if (!gate.ok) {
                const notFrontalMsg = uploadMessages.notFrontal(gate.pose);
                setDetectionResult({
                  error: notFrontalMsg,
                  detections: result.detections,
                });
                setError(notFrontalMsg);
                return;
              }
            }
            const measured = analyzeFaceMetrics(landmarks);
            if (measured) {
              const metricsWithPose = pose ? { ...measured, pose } : measured;
              setFaceShapeHint(buildFaceMetricsHint(metricsWithPose));
              setFaceMetrics(metricsWithPose);
            }
          }
        } catch {
          // 랜드마크 분석 실패는 무시 — 힌트 없이도 기존 파이프라인 동작
        }
      }

      // 감지 즉시 에러 표시
      if (result.error) setError(result.error);
    } catch {
      // 자동 감지 실패 시 무시
    } finally {
      setIsDetecting(false);
    }
  }, [uploadMessages]);

  const handleFileSelection = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(
        t("errorOnlyImage", { default: "이미지 파일만 업로드 가능합니다." })
      );
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(
        t("errorSizeLimit", { default: "파일 크기는 10MB 이하여야 합니다." })
      );
      return;
    }

    selectedFileRef.current = file;
    setSelectedFile(file);
    setError(null);
    setDetectionResult(null);
    setFaceShapeHint(null);
    setFaceMetrics(null);

    // 캔버스 초기화
    if (faceCanvasRef.current) {
      const ctx = faceCanvasRef.current.getContext("2d");
      ctx?.clearRect(
        0,
        0,
        faceCanvasRef.current.width,
        faceCanvasRef.current.height
      );
    }

    // 프리뷰 URL 생성 → img onLoad → handlePreviewLoad 자동 실행
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const { files } = e.dataTransfer;
    if (files.length > 0) handleFileSelection(files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile || !consent1 || !consent2) {
      setError(
        t("errorConsentRequired", {
          default: "모든 동의 항목에 체크해주세요.",
        })
      );
      return;
    }

    // 자동 감지 결과 재사용, 없으면 새로 실행
    const cached = detectionResult;

    setIsValidating(true);
    setError(null);

    try {
      const img = await loadImage(selectedFile, uploadMessages);

      const { error: validationError, detections } =
        cached ?? (await validateFace(img, uploadMessages));

      // 박스가 아직 없으면 그리기
      if (
        !cached &&
        detections.length > 0 &&
        previewImgRef.current &&
        faceCanvasRef.current
      ) {
        drawFaceBoxes(
          detections,
          previewImgRef.current,
          faceCanvasRef.current,
          !!validationError
        );
      }

      if (validationError) {
        setError(validationError);
        setIsValidating(false);
        return;
      }

      setIsValidating(false);
      setIsUploading(true);

      const resizedBlob = await resizeImageFromElement(
        img,
        selectedFile.type,
        uploadMessages
      );

      const formData = new FormData();
      formData.append("image", resizedBlob, selectedFile.name);
      formData.append("profileId", profileId);

      const uploadResponse = await fetch("/api/face-spoiler/upload", {
        method: "POST",
        body: formData,
      });
      if (!uploadResponse.ok)
        throw new Error(
          t("errorUploadFailed", { default: "업로드에 실패했습니다." })
        );

      const uploadData = await uploadResponse.json();
      if (uploadData.cached) {
        router.push(`/face-spoiler/preview/${uploadData.shareId}`);
        return;
      }

      const generateResponse = await fetch(
        "/api/face-spoiler/report/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imagePath: uploadData.imagePath,
            imageHash: uploadData.imageHash,
            profileId,
            faceShapeHint: faceShapeHint ?? undefined,
            faceMetrics: faceMetrics ?? undefined,
          }),
        }
      );

      if (!generateResponse.ok) {
        const errData = await generateResponse.json().catch(() => ({}));
        throw new Error(
          errData.error ||
            t("errorGenerateFailed", { default: "리포트 생성에 실패했습니다." })
        );
      }

      const generateData = await generateResponse.json();
      router.push(`/face-spoiler/preview/${generateData.shareId}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("errorUnknown", { default: "알 수 없는 오류가 발생했습니다." })
      );
      setIsUploading(false);
      setIsValidating(false);
    }
  };

  if (isUploading) return <AnalysisLoading />;

  return (
    <section id="upload" className={styles.section}>
      <div className={styles.card}>
        <h2 className={styles.title}>
          {t("title", { default: "사진 업로드" })}
        </h2>
        <p className={styles.description}>
          {t("description", {
            default: "얼굴이 선명하게 나온 정면 사진을 업로드해주세요",
          })}
        </p>

        <div
          className={`${styles.dropzone} ${isDragging ? styles.dragging : ""} ${
            selectedFile ? styles.hasFile : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelection(f);
            }}
            style={{ display: "none" }}
          />

          {selectedFile && previewUrl ? (
            <div className={styles.previewWrapper}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={previewImgRef}
                src={previewUrl}
                alt={t("previewAlt", { default: "업로드 미리보기" })}
                className={styles.previewImage}
                onLoad={handlePreviewLoad}
              />
              <canvas ref={faceCanvasRef} className={styles.faceCanvas} />
              {isDetecting && (
                <div className={styles.detectingBadge}>
                  {t("detectingFace", { default: "얼굴 감지 중..." })}
                </div>
              )}
              <div className={styles.previewOverlay}>
                <svg
                  className={styles.previewCheck}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className={styles.previewName}>{selectedFile.name}</p>
              </div>
            </div>
          ) : (
            <div className={styles.uploadPrompt}>
              <svg
                className={styles.uploadIcon}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <p className={styles.uploadText}>
                {t("uploadText", {
                  default: "클릭하거나 이미지를 드래그하세요",
                })}
              </p>
              <p className={styles.uploadHint}>
                {t("uploadHint", { default: "최대 10MB" })}
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className={styles.error}>
            <p>{error}</p>
          </div>
        )}

        <div className={styles.consent}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={consent1}
              onChange={(e) => setConsent1(e.target.checked)}
              className={styles.checkbox}
            />
            <span>
              {t("consent1", { default: "본인의 사진임을 확인합니다" })}
            </span>
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={consent2}
              onChange={(e) => setConsent2(e.target.checked)}
              className={styles.checkbox}
            />
            <span>
              {t("consent2", {
                default: "이 리포트는 엔터테인먼트 목적의 참고 자료입니다",
              })}
            </span>
          </label>
        </div>

        <button
          className={`${styles.submitButton} ${
            isDetecting || isValidating ? styles.validating : ""
          }`}
          onClick={handleUpload}
          disabled={
            !selectedFile ||
            !consent1 ||
            !consent2 ||
            isValidating ||
            isDetecting ||
            !!detectionResult?.error
          }
        >
          {isDetecting || isValidating ? (
            <>
              <svg
                className={styles.spinner}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="32"
                  strokeDashoffset="12"
                />
              </svg>
              {isDetecting
                ? t("detectingFace", { default: "얼굴 감지 중..." })
                : t("validating", { default: "사진 확인 중..." })}
            </>
          ) : (
            t("submitButton", { default: "분석 시작하기" })
          )}
        </button>
      </div>
    </section>
  );
};
