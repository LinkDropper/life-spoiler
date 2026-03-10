import { env } from "@/env";
import { createServerClient } from "@/libs/supabase";

import { AIError } from "./errors";

// ============================================================
// 설정
// ============================================================

const IMAGEN_CONFIG = {
  baseUrl: "https://generativelanguage.googleapis.com/v1beta/models",
  model: "imagen-4.0-generate-001",
  timeout: 60000, // 60초 (이미지 생성은 텍스트보다 오래 걸림)
  maxRetries: 2,
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
// Imagen 3 API
// ============================================================

interface ImagenRequest {
  instances: { prompt: string }[];
  parameters: {
    sampleCount: number;
    aspectRatio: string;
    personGeneration: string;
  };
}

interface ImagenResponse {
  predictions?: {
    bytesBase64Encoded: string;
    mimeType: string;
  }[];
}

/**
 * 지정된 시간만큼 대기
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Imagen 3 API로 이미지 생성
 */
const generateImageWithImagen = async (
  prompt: string
): Promise<Buffer> => {
  const apiKey = env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new AIError("Gemini API 키가 설정되지 않았습니다.", {
      code: "API_KEY_MISSING",
    });
  }

  const styledPrompt = `${IMAGE_STYLE_PREFIX}${prompt}`;

  const request: ImagenRequest = {
    instances: [{ prompt: styledPrompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: "1:1",
      personGeneration: "allow_all",
    },
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= IMAGEN_CONFIG.maxRetries; attempt++) {
    try {
      const url = `${IMAGEN_CONFIG.baseUrl}/${IMAGEN_CONFIG.model}:predict`;

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        IMAGEN_CONFIG.timeout
      );

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
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

          throw new AIError(
            `Imagen API 요청 실패: ${errorText}`,
            {
              code: "API_REQUEST_FAILED",
              statusCode: response.status,
            }
          );
        }

        const data: ImagenResponse = await response.json();

        if (!data.predictions || data.predictions.length === 0) {
          throw new AIError("이미지 생성 결과가 비어있습니다.", {
            code: "INVALID_RESPONSE",
          });
        }

        const base64 = data.predictions[0].bytesBase64Encoded;
        return Buffer.from(base64, "base64");
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      lastError = error as Error;

      if (error instanceof AIError && error.code === "API_KEY_MISSING") {
        throw error;
      }

      if (attempt < IMAGEN_CONFIG.maxRetries) {
        const backoffDelay =
          IMAGEN_CONFIG.retryDelay * Math.pow(2, attempt);
        await sleep(backoffDelay);
        continue;
      }
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
    .from(IMAGEN_CONFIG.bucket)
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
  } = supabase.storage
    .from(IMAGEN_CONFIG.bucket)
    .getPublicUrl(data.path);

  return publicUrl;
};

// ============================================================
// 공개 API
// ============================================================

/**
 * 전생 이미지 생성 및 업로드
 *
 * 1. imagePrompt로 Imagen 3 API 호출 (캐릭터 일러스트 스타일)
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
    const imageBuffer = await generateImageWithImagen(imagePrompt);
    const publicUrl = await uploadToStorage(imageBuffer, profileId);
    return publicUrl;
  } catch (error) {
    console.error("전생 이미지 생성/업로드 실패:", error);
    return null;
  }
};
