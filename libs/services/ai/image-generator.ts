import { env } from "@/env";
import { createServerClient } from "@/libs/supabase";

import { AIError } from "./errors";

// ============================================================
// 설정
// ============================================================

const IMAGE_CONFIG = {
  url: "https://api.openai.com/v1/images/generations",
  // Google imagen-4.0-fast-generate-001(약 $0.02/장) 종료로 교체.
  // OpenAI 이미지 모델 중 1024x1024 단가가 가장 가까운 gpt-image-1-mini
  // medium($0.011/장)을 사용한다. (low $0.005, high $0.036)
  model: "gpt-image-1-mini",
  quality: "medium",
  size: "1024x1024",
  timeout: 60000, // 60초 (gpt-image 계열은 Imagen Fast보다 응답이 느림)
  maxRetries: 2, // 일시적 429/5xx는 백오프 재시도, 타임아웃(Abort)은 즉시 중단
  retryDelay: 2000,
  bucket: "past-life-images",
} as const;

/**
 * 전생 이미지 스타일 프리픽스
 * 실사화 대신 캐릭터 일러스트 스타일로 생성
 */
const IMAGE_STYLE_PREFIX =
  "3D rendered illustration, centered composition. " +
  "Pixar/Disney 3D animation style with soft lighting and vibrant colors. " +
  "Smooth 3D render, stylized proportions, subtle subsurface scattering. " +
  "Dreamy ethereal background with depth of field blur. " +
  "High quality 3D art, detailed textures. " +
  "IMPORTANT: Render the subject exactly as described. " +
  "If the subject is a flower, animal, insect, or natural element, " +
  "do NOT add any human face or human features. ";

// ============================================================
// OpenAI Images API
// ============================================================

interface OpenAIImageRequest {
  model: string;
  prompt: string;
  n: number;
  size: string;
  quality: string;
  output_format: "png";
}

interface OpenAIImageResponse {
  data?: { b64_json?: string }[];
}

/**
 * 지정된 시간만큼 대기
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * OpenAI Images API로 이미지 생성
 */
const generateImageWithOpenAI = async (prompt: string): Promise<Buffer> => {
  const apiKey = env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new AIError("OpenAI API 키가 설정되지 않았습니다.", {
      code: "API_KEY_MISSING",
    });
  }

  const request: OpenAIImageRequest = {
    model: IMAGE_CONFIG.model,
    prompt: `${IMAGE_STYLE_PREFIX}${prompt}`,
    n: 1,
    size: IMAGE_CONFIG.size,
    quality: IMAGE_CONFIG.quality,
    output_format: "png",
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= IMAGE_CONFIG.maxRetries; attempt++) {
    const attemptStart = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        IMAGE_CONFIG.timeout
      );

      try {
        const response = await fetch(IMAGE_CONFIG.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();

          if (response.status === 429) {
            throw new AIError("이미지 생성 API 요청 한도를 초과했습니다.", {
              code: "RATE_LIMITED",
              statusCode: 429,
            });
          }

          throw new AIError(`OpenAI 이미지 API 요청 실패: ${errorText}`, {
            code: "API_REQUEST_FAILED",
            statusCode: response.status,
          });
        }

        const data: OpenAIImageResponse = await response.json();
        const base64 = data.data?.[0]?.b64_json;

        if (!base64) {
          throw new AIError("이미지 생성 결과가 비어있습니다.", {
            code: "INVALID_RESPONSE",
          });
        }

        return Buffer.from(base64, "base64");
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      lastError = error as Error;

      if (error instanceof AIError && error.code === "API_KEY_MISSING") {
        throw error;
      }

      const elapsed = Date.now() - attemptStart;
      const isAbort = error instanceof Error && error.name === "AbortError";
      const errorName = error instanceof Error ? error.name : "UnknownError";
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      console.warn(
        `이미지 생성 시도 ${attempt + 1}/${IMAGE_CONFIG.maxRetries + 1} 실패 ` +
          `(${elapsed}ms, ${isAbort ? "타임아웃" : errorName}): ${errorMessage}`
      );

      // 타임아웃(Abort)은 재시도해도 같은 시간만 더 소모하므로
      // 표준 AIError(TIMEOUT)로 래핑해 즉시 중단.
      if (isAbort) {
        throw new AIError("이미지 생성 요청 시간이 초과되었습니다.", {
          code: "TIMEOUT",
          originalError: error instanceof Error ? error : undefined,
        });
      }

      // 그 외(일시적 네트워크/5xx)만 백오프 후 재시도.
      if (attempt < IMAGE_CONFIG.maxRetries) {
        const backoffDelay = IMAGE_CONFIG.retryDelay * Math.pow(2, attempt);
        await sleep(backoffDelay);
        continue;
      }
      break;
    }
  }

  throw (
    lastError ||
    new AIError("이미지 생성 중 알 수 없는 오류가 발생했습니다.", {
      code: "UNKNOWN_ERROR",
    })
  );
};

// ============================================================
// Supabase Storage 업로드 (서버 사이드)
// ============================================================

/**
 * 이미지 버퍼를 Supabase Storage에 업로드하고 공개 URL 반환
 */
const uploadToStorage = async (
  imageBuffer: Buffer,
  profileId: string
): Promise<string> => {
  const supabase = createServerClient();

  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const filePath = `${profileId}/${timestamp}-${randomStr}.png`;

  const { data, error } = await supabase.storage
    .from(IMAGE_CONFIG.bucket)
    .upload(filePath, imageBuffer, {
      contentType: "image/png",
      upsert: false,
    });

  if (error) {
    console.error("전생 이미지 업로드 실패:", error);
    throw new AIError("전생 이미지 업로드에 실패했습니다.", {
      code: "STORAGE_UPLOAD_FAILED",
    });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(IMAGE_CONFIG.bucket).getPublicUrl(data.path);

  return publicUrl;
};

// ============================================================
// 공개 API
// ============================================================

/**
 * 전생 이미지 생성 및 업로드
 *
 * 1. imagePrompt로 OpenAI Images API 호출 (캐릭터 일러스트 스타일)
 * 2. 생성된 이미지를 Supabase Storage에 업로드
 * 3. 공개 URL 반환
 *
 * 실패 시 null 반환 (이미지는 선택적 요소이므로 전체 플로우를 중단하지 않음)
 */
export const generatePastLifeImage = async (
  imagePrompt: string,
  profileId: string
): Promise<string | null> => {
  try {
    const imageBuffer = await generateImageWithOpenAI(imagePrompt);
    const publicUrl = await uploadToStorage(imageBuffer, profileId);
    return publicUrl;
  } catch (error) {
    console.error("전생 이미지 생성/업로드 실패:", error);
    return null;
  }
};
