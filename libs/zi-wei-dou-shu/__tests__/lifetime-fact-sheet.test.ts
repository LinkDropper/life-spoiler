import { calculateDayun } from "../calculators/dayun";
import {
  buildLifetimeFactSheet,
  calculateFlyingSihua,
  calculateTiming,
} from "../calculators/lifetime-facts";
import { generateZiweiChart } from "../core";
import type { ZiweiInput } from "../types";

const INPUTS: ZiweiInput[] = [
  {
    name: "a",
    birthDate: "1990-05-15",
    birthTime: "10:30",
    gender: "male",
    calendarType: "solar",
  },
  {
    name: "b",
    birthDate: "1985-11-02",
    birthTime: "23:10",
    gender: "female",
    calendarType: "solar",
  },
  {
    name: "c",
    birthDate: "2001-02-20",
    birthTime: "04:00",
    gender: "female",
    calendarType: "solar",
  },
] as ZiweiInput[];

const setup = (input: ZiweiInput) => {
  const chart = generateZiweiChart(input);
  const dayun = calculateDayun(chart, 100, "ko");
  return { chart, dayun };
};

describe("대운 천간", () => {
  it.each(INPUTS)("대운궁의 궁간과 같다: $birthDate", (input) => {
    const { dayun } = setup(input);
    for (const period of dayun.periods) {
      expect(period.stemIndex).toBe(period.palace.stem);
    }
  });
});

describe("비행사화", () => {
  it("12궁 각각 4개 사화를 날린다 (별이 명반에 없으면 생략)", () => {
    const { chart } = setup(INPUTS[0]);
    const flights = calculateFlyingSihua(chart);
    expect(flights.length).toBeGreaterThan(36);
    expect(flights.length).toBeLessThanOrEqual(48);
    for (const f of flights) {
      expect(f.to === "self" || f.to !== f.from).toBe(true);
    }
  });
});

describe("사실 시트", () => {
  it.each(INPUTS)(
    "섹션마다 최대 개수 안에서 중복 없이 배정한다: $birthDate",
    (input) => {
      const { chart, dayun } = setup(input);
      const sheet = buildLifetimeFactSheet(chart, dayun, {
        birthYear: chart.lunarDate.year,
        currentYear: 2026,
      });
      const ids = Object.values(sheet.claims).flatMap((c) =>
        c.map((x) => x.id)
      );
      expect(new Set(ids).size).toBe(ids.length);
      for (const section of [
        "core",
        "wealth",
        "career",
        "relationship",
        "health",
      ] as const) {
        expect(sheet.claims[section].length).toBeGreaterThanOrEqual(1);
        expect(sheet.claims[section].length).toBeLessThanOrEqual(5);
      }
      expect(sheet.careerFields.length).toBeLessThanOrEqual(5);
    }
  );

  it("서로 다른 명반은 서로 다른 핵심 주장을 받는다", () => {
    const sheets = INPUTS.map((input) => {
      const { chart, dayun } = setup(input);
      return buildLifetimeFactSheet(chart, dayun, {
        birthYear: chart.lunarDate.year,
        currentYear: 2026,
      });
    });
    const keys = sheets.map((s) =>
      Object.values(s.claims)
        .flat()
        .map((c) => c.id)
        .join("|")
    );
    expect(new Set(keys).size).toBe(INPUTS.length);
  });
});

describe("타이밍", () => {
  it("후보 연도는 기준 연도 다음 해부터 10년 안, likely는 점수 양수만", () => {
    const { chart, dayun } = setup(INPUTS[0]);
    const timing = calculateTiming(chart, dayun, chart.lunarDate.year, 2026);
    expect(timing.map((t) => t.topic)).toEqual(["love", "career", "move"]);
    for (const entry of timing) {
      expect(entry.likely.length).toBeLessThanOrEqual(3);
      for (const y of [
        ...entry.likely,
        ...(entry.caution ? [entry.caution] : []),
      ]) {
        expect(y.year).toBeGreaterThanOrEqual(2027);
        expect(y.year).toBeLessThanOrEqual(2036);
        expect(y.reasons.length).toBeGreaterThan(0);
      }
      for (const y of entry.likely) expect(y.score).toBeGreaterThan(0);
      if (entry.caution) expect(entry.caution.score).toBeLessThan(0);
      const years = entry.likely.map((y) => y.year);
      expect([...years].sort()).toEqual(years);
    }
  });

  it("같은 입력이면 같은 결과 (결정적)", () => {
    const { chart, dayun } = setup(INPUTS[1]);
    expect(calculateTiming(chart, dayun, chart.lunarDate.year, 2026)).toEqual(
      calculateTiming(chart, dayun, chart.lunarDate.year, 2026)
    );
  });
});

describe("영역 근거 한 줄", () => {
  const pad = (n: number) => String(n).padStart(2, "0");
  // 회귀 세트와 같은 방식으로 명반 48개 + 쌍성이 질액궁에 앉는 실제 사례(2003-08-08 16:40 남)
  const charts = [
    {
      name: "pair-in-health",
      birthDate: "2003-08-08",
      birthTime: "16:40",
      gender: "male",
      calendarType: "solar",
    },
    ...Array.from({ length: 48 }, (_, i) => ({
      name: `qa-${pad(i)}`,
      birthDate: `${1966 + ((i * 7) % 39)}-${pad(1 + ((i * 5) % 12))}-${pad(1 + ((i * 11) % 28))}`,
      birthTime: `${pad((i * 5) % 24)}:${pad((i * 17) % 60)}`,
      gender: i % 2 === 0 ? "female" : "male",
      calendarType: "solar",
    })),
  ] as ZiweiInput[];

  const sheets = charts.map((input) => {
    const { chart, dayun } = setup(input);
    return buildLifetimeFactSheet(chart, dayun, {
      birthYear: chart.lunarDate.year,
      currentYear: 2026,
    });
  });

  it("쌍성·보충 주장은 영역 근거로 지정되지 않는다 (성격 설명이라 영역과 어긋남)", () => {
    for (const sheet of sheets) {
      for (const claim of Object.values(sheet.claims).flat()) {
        if (claim.id.startsWith("pair:") || claim.id.startsWith("base:")) {
          expect(claim.evidenceFor).toBeUndefined();
        }
      }
    }
  });

  it("재물·건강 근거는 그 영역으로 지정된 주장에서만 나온다", () => {
    for (const sheet of sheets) {
      for (const category of ["wealth", "health"] as const) {
        const evidence = sheet.evidence[category];
        if (!evidence) continue;
        expect(
          sheet.claims[category].some(
            (c) => c.evidenceFor === category && c.evidence === evidence
          )
        ).toBe(true);
      }
    }
  });

  it("쌍성이 건강 자리에 있어도 성격 문구를 건강 근거로 쓰지 않는다", () => {
    const [pairInHealth] = sheets;
    expect(
      pairInHealth.claims.health.some((c) => c.id.startsWith("pair:"))
    ).toBe(true);
    expect(pairInHealth.evidence.health?.ko).not.toBe(
      "날 선 승부욕이 강한 기운이에요"
    );
  });
});
