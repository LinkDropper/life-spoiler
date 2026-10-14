import {
  ALL_DAILY_SLUGS,
  DAILY_COMPLEMENT_TABLE,
  DAILY_ELEMENTS,
  DAILY_ELEMENT_DIGITS,
  DAILY_CATEGORIES,
  DAILY_LEVEL_CUTS,
  DAILY_LEVEL_CUTS_ESTIMATED,
  DAILY_REASON_KINDS,
  DAILY_SLOT_IDS,
  DAILY_SLOTS,
  getDailySlotOf,
  isDailySlug,
  isDailySlugOfSlot,
} from "@/libs/zi-wei-dou-shu/constants/daily-fortune-table";

import { DAILY_DICTIONARY_KO } from "../dictionary/ko";

describe("오늘의 운세 슬러그 카탈로그", () => {
  it("총 슬러그 수가 650 이하이고 중복이 없다", () => {
    expect(ALL_DAILY_SLUGS.length).toBeLessThanOrEqual(650);
    expect(new Set(ALL_DAILY_SLUGS).size).toBe(ALL_DAILY_SLUGS.length);
  });

  it("모든 슬러그가 df- 접두사와 소문자/숫자/하이픈만 사용한다", () => {
    ALL_DAILY_SLUGS.forEach((slug) => {
      expect(slug).toMatch(/^df-[a-z0-9]+(-[a-z0-9]+)*$/);
    });
  });

  it("슬롯별 슬러그 수 = 슬롯 합계이고 슬롯 역조회가 일치한다", () => {
    const sum = DAILY_SLOT_IDS.reduce(
      (acc, id) => acc + DAILY_SLOTS[id].slugs.length,
      0
    );
    expect(sum).toBe(ALL_DAILY_SLUGS.length);
    DAILY_SLOT_IDS.forEach((id) => {
      DAILY_SLOTS[id].slugs.forEach((slug) => {
        expect(getDailySlotOf(slug)).toBe(id);
      });
    });
  });

  it("isDailySlug / isDailySlugOfSlot가 알 수 없는 값을 거부한다", () => {
    expect(isDailySlug("df-hl-ziwei-bright-v1")).toBe(true);
    expect(isDailySlug("df-hl-ziwei-bright-v9")).toBe(false);
    expect(isDailySlug("<script>")).toBe(false);
    expect(isDailySlug(undefined)).toBe(false);
    expect(isDailySlugOfSlot("hl", "df-hl-ziwei-bright-v1")).toBe(true);
    expect(isDailySlugOfSlot("hx", "df-hl-ziwei-bright-v1")).toBe(false);
  });

  it("사전 샘플의 슬러그가 모두 카탈로그에 있고 길이 상한 이내다", () => {
    Object.entries(DAILY_DICTIONARY_KO).forEach(([slug, text]) => {
      expect(isDailySlug(slug)).toBe(true);
      const slot = getDailySlotOf(slug);
      expect(slot).not.toBeNull();
      if (slot && text) {
        expect(text.length).toBeLessThanOrEqual(DAILY_SLOTS[slot].maxChars);
      }
    });
  });

  it("모든 슬롯에 사전 샘플이 최소 1개 있다", () => {
    DAILY_SLOT_IDS.forEach((id) => {
      const has = DAILY_SLOTS[id].slugs.some(
        (slug) => DAILY_DICTIONARY_KO[slug] !== undefined
      );
      expect(has).toBe(true);
    });
  });
});

describe("오늘의 운세 엔진 상수 정합", () => {
  it("보완 오행 관계표가 25칸 모두 유효한 오행·이유 유형을 가진다", () => {
    DAILY_ELEMENTS.forEach((self) => {
      DAILY_ELEMENTS.forEach((day) => {
        const { element, kind } = DAILY_COMPLEMENT_TABLE[self][day];
        expect(DAILY_ELEMENTS).toContain(element);
        expect(DAILY_REASON_KINDS).toContain(kind);
      });
    });
  });

  it("같은 오행이면 match, 상생·상극 관계는 5종 유형으로 접힌다", () => {
    DAILY_ELEMENTS.forEach((e) => {
      expect(DAILY_COMPLEMENT_TABLE[e][e]).toEqual({
        element: e,
        kind: "match",
      });
    });
    // 수(self)가 목(day)을 낳음 → 소진을 채우는 쪽: 수를 낳는 금
    expect(DAILY_COMPLEMENT_TABLE.water.wood).toEqual({
      element: "metal",
      kind: "nourish",
    });
    // 토(day)가 수(self)를 이김 → 통관: 토가 낳는 금
    expect(DAILY_COMPLEMENT_TABLE.water.earth).toEqual({
      element: "metal",
      kind: "temper",
    });
  });

  it("오행별 숫자 풀은 한 자리(1~9)다", () => {
    DAILY_ELEMENTS.forEach((e) => {
      expect(DAILY_ELEMENT_DIGITS[e].length).toBeGreaterThan(0);
      DAILY_ELEMENT_DIGITS[e].forEach((n) => {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(9);
      });
    });
  });

  it("등급 컷이 카테고리마다 단조 증가한다", () => {
    DAILY_CATEGORIES.forEach((c) => {
      [DAILY_LEVEL_CUTS[c], DAILY_LEVEL_CUTS_ESTIMATED[c]].forEach((cuts) => {
        for (let i = 1; i < cuts.length; i += 1) {
          expect(cuts[i]).toBeGreaterThan(cuts[i - 1]);
        }
      });
    });
  });
});
