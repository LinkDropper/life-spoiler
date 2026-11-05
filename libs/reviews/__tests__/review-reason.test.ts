import translations from "@/messages/translations.json";

import {
  REVIEW_REASON_CODES,
  REVIEW_REASON_MESSAGE_KEYS,
  decodeReviewContent,
  encodeReviewContent,
} from "../review-reason";

const LOCALES = ["ko", "en", "ja"] as const;

describe("REVIEW_REASON_MESSAGE_KEYS", () => {
  it.each(LOCALES)("모든 칩 코드가 %s 번역 문구를 가진다", (locale) => {
    const reasons = translations[locale].fortune.common.review
      .reasons as Record<string, string>;
    REVIEW_REASON_CODES.forEach((code) => {
      expect(reasons[REVIEW_REASON_MESSAGE_KEYS[code]]).toEqual(
        expect.any(String)
      );
    });
  });
});

describe("encodeReviewContent / decodeReviewContent", () => {
  it("칩과 자유 텍스트를 함께 저장하고 되돌린다", () => {
    const encoded = encodeReviewContent(["cant_trust", "shallow"], "아쉬워요");
    expect(encoded).toBe("[cant_trust,shallow] 아쉬워요");
    expect(decodeReviewContent(encoded)).toEqual({
      reasons: ["cant_trust", "shallow"],
      freeText: "아쉬워요",
    });
  });
});
