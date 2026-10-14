import { ZiWeiError } from "@/libs/zi-wei-dou-shu/errors";
import type {
  CalculateDailyFortune,
  DailyFortuneKeys,
} from "@/libs/zi-wei-dou-shu/calculators/daily-fortune-types";
import type { DailySlug } from "@/libs/zi-wei-dou-shu/constants/daily-fortune-table";
import type { ZiweiChart, ZiweiInput } from "@/libs/zi-wei-dou-shu/types";

import { DailyError } from "../errors";
import { buildDailyFortuneView, getDailyFortuneView } from "../service";

jest.mock("@/libs/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

const KEYS: DailyFortuneKeys = {
  date: "2026-10-14",
  confidence: "exact",
  headline: "df-hl-ziwei-bright-v1",
  categories: {
    overall: { level: 4, slug: "df-ob-l4-lead-v1" },
    love: { level: 3, slug: "df-cb-love-l3-steady-v1" },
    money: { level: 5, slug: "df-cb-money-l5-support-v1" },
    work: { level: 2, slug: "df-cb-work-l2-burden-v1" },
    health: { level: 1, slug: "df-cb-health-l1-burden-v1" },
  },
  variable: "df-vr-rok-money-v1",
  caution: { category: "health", slug: "df-ca-health-firm-v1" },
  tip: "df-tp-o-calm-v1",
  keywords: {
    color: "df-kc-water-1",
    item: "df-ki-water-3",
    number: 7,
    timeSlot: "df-kt-o",
    reason: "df-kr-water-nourish-v1",
    directionBranch: 3,
  },
};

const collectSlugs = (keys: DailyFortuneKeys): DailySlug[] => {
  const { categories, keywords, caution } = keys;
  return [
    keys.headline,
    categories.overall.slug,
    categories.love.slug,
    categories.money.slug,
    categories.work.slug,
    categories.health.slug,
    ...(keys.variable ? [keys.variable] : []),
    caution.slug,
    keys.tip,
    keywords.color,
    keywords.item,
    keywords.timeSlot,
    keywords.reason,
  ];
};

const buildDictionary = (
  keys: DailyFortuneKeys
): Partial<Record<DailySlug, string>> =>
  Object.fromEntries(collectSlugs(keys).map((slug) => [slug, `문구:${slug}`]));

const INPUT: ZiweiInput = {
  name: "테스트",
  birthDate: "1990-05-15",
  birthTime: "unknown",
  gender: "female",
  calendarType: "solar",
};

describe("buildDailyFortuneView", () => {
  it("엔진 키를 사전으로 해석해 DTO를 조립한다", () => {
    const view = buildDailyFortuneView(KEYS, {
      dictionary: buildDictionary(KEYS),
      hasLifetime: false,
    });

    expect(view.date).toBe("2026-10-14");
    expect(view.headline).toEqual({
      slug: "df-hl-ziwei-bright-v1",
      text: "문구:df-hl-ziwei-bright-v1",
    });
    expect(view.overall.level).toBe(4);
    expect(view.categories.map((c) => c.category)).toEqual([
      "love",
      "money",
      "work",
      "health",
    ]);
    expect(view.categories.map((c) => c.level)).toEqual([3, 5, 2, 1]);
    expect(view.variable?.text).toBe("문구:df-vr-rok-money-v1");
    expect(view.keywords.number).toBe(7);
  });

  it("문구와 level은 같은 키에서 파생된다 (슬러그의 level 접두와 일치)", () => {
    const view = buildDailyFortuneView(KEYS, {
      dictionary: buildDictionary(KEYS),
      hasLifetime: false,
    });

    [view.overall, ...view.categories].forEach((c) => {
      expect(c.slug).toContain(`-l${c.level}-`);
    });
  });

  it("DTO에 directionBranch 등 개인정보 파생 키가 없다", () => {
    const view = buildDailyFortuneView(KEYS, {
      dictionary: buildDictionary(KEYS),
      hasLifetime: false,
    });

    expect(JSON.stringify(view)).not.toMatch(
      /directionBranch|birth|profileId|wuxingJu/
    );
  });

  it("건강이 주의 포인트여도 CTA 카테고리는 건강이 아니다", () => {
    const view = buildDailyFortuneView(KEYS, {
      dictionary: buildDictionary(KEYS),
      hasLifetime: false,
    });

    expect(view.caution.category).toBe("health");
    expect(view.cta).toEqual({ category: "overall", product: "lifetime" });
  });

  it("구매자는 올해운세/궁합 CTA를 받는다", () => {
    const view = buildDailyFortuneView(KEYS, {
      dictionary: buildDictionary(KEYS),
      hasLifetime: true,
    });

    expect(view.cta.product).toBe("yearly_compatibility");
  });

  it("variable이 null이면 DTO도 null이다", () => {
    const keys = { ...KEYS, variable: null };
    const view = buildDailyFortuneView(keys, {
      dictionary: buildDictionary(keys),
      hasLifetime: false,
    });

    expect(view.variable).toBeNull();
  });

  it("사전에 슬러그가 없으면 DICTIONARY_MISS로 실패한다 (대체 문구 없음)", () => {
    const dictionary = buildDictionary(KEYS);
    delete dictionary["df-tp-o-calm-v1"];

    try {
      buildDailyFortuneView(KEYS, { dictionary, hasLifetime: false });
      throw new Error("에러가 발생해야 합니다.");
    } catch (error) {
      expect(error).toBeInstanceOf(DailyError);
      expect((error as DailyError).code).toBe("DICTIONARY_MISS");
      expect((error as DailyError).context).toEqual({
        slug: "df-tp-o-calm-v1",
      });
    }
  });

  it("빈 문자열 문구도 미스로 취급한다", () => {
    const dictionary = { ...buildDictionary(KEYS), "df-tp-o-calm-v1": "" };

    expect(() =>
      buildDailyFortuneView(KEYS, { dictionary, hasLifetime: false })
    ).toThrow(DailyError);
  });
});

describe("getDailyFortuneView", () => {
  const fakeChart = { fake: true } as unknown as ZiweiChart;

  it("가짜 엔진을 주입해 명반과 KST 날짜를 그대로 넘긴다", () => {
    const calculate = jest.fn<
      ReturnType<CalculateDailyFortune>,
      Parameters<CalculateDailyFortune>
    >(() => KEYS);
    const generateChart = jest.fn(() => fakeChart);

    const view = getDailyFortuneView(
      { input: INPUT, kstDate: "2026-10-14", hasLifetime: false },
      { calculate, generateChart, dictionary: buildDictionary(KEYS) }
    );

    expect(generateChart).toHaveBeenCalledWith(INPUT);
    expect(calculate).toHaveBeenCalledWith(fakeChart, "2026-10-14");
    expect(view.headline.slug).toBe(KEYS.headline);
  });

  it("엔진이 ZiWeiError를 던지면 입력 없이 CALCULATION_FAILED로 바꾼다", () => {
    const calculate: CalculateDailyFortune = () => {
      throw new ZiWeiError("엔진 실패", { code: "CALCULATION_ERROR" });
    };

    try {
      getDailyFortuneView(
        { input: INPUT, kstDate: "2026-10-14", hasLifetime: false },
        { calculate, generateChart: () => fakeChart }
      );
      throw new Error("에러가 발생해야 합니다.");
    } catch (error) {
      expect(error).toBeInstanceOf(DailyError);
      const daily = error as DailyError;
      expect(daily.code).toBe("CALCULATION_FAILED");
      expect(JSON.stringify(daily.context)).not.toContain("1990");
    }
  });

  it("예상 밖 예외는 가리지 않고 그대로 전파한다", () => {
    const calculate: CalculateDailyFortune = () => {
      throw new TypeError("버그");
    };

    expect(() =>
      getDailyFortuneView(
        { input: INPUT, kstDate: "2026-10-14", hasLifetime: false },
        { calculate, generateChart: () => fakeChart }
      )
    ).toThrow(TypeError);
  });
});
