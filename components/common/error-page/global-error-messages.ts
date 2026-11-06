import type { Locale } from "@/i18n/config";

/**
 * 최상위 오류(app/global-error.tsx) 전용 문구.
 * global-error는 루트 레이아웃을 대신 그려 next-intl Provider 밖에 있고,
 * 전체 번역 파일을 클라이언트에 싣지 않으려고 messages/translations.json의
 * errorPage.error와 같은 문장을 여기 따로 둔다. 문구를 바꾸면 두 곳을 함께 바꾼다.
 */
export interface GlobalErrorMessages {
  intermission: string;
  title: string;
  desc: string;
  code: (code: string) => string;
  retry: string;
  home: string;
}

export const GLOBAL_ERROR_MESSAGES: Record<Locale, GlobalErrorMessages> = {
  ko: {
    intermission: "상영이 잠시 멈췄어요",
    title: "화면을 불러오지 못했어요",
    desc: "잠깐 연결이 고르지 않았을 수 있어요. 다시 불러오면 이어서 볼 수 있어요.",
    code: (code) => `오류 코드 ${code}`,
    retry: "다시 불러오기",
    home: "로비로 가기",
  },
  en: {
    intermission: "The screening paused",
    title: "We couldn't load this screen",
    desc: "The connection may have been unsteady for a moment. Reload to keep watching.",
    code: (code) => `Error code ${code}`,
    retry: "Reload",
    home: "Go to the lobby",
  },
  ja: {
    intermission: "上映が一時停止しました",
    title: "画面を読み込めませんでした",
    desc: "一時的に接続が不安定だった可能性があります。再読み込みすると続きから見られます。",
    code: (code) => `エラーコード ${code}`,
    retry: "再読み込み",
    home: "ロビーへ",
  },
};

/** 브라우저 언어("ja-JP", "en-US" …)에서 지원 언어를 고른다. 모르면 한국어 */
export const pickGlobalErrorLocale = (language: string | undefined): Locale => {
  const base = language?.toLowerCase().split("-")[0];
  if (base === "en" || base === "ja") {
    return base;
  }
  return "ko";
};
