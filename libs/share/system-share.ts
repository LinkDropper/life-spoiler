/**
 * 기기 공유 시트(Web Share API)로 보내기.
 * 주 유입 경로인 인스타그램은 웹에서 직접 보낼 길이 없어, 기기 공유 시트로 넘긴다.
 */

export type SystemShareResult = "shared" | "cancelled" | "unsupported";

export const canUseSystemShare = (): boolean =>
  typeof navigator !== "undefined" && typeof navigator.share === "function";

const runShare = async (data: ShareData): Promise<SystemShareResult> => {
  try {
    await navigator.share(data);
    return "shared";
  } catch (error) {
    // 사용자가 공유 시트를 닫으면 AbortError — 실패가 아니라 취소
    if (error instanceof DOMException && error.name === "AbortError") {
      return "cancelled";
    }
    throw error;
  }
};

export const shareLinkWithSystem = (data: {
  title: string;
  text?: string;
  url: string;
}): Promise<SystemShareResult> =>
  canUseSystemShare()
    ? runShare(data)
    : Promise.resolve<SystemShareResult>("unsupported");

/** 이미지 파일 공유. 파일 공유를 못 하는 브라우저면 unsupported (부르는 쪽에서 저장으로 대신) */
export const shareImageWithSystem = (data: {
  blob: Blob;
  filename: string;
  title: string;
}): Promise<SystemShareResult> => {
  if (!canUseSystemShare()) {
    return Promise.resolve("unsupported");
  }
  const file = new File([data.blob], data.filename, {
    type: data.blob.type || "image/png",
  });
  if (
    typeof navigator.canShare === "function" &&
    !navigator.canShare({ files: [file] })
  ) {
    return Promise.resolve("unsupported");
  }
  return runShare({ files: [file], title: data.title });
};
