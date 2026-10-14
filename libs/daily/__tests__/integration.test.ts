import type { ZiweiInput } from "@/libs/zi-wei-dou-shu/types";

import { DAILY_DICTIONARY_KO } from "../dictionary/ko";
import { DAILY_SERVICE_START_DATE } from "../kst-date";
import { getDailyFortuneView, getSharedDailyCard } from "../service";
import {
  decodeShareToken,
  encodeShareToken,
  toShareKeys,
} from "../share-token";

jest.mock("@/libs/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

/**
 * 실제 엔진 + 실제 KO 사전 통합 테스트 (목 없음).
 * 슬러그↔사전 전수 매칭이 깨지면 DICTIONARY_MISS로 실패한다.
 */

const DAYS = 60;

const CHARTS: { label: string; input: ZiweiInput }[] = [
  {
    label: "시간 확정 / 여성 / 양력",
    input: {
      name: "가",
      birthDate: "1990-05-15",
      birthTime: "14:30",
      gender: "female",
      calendarType: "solar",
    },
  },
  {
    label: "시간 확정 / 남성 / 양력 / 자시",
    input: {
      name: "나",
      birthDate: "1985-12-31",
      birthTime: "23:40",
      gender: "male",
      calendarType: "solar",
    },
  },
  {
    label: "시간 확정 / 남성 / 음력",
    input: {
      name: "다",
      birthDate: "1978-03-08",
      birthTime: "06:05",
      gender: "male",
      calendarType: "lunar",
    },
  },
  {
    label: "시간 확정 / 여성 / 음력 윤달",
    input: {
      name: "라",
      birthDate: "1995-08-20",
      birthTime: "12:00",
      gender: "female",
      calendarType: "lunar",
      isLeapMonth: true,
    },
  },
  {
    label: "시간 미상 / 여성",
    input: {
      name: "마",
      birthDate: "2001-02-04",
      birthTime: "unknown",
      gender: "female",
      calendarType: "solar",
    },
  },
  {
    label: "시간 미상 / 남성 / 음력",
    input: {
      name: "바",
      birthDate: "1969-11-11",
      birthTime: "unknown",
      gender: "male",
      calendarType: "lunar",
    },
  },
];

const addDays = (date: string, days: number): string => {
  const base = new Date(`${date}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
};

const DATES = Array.from({ length: DAYS }, (_, index) =>
  addDays(DAILY_SERVICE_START_DATE, index)
);
const LAST_DATE = DATES[DATES.length - 1];

describe.each(CHARTS)("실데이터 통합: $label", ({ input }) => {
  it(`연속 ${DAYS}일 DTO 조립 + 공유 토큰 왕복이 성공한다`, () => {
    const expectedConfidence =
      input.birthTime === "unknown" ? "estimated" : "exact";

    for (const kstDate of DATES) {
      const view = getDailyFortuneView({
        input,
        kstDate,
        hasLifetime: false,
      });

      expect(view.date).toBe(kstDate);
      expect(view.confidence).toBe(expectedConfidence);
      expect(view.headline.text.length).toBeGreaterThan(0);
      expect(view.categories.map((c) => c.category)).toEqual([
        "love",
        "money",
        "work",
        "health",
      ]);
      expect(view.cta.category).not.toBe("health");

      // 공유 토큰 왕복: encode -> decode -> 수신자 카드
      const token = encodeShareToken(toShareKeys(view));
      expect(decodeShareToken(token, LAST_DATE)).toEqual(toShareKeys(view));

      const card = getSharedDailyCard(token, LAST_DATE);
      expect(card).toEqual({
        date: kstDate,
        headline: view.headline.text,
        overallLevel: view.overall.level,
        color: view.keywords.color.label,
        colorSlug: view.keywords.color.slug,
        item: view.keywords.item.label,
        number: view.keywords.number,
        timeSlot: view.keywords.timeSlot.label,
      });

      // 토큰에는 개인정보가 들어가지 않는다
      expect(token).not.toContain(input.name);
      expect(token).not.toContain(input.birthDate);
    }
  });

  it("같은 입력과 날짜는 항상 같은 결과를 낸다", () => {
    const args = { input, kstDate: DATES[7], hasLifetime: true };
    expect(getDailyFortuneView(args)).toEqual(getDailyFortuneView(args));
  });
});

describe("KO 사전", () => {
  it("모든 문구가 비어 있지 않다", () => {
    const empty = Object.entries(DAILY_DICTIONARY_KO).filter(
      ([, text]) => text.trim().length === 0
    );
    expect(empty).toEqual([]);
  });
});
