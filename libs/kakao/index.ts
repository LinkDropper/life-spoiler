/**
 * Kakao SDK 유틸리티
 *
 * 카카오톡 공유하기 기능을 제공합니다.
 */

declare global {
  interface Window {
    Kakao: KakaoSDK;
  }
}

interface KakaoUploadImageResponse {
  infos: {
    original: {
      url: string;
      length: number;
      content_type: string;
      width: number;
      height: number;
    };
  };
}

interface KakaoSDK {
  init: (appKey: string) => void;
  isInitialized: () => boolean;
  Share: {
    sendCustom: (options: KakaoShareOptions) => void;
    uploadImage: (options: {
      file: File[];
    }) => Promise<KakaoUploadImageResponse>;
  };
}

interface KakaoShareOptions {
  templateId: number;
  templateArgs: Record<string, string>;
}

export interface KakaoShareParams {
  title: string;
  description: string;
  name: string;
  webDomain: string;
}

export interface KakaoImageShareParams {
  imageBlob: Blob;
  name: string;
  webDomain: string;
}

// 카카오톡 공유 피드 템플릿 ID (운세 결과 공유용)
const TEMPLATE_ID = 128486;

// 카카오톡 이미지 공유 템플릿 ID (프로필 이미지 공유용)
const IMAGE_TEMPLATE_ID = 128846;

// 관상스포 전용 카카오톡 이미지 공유 템플릿 ID
export const FACE_SPOILER_IMAGE_TEMPLATE_ID = 131969;

/**
 * Kakao SDK 초기화
 */
export const initKakao = (): boolean => {
  if (typeof window === "undefined") return false;
  if (!window.Kakao) {
    console.warn("Kakao SDK script not loaded");
    return false;
  }

  const jsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  if (!jsKey) {
    console.warn("NEXT_PUBLIC_KAKAO_JS_KEY is not configured");
    return false;
  }

  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(jsKey);
  }

  return window.Kakao.isInitialized();
};

/**
 * Kakao SDK 초기화 여부 확인
 */
export const isKakaoInitialized = (): boolean => {
  if (typeof window === "undefined") return false;
  if (!window.Kakao) return false;
  return window.Kakao.isInitialized();
};

/**
 * LINE으로 공유하기
 */
export const shareToLine = (url: string, text?: string): void => {
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text || "")}`;
  window.open(lineUrl, "_blank");
};

/**
 * 카카오톡 피드 템플릿으로 공유하기
 */
export const shareToKakao = (params: KakaoShareParams): boolean => {
  if (!isKakaoInitialized()) {
    if (!initKakao()) {
      console.error("Kakao SDK is not initialized");
      return false;
    }
  }

  try {
    window.Kakao.Share.sendCustom({
      templateId: TEMPLATE_ID,
      templateArgs: {
        title: params.title,
        description: params.description,
        name: params.name,
        web_domain: params.webDomain,
      },
    });
    return true;
  } catch (error) {
    console.error("Failed to share to Kakao:", error);
    return false;
  }
};

/**
 * Blob을 File 객체로 변환
 */
const blobToFile = (blob: Blob, filename: string): File => {
  return new File([blob], filename, { type: blob.type || "image/png" });
};

/**
 * 카카오톡 이미지 템플릿으로 공유하기
 *
 * 이미지를 카카오 서버에 업로드한 후 템플릿으로 공유합니다.
 */
const shareImageWithTemplate = async (
  params: KakaoImageShareParams,
  templateId: number
): Promise<boolean> => {
  if (!isKakaoInitialized()) {
    if (!initKakao()) {
      console.error("Kakao SDK is not initialized");
      return false;
    }
  }

  try {
    const file = blobToFile(params.imageBlob, "share-image.png");

    const uploadResult = await window.Kakao.Share.uploadImage({
      file: [file],
    });

    const imageUrl = uploadResult.infos.original.url;

    window.Kakao.Share.sendCustom({
      templateId,
      templateArgs: {
        image_url: imageUrl,
        name: params.name,
        web_domain: params.webDomain,
      },
    });
    return true;
  } catch (error) {
    console.error("Failed to share to Kakao with image:", error);
    return false;
  }
};

/**
 * 카카오톡 이미지 템플릿으로 공유하기 (인생스포 프로필 카드용)
 */
export const shareToKakaoWithImage = (
  params: KakaoImageShareParams
): Promise<boolean> => shareImageWithTemplate(params, IMAGE_TEMPLATE_ID);

/**
 * 카카오톡 이미지 템플릿으로 공유하기 (관상스포 결과 카드용)
 */
export const shareFaceSpoilerImage = (
  params: KakaoImageShareParams
): Promise<boolean> =>
  shareImageWithTemplate(params, FACE_SPOILER_IMAGE_TEMPLATE_ID);
