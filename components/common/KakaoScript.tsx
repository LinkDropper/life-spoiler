"use client";

import Script from "next/script";

import { initKakao } from "@/libs/kakao";

/**
 * Kakao SDK 스크립트 컴포넌트
 *
 * 레이아웃에 추가하여 Kakao SDK를 로드하고 초기화합니다.
 */
export const KakaoScript = () => {
  return (
    <Script
      src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.9/kakao.min.js"
      strategy="afterInteractive"
      onLoad={initKakao}
    />
  );
};

export default KakaoScript;
