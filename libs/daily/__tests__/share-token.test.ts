import { DailyError } from "../errors";
import {
  decodeShareToken,
  encodeShareToken,
  toShareKeys,
} from "../share-token";
import type { DailyShareKeys } from "../share-token";
import type { DailyFortuneView } from "../types";

const TODAY = "2026-10-20";

const KEYS: DailyShareKeys = {
  date: "2026-10-14",
  headline: "df-hl-ziwei-bright-v1",
  levels: { overall: 4, love: 3, money: 5, work: 1, health: 2 },
  color: "df-kc-water-1",
  item: "df-ki-water-3",
  number: 7,
  timeSlot: "df-kt-o",
};

const VALID = encodeShareToken(KEYS);

const replacePart = (index: number, value: string): string => {
  const parts = VALID.split(".");
  parts[index] = value;
  return parts.join(".");
};

const expectInvalid = (token: unknown): void => {
  try {
    decodeShareToken(token, TODAY);
    throw new Error("검증이 통과하면 안 됩니다.");
  } catch (error) {
    expect(error).toBeInstanceOf(DailyError);
    expect((error as DailyError).code).toBe("INVALID_SHARE_TOKEN");
  }
};

describe("공유 토큰", () => {
  it("정상 토큰은 왕복 변환된다", () => {
    expect(decodeShareToken(VALID, TODAY)).toEqual(KEYS);
  });

  it("시간 미상 한 줄(hx) 슬러그도 허용한다", () => {
    const token = replacePart(2, "df-hx-water-rok-v1");
    expect(decodeShareToken(token, TODAY).headline).toBe("df-hx-water-rok-v1");
  });

  it("토큰에 개인정보 키가 들어가지 않는다", () => {
    expect(VALID).not.toMatch(/profile|birth|name|direction/i);
  });

  it("카탈로그에 없는 슬러그(위조)를 거부한다", () => {
    expectInvalid(replacePart(2, "df-hl-ziwei-bright-v9"));
    expectInvalid(replacePart(2, "<script>alert(1)</script>"));
    expectInvalid(replacePart(4, "df-kc-water-9"));
  });

  it("다른 슬롯의 슬러그 주입을 거부한다", () => {
    // 한 줄 자리에 총운 본문, 색 자리에 소품, 시간대 자리에 한 줄
    expectInvalid(replacePart(2, "df-ob-l3-lead-v1"));
    expectInvalid(replacePart(4, "df-ki-water-3"));
    expectInvalid(replacePart(5, "df-kc-water-1"));
    expectInvalid(replacePart(7, "df-hl-ziwei-bright-v1"));
  });

  it("범위 밖 level을 거부한다", () => {
    expectInvalid(replacePart(3, "40523"));
    expectInvalid(replacePart(3, "4352"));
    expectInvalid(replacePart(3, "435231"));
    expectInvalid(replacePart(3, "4352a"));
  });

  it("숫자 칸 범위를 벗어나면 거부한다", () => {
    expectInvalid(replacePart(6, "0"));
    expectInvalid(replacePart(6, "10"));
    expectInvalid(replacePart(6, "a"));
  });

  it("미래 날짜와 서비스 시작 전 날짜를 거부한다", () => {
    expectInvalid(replacePart(1, "2026-10-21"));
    expectInvalid(replacePart(1, "2026-10-13"));
    expectInvalid(replacePart(1, "2026-02-30"));
  });

  it("칸 수, 버전, 타입, 길이가 어긋나면 거부한다", () => {
    expectInvalid(undefined);
    expectInvalid(["a"]);
    expectInvalid("");
    expectInvalid(`${VALID}.extra`);
    expectInvalid(replacePart(0, "2"));
    expectInvalid(`${VALID}${"a".repeat(300)}`);
  });
});

describe("toShareKeys", () => {
  const view: DailyFortuneView = {
    date: KEYS.date,
    confidence: "exact",
    headline: { slug: KEYS.headline, text: "한 줄" },
    overall: {
      category: "overall",
      level: 4,
      slug: "df-ob-l4-lead-v1",
      text: "t",
    },
    categories: [
      {
        category: "love",
        level: 3,
        slug: "df-cb-love-l3-steady-v1",
        text: "t",
      },
      {
        category: "money",
        level: 5,
        slug: "df-cb-money-l5-support-v1",
        text: "t",
      },
      {
        category: "work",
        level: 1,
        slug: "df-cb-work-l1-burden-v1",
        text: "t",
      },
      {
        category: "health",
        level: 2,
        slug: "df-cb-health-l2-steady-v1",
        text: "t",
      },
    ],
    variable: null,
    caution: { category: "work", slug: "df-ca-work-firm-v1", text: "t" },
    tip: { slug: "df-tp-o-calm-v1", text: "t" },
    keywords: {
      color: { slug: KEYS.color, label: "남색" },
      item: { slug: KEYS.item, label: "차" },
      number: 7,
      timeSlot: { slug: KEYS.timeSlot, label: "오후" },
      reason: { slug: "df-kr-water-nourish-v1", text: "t" },
    },
    cta: { category: "work", product: "lifetime" },
  };

  it("View에서 토큰 키를 뽑는다", () => {
    expect(toShareKeys(view)).toEqual(KEYS);
  });
});
