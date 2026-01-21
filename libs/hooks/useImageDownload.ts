"use client";

import { useCallback, useRef, useState } from "react";

export interface UseImageDownloadOptions {
  /** 다운로드 파일명 (확장자 제외) */
  filename?: string;
  /** 이미지 품질 (0-1, PNG는 무시됨) */
  quality?: number;
  /** 픽셀 비율 (기본값: 2 for retina) */
  pixelRatio?: number;
}

export interface UseImageDownloadReturn {
  /** 이미지 생성 대상 요소에 연결할 ref */
  ref: React.RefObject<HTMLDivElement | null>;
  /** 이미지 다운로드 실행 함수 */
  download: () => Promise<void>;
  /** 다운로드 중 여부 */
  isDownloading: boolean;
  /** 에러 메시지 */
  error: string | null;
}

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
  const { filename = "fortune", pixelRatio = 2 } = options;

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
      // 동적 import로 번들 사이즈 최적화
      const { toPng } = await import("html-to-image");

      const dataUrl = await toPng(ref.current, {
        pixelRatio,
        cacheBust: true,
        // 배경 포함
        backgroundColor: undefined,
        // 이미지 로딩 대기
        skipAutoScale: false,
      });

      // 다운로드 링크 생성
      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("이미지 생성 실패:", err);
      setError("이미지 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsDownloading(false);
    }
  }, [filename, pixelRatio]);

  return {
    ref,
    download,
    isDownloading,
    error,
  };
};

export default useImageDownload;
