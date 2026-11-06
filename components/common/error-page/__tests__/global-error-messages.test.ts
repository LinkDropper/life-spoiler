import translations from "@/messages/translations.json";

import {
  GLOBAL_ERROR_MESSAGES,
  pickGlobalErrorLocale,
} from "../global-error-messages";

describe("pickGlobalErrorLocale", () => {
  it("브라우저 언어에서 지원 언어를 고르고, 모르면 한국어", () => {
    expect(pickGlobalErrorLocale("ja-JP")).toBe("ja");
    expect(pickGlobalErrorLocale("en-US")).toBe("en");
    expect(pickGlobalErrorLocale("ko")).toBe("ko");
    expect(pickGlobalErrorLocale("fr-FR")).toBe("ko");
    expect(pickGlobalErrorLocale(undefined)).toBe("ko");
  });
});

describe("GLOBAL_ERROR_MESSAGES", () => {
  it("번역 파일의 errorPage.error와 같은 문장을 쓴다", () => {
    (["ko", "en", "ja"] as const).forEach((locale) => {
      const source = translations[locale].errorPage.error;
      const copy = GLOBAL_ERROR_MESSAGES[locale];
      expect(copy.intermission).toBe(source.intermission);
      expect(copy.title).toBe(source.title);
      expect(copy.desc).toBe(source.desc);
      expect(copy.retry).toBe(source.retry);
      expect(copy.home).toBe(source.home);
      expect(copy.code("x1")).toBe(source.code.replace("{code}", "x1"));
    });
  });
});
