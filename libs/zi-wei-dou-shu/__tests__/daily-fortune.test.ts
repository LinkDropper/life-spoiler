import {
  DAILY_CAUTION,
  DAILY_SLOT_VARIANT_STRATEGY,
  calculateDailyFortune,
  diagnoseDailyFortune,
  getDailyDayInfo,
  prepareDailyFortune,
} from "../calculators/daily-fortune";
import type { DailyFortuneKeys } from "../calculators/daily-fortune-types";
import {
  getDailySlotOf,
  isDailySlug,
  isDailySlugOfSlot,
} from "../constants/daily-fortune-table";
import { generateZiweiChart } from "../core";
import { ZiWeiError } from "../errors";
import type { ZiweiChart, ZiweiInput } from "../types";

const NAME = "홍길동테스트";

const makeChart = (overrides: Partial<ZiweiInput> = {}): ZiweiChart =>
  generateZiweiChart({
    name: NAME,
    birthDate: "1990-05-15",
    birthTime: "12:30",
    gender: "male",
    calendarType: "solar",
    ...overrides,
  });

const shiftDate = (date: string, days: number): string => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

const range = (start: string, count: number): string[] =>
  Array.from({ length: count }, (_, i) => shiftDate(start, i));

const CHARTS: Record<string, () => ZiweiChart> = {
  exact: () => makeChart(),
  unknown: () => makeChart({ birthTime: "unknown" }),
  female: () =>
    makeChart({
      birthDate: "1985-11-03",
      birthTime: "23:40",
      gender: "female",
    }),
  lunarLeap: () =>
    makeChart({
      birthDate: "1995-08-10",
      calendarType: "lunar",
      isLeapMonth: true,
      birthTime: "unknown",
      gender: "female",
    }),
};

describe("오늘의 운세 엔진: 일진·음력·流日 명궁", () => {
  it("2026-10-13은 庚申일이고 음력 9월 3일이다", () => {
    const info = getDailyDayInfo("2026-10-13");
    expect(info.dayStem).toBe(6); // 庚
    expect(info.dayBranch).toBe(8); // 申
    expect(info.lunarMonth).toBe(9);
    expect(info.lunarDay).toBe(3);
    expect(info.yearStem).toBe(2); // 丙午년
  });

  it("流日 명궁 = 流月(월건 간이법, 정월=寅) + (음력일-1) 순행", () => {
    // 음력 9월 → 월지 戌(10), 음력 3일 → +2 → 子(0)
    expect(getDailyDayInfo("2026-10-13").mingBranch).toBe(0);
    // 음력 1일이면 월지 그대로 (2026-02-17 = 음력 1월 1일 → 寅)
    const newYear = getDailyDayInfo("2026-02-17");
    expect(newYear.lunarMonth).toBe(1);
    expect(newYear.lunarDay).toBe(1);
    expect(newYear.mingBranch).toBe(2);
  });

  it("60일 연속으로 일간·일지가 하루에 하나씩 순행한다", () => {
    const days = range("2026-08-01", 60).map(getDailyDayInfo);
    for (let i = 1; i < days.length; i += 1) {
      expect(days[i].dayStem).toBe((days[i - 1].dayStem + 1) % 10);
      expect(days[i].dayBranch).toBe((days[i - 1].dayBranch + 1) % 12);
    }
    // 60일 뒤에는 같은 일진으로 돌아온다
    expect(getDailyDayInfo(shiftDate("2026-08-01", 60))).toMatchObject({
      dayStem: days[0].dayStem,
      dayBranch: days[0].dayBranch,
    });
  });

  it("설날 전후(2026-02-16 / 02-17)에 연간이 乙→丙으로 바뀐다", () => {
    const before = getDailyDayInfo("2026-02-16");
    const after = getDailyDayInfo("2026-02-17");
    expect(before.lunarYear).toBe(2025);
    expect(before.yearStem).toBe(1); // 乙巳
    expect(after.lunarYear).toBe(2026);
    expect(after.yearStem).toBe(2); // 丙午
    // 일진은 연속 (辛酉 → 壬戌)
    expect(after.dayStem).toBe((before.dayStem + 1) % 10);
    expect(after.dayBranch).toBe((before.dayBranch + 1) % 12);
  });

  it("음력 월 경계에서 음력일이 1로 돌아가고 월이 바뀐다", () => {
    const last = getDailyDayInfo("2025-08-22"); // 윤6월 29일
    const first = getDailyDayInfo("2025-08-23"); // 7월 1일
    expect(last.lunarMonth).toBe(6);
    expect(first.lunarMonth).toBe(7);
    expect(first.lunarDay).toBe(1);
  });

  it("윤달은 본월과 같은 월건으로 처리한다", () => {
    const normal = getDailyDayInfo("2025-07-24"); // 6월 30일 (평달)
    const leap = getDailyDayInfo("2025-07-25"); // 윤6월 1일
    expect(leap.lunarMonth).toBe(normal.lunarMonth);
    expect(leap.monthStem).toBe(normal.monthStem);
    // 윤6월 1일의 流日 명궁은 6월(未=7)에서 +0
    expect(leap.mingBranch).toBe(7);
  });

  it("잘못된 날짜는 ZiWeiError(INVALID_DATE)를 던진다", () => {
    const chart = makeChart();
    expect(() => calculateDailyFortune(chart, "2026-13-01")).toThrow(
      ZiWeiError
    );
    expect(() => calculateDailyFortune(chart, "2026/10/13")).toThrow(
      ZiWeiError
    );
    expect(() => calculateDailyFortune(chart, "2026-02-30")).toThrow(
      ZiWeiError
    );
  });
});

describe("오늘의 운세 엔진: 결정성·순수성", () => {
  it("같은 입력은 같은 출력이 나온다 (호출 순서·캐시와 무관)", () => {
    Object.values(CHARTS).forEach((make) => {
      const chart = make();
      const first = calculateDailyFortune(chart, "2026-10-13");
      calculateDailyFortune(chart, "2026-10-14");
      calculateDailyFortune(chart, "2026-10-12");
      const second = calculateDailyFortune(make(), "2026-10-13");
      expect(second).toEqual(first);
    });
  });

  it("prepareDailyFortune과 calculateDailyFortune 결과가 같다", () => {
    const chart = makeChart();
    const prepared = prepareDailyFortune(chart);
    range("2026-03-01", 10).forEach((date) => {
      expect(prepared(date)).toEqual(calculateDailyFortune(chart, date));
    });
  });

  it("Math.random과 Date.now를 호출하지 않는다", () => {
    const random = jest.spyOn(Math, "random");
    const now = jest.spyOn(Date, "now");
    Object.values(CHARTS).forEach((make) => {
      calculateDailyFortune(make(), "2026-10-13");
    });
    expect(random).not.toHaveBeenCalled();
    expect(now).not.toHaveBeenCalled();
  });

  it("이름이 달라도 출생 정보가 같으면 결과가 같다", () => {
    const a = calculateDailyFortune(
      makeChart({ name: "가나다" }),
      "2026-10-13"
    );
    const b = calculateDailyFortune(
      makeChart({ name: "라마바" }),
      "2026-10-13"
    );
    expect(a).toEqual(b);
  });

  it("사람이 다르면 같은 날에도 결과가 달라진다", () => {
    const a = calculateDailyFortune(makeChart(), "2026-10-13");
    const b = calculateDailyFortune(CHARTS.female(), "2026-10-13");
    expect(a).not.toEqual(b);
  });

  it("날짜가 다르면 결과가 달라진다 (60일 동안 한 줄이 한 가지로 고정되지 않음)", () => {
    const chart = makeChart();
    const headlines = new Set(
      range("2026-09-01", 60).map(
        (d) => calculateDailyFortune(chart, d).headline
      )
    );
    expect(headlines.size).toBeGreaterThan(15);
  });
});

const collectSlugs = (r: DailyFortuneKeys): string[] => [
  r.headline,
  r.categories.overall.slug,
  r.categories.love.slug,
  r.categories.money.slug,
  r.categories.work.slug,
  r.categories.health.slug,
  ...(r.variable ? [r.variable] : []),
  r.caution.slug,
  r.tip,
  r.keywords.color,
  r.keywords.item,
  r.keywords.timeSlot,
  r.keywords.reason,
];

describe("오늘의 운세 엔진: 산출 범위", () => {
  const dates = range("2025-12-20", 120); // 연말·설날·월 경계 포함

  it.each(Object.keys(CHARTS))(
    "[%s] 모든 출력 슬러그가 카탈로그 안에 있고 슬롯이 맞다",
    (key) => {
      const fn = prepareDailyFortune(CHARTS[key]());
      dates.forEach((date) => {
        const r = fn(date);
        collectSlugs(r).forEach((slug) => {
          expect(isDailySlug(slug)).toBe(true);
        });
        expect(
          isDailySlugOfSlot(r.confidence === "exact" ? "hl" : "hx", r.headline)
        ).toBe(true);
        expect(getDailySlotOf(r.categories.overall.slug)).toBe("ob");
        (["love", "money", "work", "health"] as const).forEach((c) => {
          expect(getDailySlotOf(r.categories[c].slug)).toBe("cb");
          expect(r.categories[c].slug).toContain(`-${c}-`);
        });
        expect(getDailySlotOf(r.caution.slug)).toBe("ca");
        expect(r.caution.slug).toContain(`-${r.caution.category}-`);
        expect(getDailySlotOf(r.tip)).toBe("tp");
        expect(getDailySlotOf(r.keywords.color)).toBe("kc");
        expect(getDailySlotOf(r.keywords.item)).toBe("ki");
        expect(getDailySlotOf(r.keywords.timeSlot)).toBe("kt");
        expect(getDailySlotOf(r.keywords.reason)).toBe("kr");
        if (r.variable) expect(getDailySlotOf(r.variable)).toBe("vr");
      });
    }
  );

  it.each(Object.keys(CHARTS))(
    "[%s] 숫자는 1~9, level은 1~5, 방향 지지는 0~11이다",
    (key) => {
      const fn = prepareDailyFortune(CHARTS[key]());
      dates.forEach((date) => {
        const r = fn(date);
        expect(Number.isInteger(r.keywords.number)).toBe(true);
        expect(r.keywords.number).toBeGreaterThanOrEqual(1);
        expect(r.keywords.number).toBeLessThanOrEqual(9);
        expect(r.keywords.directionBranch).toBeGreaterThanOrEqual(0);
        expect(r.keywords.directionBranch).toBeLessThanOrEqual(11);
        [
          r.categories.overall,
          r.categories.love,
          r.categories.money,
          r.categories.work,
          r.categories.health,
        ].forEach((c) => {
          expect([1, 2, 3, 4, 5]).toContain(c.level);
          // 점수-텍스트 일치: 본문 슬러그의 level은 출력 level과 같은 값에서 파생
          expect(c.slug).toContain(`-l${c.level}-`);
        });
        expect(r.date).toBe(date);
      });
    }
  );

  it("주의 포인트는 (건강 제한을 적용한) 후보 중 최저 level이고 톤이 level과 맞다", () => {
    Object.values(CHARTS).forEach((make) => {
      const fn = prepareDailyFortune(make());
      range("2026-01-01", 200).forEach((date) => {
        const r = fn(date);
        const levels = {
          overall: r.categories.overall.level,
          love: r.categories.love.level,
          money: r.categories.money.level,
          work: r.categories.work.level,
          health: r.categories.health.level,
        };
        // 건강은 level <= 2일 때만 후보
        const candidates = Object.entries(levels).filter(
          ([k, v]) => k !== "health" || v <= DAILY_CAUTION.healthMaxLevel
        );
        const lowest = Math.min(...candidates.map(([, v]) => v));
        const picked = levels[r.caution.category];
        expect(picked).toBe(lowest);
        if (r.caution.category === "health") {
          expect(levels.health).toBeLessThanOrEqual(1);
        }
        expect(r.caution.slug).toContain(picked <= 2 ? "-firm-" : "-mild-");
      });
    });
  });

  it("건강이 최저여도 level 2 이상이면 주의 포인트가 되지 않는다", () => {
    let sawHealthLowestMild = false;
    Object.values(CHARTS).forEach((make) => {
      const fn = prepareDailyFortune(make());
      range("2026-01-01", 365).forEach((date) => {
        const r = fn(date);
        const all = Object.values(r.categories).map((c) => c.level);
        if (
          r.categories.health.level >= 2 &&
          r.categories.health.level === Math.min(...all)
        ) {
          sawHealthLowestMild = true;
          expect(r.caution.category).not.toBe("health");
        }
      });
    });
    expect(sawHealthLowestMild).toBe(true);
  });

  it("한 줄 밝기군은 총운 level과 정렬된다 (총운>=4 dark 없음, 총운<=2 bright 없음)", () => {
    const fn = prepareDailyFortune(makeChart());
    const fn2 = prepareDailyFortune(
      makeChart({ birthDate: "1985-11-03", birthTime: "23:40" })
    );
    [fn, fn2].forEach((f) => {
      range("2026-01-01", 365).forEach((date) => {
        const r = f(date);
        const [, group] = /-(bright|neutral|dark)-v\d$/.exec(r.headline) ?? [];
        expect(group).toBeDefined();
        if (r.categories.overall.level >= 4) expect(group).not.toBe("dark");
        if (r.categories.overall.level <= 2) expect(group).not.toBe("bright");
      });
    });
  });

  it("슬롯별 변형 전략: hl·ob·cb는 12일 단위로 변형이 유지된다 (cycle)", () => {
    expect(DAILY_SLOT_VARIANT_STRATEGY.hl).toBe("cycle");
    expect(DAILY_SLOT_VARIANT_STRATEGY.ob).toBe("cycle");
    expect(DAILY_SLOT_VARIANT_STRATEGY.cb).toEqual({
      exact: "cycle",
      estimated: "hash",
    });
    expect(DAILY_SLOT_VARIANT_STRATEGY.kr).toBe("hash");
    // cycle: floor(dayNumber/12)가 같은 날들은 같은 변형. 12일 블록 하나를 찾아 검증한다.
    const fn = prepareDailyFortune(makeChart());
    const variantOf = (slug: string): string => slug.slice(-2);
    const blocks = new Map<number, Set<string>>();
    range("2026-03-01", 48).forEach((date) => {
      const [y, m, d] = date.split("-").map(Number);
      const block = Math.floor(Date.UTC(y, m - 1, d) / 86400000 / 12);
      const set = blocks.get(block) ?? new Set<string>();
      set.add(variantOf(fn(date).categories.love.slug));
      blocks.set(block, set);
    });
    blocks.forEach((set) => expect(set.size).toBe(1));
  });

  it("variantStrategy 옵션으로 전 슬롯 hash를 강제할 수 있다 (되돌림 경로)", () => {
    const chart = makeChart();
    const forced = prepareDailyFortune(chart, { variantStrategy: "hash" });
    const byTable = prepareDailyFortune(chart);
    const differs = range("2026-01-01", 60).some(
      (date) => forced(date).headline !== byTable(date).headline
    );
    expect(differs).toBe(true);
  });

  it("팁 무드는 총운 level에서, 팁 지지는 일진 지지에서 파생된다", () => {
    const fn = prepareDailyFortune(makeChart());
    const branchSlugs = [
      "ja",
      "chuk",
      "in",
      "myo",
      "jin",
      "sa",
      "o",
      "mi",
      "sin",
      "yu",
      "sul",
      "hae",
    ];
    range("2026-01-01", 60).forEach((date) => {
      const r = fn(date);
      const { dayBranch } = getDailyDayInfo(date);
      expect(r.tip).toContain(`df-tp-${branchSlugs[dayBranch]}-`);
      expect(r.tip).toContain(
        r.categories.overall.level <= 3 ? "-calm-" : "-lift-"
      );
    });
  });

  it("변수 문장은 해당 카테고리 등급의 방향을 거스르지 않는다", () => {
    const fn = prepareDailyFortune(makeChart());
    range("2026-01-01", 300).forEach((date) => {
      const r = fn(date);
      if (!r.variable) return;
      const [, , kind, category] = r.variable.split("-");
      const { level } = r.categories[category as keyof typeof r.categories];
      if (kind === "gi") expect(level).toBeLessThanOrEqual(3);
      else expect(level).toBeGreaterThanOrEqual(3);
    });
  });
});

describe("오늘의 운세 엔진: 시간 미상", () => {
  it("confidence=estimated, 한 줄은 hx 슬롯, 시간대는 일진 지지다", () => {
    const fn = prepareDailyFortune(CHARTS.unknown());
    const branchSlugs = [
      "ja",
      "chuk",
      "in",
      "myo",
      "jin",
      "sa",
      "o",
      "mi",
      "sin",
      "yu",
      "sul",
      "hae",
    ];
    range("2026-04-01", 40).forEach((date) => {
      const r = fn(date);
      const { dayBranch } = getDailyDayInfo(date);
      expect(r.confidence).toBe("estimated");
      expect(r.headline.startsWith("df-hx-")).toBe(true);
      expect(r.keywords.timeSlot).toBe(`df-kt-${branchSlugs[dayBranch]}`);
      expect(r.keywords.directionBranch).toBe(dayBranch);
    });
  });

  it("시간 확정 프로필은 confidence=exact, 한 줄은 hl 슬롯이다", () => {
    const r = calculateDailyFortune(makeChart(), "2026-10-13");
    expect(r.confidence).toBe("exact");
    expect(r.headline.startsWith("df-hl-")).toBe(true);
  });

  it("시간 미상은 극단 등급(1·5)을 단정하지 않는다", () => {
    const fn = prepareDailyFortune(CHARTS.unknown());
    range("2026-01-01", 365).forEach((date) => {
      const r = fn(date);
      [
        r.categories.overall,
        r.categories.love,
        r.categories.money,
        r.categories.work,
        r.categories.health,
      ].forEach((c) => {
        expect(c.level).toBeGreaterThanOrEqual(2);
        expect(c.level).toBeLessThanOrEqual(4);
      });
    });
  });

  it("시간 미상 키워드는 생년 납음 오행 기반이라 시진 입력과 무관하게 같은 보완 오행을 쓴다", () => {
    const a = prepareDailyFortune(CHARTS.unknown());
    const b = prepareDailyFortune(makeChart({ birthTime: "unknown" }));
    range("2026-06-01", 20).forEach((date) => {
      expect(a(date).keywords).toEqual(b(date).keywords);
    });
  });
});

describe("오늘의 운세 엔진: 극단 등급 3일 연속 완화", () => {
  // 사전 탐색으로 찾은 실제 사례: 1970-03-15 09:30 여성, 건강 카테고리,
  // 2026-01-19~21 3일 연속 원 등급 5 → 3일째(2026-01-21)는 4로 완화
  const chart = makeChart({
    birthDate: "1970-03-15",
    birthTime: "09:30",
    gender: "female",
  });

  it("원 등급이 3일 연속 극단이면 3일째를 한 단계 안쪽으로 옮긴다", () => {
    const day3 = diagnoseDailyFortune(chart, "2026-01-21");
    const day2 = diagnoseDailyFortune(chart, "2026-01-20");
    const day1 = diagnoseDailyFortune(chart, "2026-01-19");
    expect(day1.rawLevels.health).toBe(5);
    expect(day2.rawLevels.health).toBe(5);
    expect(day3.rawLevels.health).toBe(5);
    // 앞 이틀은 완화되지 않는다 (무상태 재계산, 과거 날에는 완화를 적용하지 않음)
    expect(day1.levels.health).toBe(5);
    expect(day2.levels.health).toBe(5);
    expect(day3.levels.health).toBe(4);
    // 공개 출력도 같은 level에서 파생된다
    const out = calculateDailyFortune(chart, "2026-01-21");
    expect(out.categories.health.level).toBe(4);
    expect(out.categories.health.slug).toContain("-l4-");
  });

  it("완화는 전체 기간에서 어떤 카테고리도 극단 3연속을 남기지 않는다", () => {
    const fn = prepareDailyFortune(chart);
    const results = range("2026-01-01", 365).map((d) => fn(d));
    (["overall", "love", "money", "work", "health"] as const).forEach((c) => {
      let streak = 0;
      let last = 0;
      results.forEach((r) => {
        const { level } = r.categories[c];
        const extreme = level === 1 || level === 5;
        streak = extreme && level === last ? streak + 1 : extreme ? 1 : 0;
        last = extreme ? level : 0;
        expect(streak).toBeLessThan(3);
      });
    });
  });
});

const PERSONAL_KEYS = [
  "id",
  "userId",
  "user_id",
  "profileId",
  "profile_id",
  "name",
  "birthDate",
  "birth_date",
  "birthTime",
  "birth_time",
  "gender",
  "calendarType",
  "isLeapMonth",
  "chart",
  "palaces",
  "stars",
  "mainStars",
  "lifePalace",
  "bodyPalace",
  "wuxingJu",
  "sihua",
  "input",
  "lunarDate",
];

const deepKeys = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.flatMap(deepKeys);
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => [k, ...deepKeys(v)]);
  }
  return [];
};

describe("오늘의 운세 엔진: 개인정보 비노출", () => {
  it.each(Object.keys(CHARTS))("[%s] 출력에 개인정보 키·값이 없다", (key) => {
    const chart = CHARTS[key]();
    const fn = prepareDailyFortune(chart);
    range("2026-10-01", 15).forEach((date) => {
      const r = fn(date);
      const keys = deepKeys(r);
      PERSONAL_KEYS.forEach((k) => expect(keys).not.toContain(k));
      const json = JSON.stringify(r);
      expect(json).not.toContain(NAME);
      expect(json).not.toContain(chart.input.birthDate);
    });
  });
});
