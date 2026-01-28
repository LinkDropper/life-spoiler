/**
 * 브라우저 관련 유틸리티 함수
 */

/**
 * 카카오톡 인앱 브라우저인지 확인
 */
export const isKakaoTalkBrowser = (): boolean => {
  if (typeof window === "undefined") return false;
  return /KAKAOTALK/i.test(navigator.userAgent);
};

/**
 * 외부 브라우저로 열기 (크롬 우선, 사파리 대체)
 */
export const openWithExternalBrowser = () => {
  if (typeof window === "undefined") return;

  const currentUrl = window.location.href;
  const encodedUrl = encodeURIComponent(currentUrl);
  const urlWithoutProtocol = currentUrl.replace(/^https?:\/\//, "");
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);

  if (isIOS) {
    // iOS: 크롬 시도 후 카카오톡 기본 외부 브라우저(사파리) 실행
    const chromeUrl = `googlechrome://${urlWithoutProtocol}`;

    const fallbackTimeout = setTimeout(() => {
      // 1초 후에도 페이지가 그대로면 카카오톡 외부 브라우저(사파리)로 열기
      window.location.href = `kakaotalk://web/openExternal?url=${encodedUrl}`;
    }, 1000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        clearTimeout(fallbackTimeout);
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // 크롬으로 열기 시도
    window.location.href = chromeUrl;
  } else if (isAndroid) {
    // Android: intent:// 형식으로 크롬 우선 실행 시도
    const scheme = window.location.protocol.slice(0, -1); // 'https' 또는 'http'
    const intentUrl = `intent://${urlWithoutProtocol}#Intent;scheme=${scheme};package=com.android.chrome;end`;

    const fallbackTimeout = setTimeout(() => {
      // 1초 후에도 페이지가 그대로면 카카오톡 외부 브라우저로 열기
      window.location.href = `kakaotalk://web/openExternal?url=${encodedUrl}`;
    }, 1000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        clearTimeout(fallbackTimeout);
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // 크롬으로 열기 시도
    window.location.href = intentUrl;
  } else {
    // 기타: 기본 외부 브라우저로 열기
    window.location.href = `kakaotalk://web/openExternal?url=${encodedUrl}`;
  }
};
