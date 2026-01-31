/**
 * Supabase Storage 유틸리티
 *
 * 이미지 업로드 및 공개 URL 생성 기능을 제공합니다.
 */

import { createBrowserClient } from "./browser";

const SHARE_IMAGES_BUCKET = "share-images";

/**
 * Blob을 Supabase Storage에 업로드하고 공개 URL을 반환합니다.
 *
 * @param blob - 업로드할 이미지 Blob
 * @param filename - 저장할 파일명 (확장자 포함)
 * @returns 업로드된 이미지의 공개 URL
 */
export const uploadShareImage = async (
  blob: Blob,
  filename: string
): Promise<string> => {
  const supabase = createBrowserClient();

  // 고유한 파일 경로 생성 (timestamp + random string)
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const filePath = `${timestamp}-${randomStr}-${filename}`;

  const { data, error } = await supabase.storage
    .from(SHARE_IMAGES_BUCKET)
    .upload(filePath, blob, {
      contentType: blob.type || "image/png",
      upsert: false,
    });

  if (error) {
    console.error("Failed to upload share image:", error);
    throw new Error("이미지 업로드에 실패했습니다.");
  }

  // 공개 URL 생성
  const {
    data: { publicUrl },
  } = supabase.storage.from(SHARE_IMAGES_BUCKET).getPublicUrl(data.path);

  return publicUrl;
};
