"use client";

import { useCallback, useRef, useState } from "react";

export interface UseImageDownloadOptions {
  /** 다운로드 파일명 (확장자 제외) */
  filename?: string;
  /** 이미지 품질 (0-1, PNG는 무시됨) */
  quality?: number;
  /** 픽셀 비율 (기본값: 2 for retina) */
  pixelRatio?: number;
  /** 이미지 로드 대기 여부 (기본값: true) */
  waitForImages?: boolean;
}

export interface UseImageDownloadReturn {
  /** 이미지 생성 대상 요소에 연결할 ref */
  ref: React.RefObject<HTMLDivElement | null>;
  /** 이미지 다운로드 실행 함수 */
  download: () => Promise<void>;
  /** 이미지를 Blob으로 생성 (업로드용) */
  toBlob: () => Promise<Blob | null>;
  /** 다운로드 중 여부 */
  isDownloading: boolean;
  /** 에러 메시지 */
  error: string | null;
}

/**
 * 요소 내의 모든 이미지가 로드될 때까지 대기 (타임아웃 포함)
 */
const waitForImagesToLoad = (
  element: HTMLElement,
  timeout = 3000
): Promise<void> => {
  const images = element.querySelectorAll("img");
  if (images.length === 0) {
    return Promise.resolve();
  }

  const imagePromises = Array.from(images).map((img) => {
    if (img.complete && img.naturalHeight !== 0) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, timeout);
      img.onload = () => {
        clearTimeout(timer);
        resolve();
      };
      img.onerror = () => {
        clearTimeout(timer);
        resolve();
      };
    });
  });

  return Promise.all(imagePromises).then(() => undefined);
};

/**
 * HTML 요소를 이미지로 변환하여 다운로드하는 훅
 *
 * html-to-image 라이브러리를 사용합니다.
 *
 * @example
 * ```tsx
 * const { ref, download, isDownloading } = useImageDownload({
 *   filename: "my-fortune"
 * });
 *
 * return (
 *   <>
 *     <div ref={ref}>...</div>
 *     <button onClick={download} disabled={isDownloading}>
 *       {isDownloading ? "다운로드 중..." : "이미지 저장"}
 *     </button>
 *   </>
 * );
 * ```
 */

export const useImageDownload = (
  options: UseImageDownloadOptions = {}
): UseImageDownloadReturn => {
  const {
    filename = "fortune",
    pixelRatio = 2,
    waitForImages = true,
  } = options;

  const ref = useRef<HTMLDivElement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = useCallback(async () => {
    if (!ref.current) {
      setError("이미지 생성 대상을 찾을 수 없습니다.");
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      // 이미지 로드 대기
      if (waitForImages) {
        await waitForImagesToLoad(ref.current);
      }

      // 동적 import로 번들 사이즈 최적화
      const { toBlob: htmlToBlob } = await import("html-to-image");

      const blob = await htmlToBlob(ref.current, {
        pixelRatio,
        cacheBust: true,
        backgroundColor: undefined,
        skipAutoScale: false,
      });

      if (!blob) {
        throw new Error("Blob 생성 실패");
      }

      // iOS에서는 Web Share API를 사용하여 갤러리에 저장 가능하게 함
      const isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

      const file = new File([blob], `${filename}.png`, { type: "image/png" });
      const canShare = navigator.canShare?.({ files: [file] }) ?? false;

      if (isIOS && canShare) {
        // iOS: Web Share API로 공유 시트 열기 (이미지 저장 옵션 제공)
        await navigator.share({ files: [file] });
      } else {
        // 기타 브라우저: 기존 다운로드 방식
        const dataUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `${filename}.png`;
        link.href = dataUrl;
        link.click();
        setTimeout(() => URL.revokeObjectURL(dataUrl), 100);
      }
    } catch (err) {
      // 사용자가 공유를 취소한 경우 (AbortError)는 에러로 처리하지 않음
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      console.error("이미지 생성 실패:", err);
      setError("이미지 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsDownloading(false);
    }
  }, [filename, pixelRatio, waitForImages]);

  const toBlob = useCallback(async (): Promise<Blob | null> => {
    if (!ref.current) {
      setError("이미지 생성 대상을 찾을 수 없습니다.");
      return null;
    }

    setIsDownloading(true);
    setError(null);

    try {
      // 이미지 로드 대기
      if (waitForImages) {
        await waitForImagesToLoad(ref.current);
      }

      // 동적 import로 번들 사이즈 최적화
      const { toBlob: htmlToBlob } = await import("html-to-image");

      const blob = await htmlToBlob(ref.current, {
        pixelRatio,
        cacheBust: true,
        backgroundColor: undefined,
        skipAutoScale: false,
      });

      return blob;
    } catch (err) {
      console.error("이미지 생성 실패:", err);
      setError("이미지 생성에 실패했습니다. 다시 시도해주세요.");
      return null;
    } finally {
      setIsDownloading(false);
    }
  }, [pixelRatio, waitForImages]);

  return {
    ref,
    download,
    toBlob,
    isDownloading,
    error,
  };
};

export default useImageDownload;
