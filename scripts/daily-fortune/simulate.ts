/**
 * 오늘의 운세 엔진 시뮬레이션 · 캘리브레이션
 *
 * 실행 (저장소 루트에서):
 *   pnpm exec ts-node -r tsconfig-paths/register \
 *     -O '{"module":"commonjs","moduleResolution":"node"}' --transpile-only \
 *     scripts/daily-fortune/simulate.ts [옵션]
 *
 * 옵션:
 *   --charts N        무작위 명반 수 (기본 1000)
 *   --days N          시뮬레이션 일수 (기본 365)
 *   --start YYYY-MM-DD 시작일 (기본 2026-01-01)
 *   --unknown R       시간 미상 비율 (기본 0.2)
 *   --seed N          난수 시드 (기본 20261014)
 *   --strategy S      변형 선택 전략 slot | hash | cycle (기본 slot = 슬롯별 표
 *                     DAILY_SLOT_VARIANT_STRATEGY, hash/cycle은 전 슬롯 강제)
 *   --hx S            slot 모드에서 hx 슬롯 전략을 덮어쓴다 hash | cycle (비교용)
 *   --calibrate       분위 컷 후보만 출력하고 종료 (DAILY_LEVEL_CUTS 도출용)
 *
 * 제안 기준 (2단계): 한 줄·총운 간격 중앙값 30일 이상, 카테고리 본문 21일 이상,
 * 변수·주의·팁은 7일 내 재등장률만 관리, 라벨(kc/ki/kt)은 제외.
 * 이 스크립트는 Date.now/Math.random을 쓰지 않는다 (시드 고정 PRNG) — 같은 옵션이면 같은 리포트.
 */

import {
  DAILY_SLOT_VARIANT_STRATEGY,
  diagnoseDailyRange,
  prepareDailyFortune,
} from "@/libs/zi-wei-dou-shu/calculators/daily-fortune";
import type { DailyFortuneKeys } from "@/libs/zi-wei-dou-shu/calculators/daily-fortune-types";
import {
  DAILY_CATEGORIES,
  DAILY_LEVEL_CUTS,
  DAILY_SLOTS,
  getDailySlotOf,
  type DailyCategory,
  type DailySlotId,
  type DailyVariantStrategy,
} from "@/libs/zi-wei-dou-shu/constants/daily-fortune-table";
import { generateZiweiChart } from "@/libs/zi-wei-dou-shu/core";
import type { ZiweiChart } from "@/libs/zi-wei-dou-shu/types";

// ------------------------------------------------------------
// 인자
// ------------------------------------------------------------

const args = process.argv.slice(2);
const flag = (name: string): boolean => args.includes(`--${name}`);
const opt = (name: string, fallback: string): string => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const CHART_COUNT = Number(opt("charts", "1000"));
const DAY_COUNT = Number(opt("days", "365"));
const START_DATE = opt("start", "2026-01-01");
const UNKNOWN_RATIO = Number(opt("unknown", "0.2"));
const SEED = Number(opt("seed", "20261014"));
const STRATEGY = opt("strategy", "slot");
const HX_OVERRIDE = opt("hx", "");
if (HX_OVERRIDE) {
  DAILY_SLOT_VARIANT_STRATEGY.hx = HX_OVERRIDE as DailyVariantStrategy;
}
const CALIBRATE = flag("calibrate");

// ------------------------------------------------------------
// 시드 PRNG (mulberry32)
// ------------------------------------------------------------

const createRng = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const pad = (n: number): string => String(n).padStart(2, "0");

const shiftDate = (date: string, days: number): string => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

const buildCharts = (): { chart: ZiweiChart; estimated: boolean }[] => {
  const rng = createRng(SEED);
  return Array.from({ length: CHART_COUNT }, (_, i) => {
    const year = 1950 + Math.floor(rng() * 61);
    const month = 1 + Math.floor(rng() * 12);
    const day = 1 + Math.floor(rng() * 28);
    const estimated = rng() < UNKNOWN_RATIO;
    const birthTime = estimated
      ? "unknown"
      : `${pad(Math.floor(rng() * 24))}:${pad(Math.floor(rng() * 60))}`;
    const chart = generateZiweiChart({
      name: `sim-${i}`,
      birthDate: `${year}-${pad(month)}-${pad(day)}`,
      birthTime,
      gender: rng() < 0.5 ? "male" : "female",
      calendarType: "solar",
    });
    return { chart, estimated };
  });
};

const dates = Array.from({ length: DAY_COUNT }, (_, i) =>
  shiftDate(START_DATE, i)
);

// ------------------------------------------------------------
// 통계 유틸
// ------------------------------------------------------------

const quantile = (sorted: number[], q: number): number => {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
};

const median = (values: number[]): number =>
  quantile(
    [...values].sort((a, b) => a - b),
    0.5
  );

const pct = (value: number, digits = 1): string =>
  `${(value * 100).toFixed(digits)}%`;

const round = (value: number, digits = 2): number => {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
};

// ------------------------------------------------------------
// 캘리브레이션
// ------------------------------------------------------------

const runCalibrate = (): void => {
  const people = buildCharts();
  const exact: Record<DailyCategory, number[]> = {
    overall: [],
    love: [],
    money: [],
    work: [],
    health: [],
  };
  const est: Record<DailyCategory, number[]> = {
    overall: [],
    love: [],
    money: [],
    work: [],
    health: [],
  };
  const structExact: number[] = [];
  const structEst: number[] = [];
  people.forEach(({ chart, estimated }) => {
    diagnoseDailyRange(chart, dates).forEach((d) => {
      DAILY_CATEGORIES.forEach((c) => {
        (estimated ? est : exact)[c].push(d.points[c]);
        (estimated ? structEst : structExact).push(d.structure[c]);
      });
    });
  });
  const qs = [0.1, 0.35, 0.65, 0.9];
  const fmt = (arr: number[]): string => {
    const s = [...arr].sort((a, b) => a - b);
    return `[${qs.map((q) => round(quantile(s, q))).join(", ")}]`;
  };
  console.log("== 분위 컷 후보 (10/35/65/90 분위) ==");
  DAILY_CATEGORIES.forEach((c) => {
    console.log(
      `${c.padEnd(8)} exact=${fmt(exact[c])}  estimated(수축 후)=${fmt(est[c])}`
    );
  });
  const sdv = (arr: number[]): number => {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length);
  };
  console.log("\n== 모집단 중심(확정 점수 중앙값, DAILY_POINT_CENTER) ==");
  DAILY_CATEGORIES.forEach((c) => {
    const sorted = [...exact[c]].sort((a, b) => a - b);
    console.log(`${c.padEnd(8)} ${round(quantile(sorted, 0.5), 3)}`);
  });
  console.log(
    `\n점수 표준편차 exact=${round(sdv(exact.overall))} estimated=${round(sdv(est.overall))}`
  );
  const q33 = (arr: number[]): string => {
    const s = [...arr].sort((a, b) => a - b);
    return `[${round(quantile(s, 1 / 3))}, ${round(quantile(s, 2 / 3))}]`;
  };
  console.log(`\n== 삼방 구조 점수 3분위 컷 ==`);
  console.log(`exact=${q33(structExact)} estimated=${q33(structEst)}`);
};

// ------------------------------------------------------------
// 리포트
// ------------------------------------------------------------

interface Person {
  estimated: boolean;
  results: DailyFortuneKeys[];
}

const SLOT_ORDER: DailySlotId[] = [
  "hl",
  "hx",
  "ob",
  "cb",
  "vr",
  "ca",
  "tp",
  "kc",
  "ki",
  "kt",
  "kr",
];

/** 한 결과가 내보내는 (슬롯, 슬러그) 목록 */
const emittedSlugs = (r: DailyFortuneKeys): string[] => {
  const out: string[] = [
    r.headline,
    r.categories.overall.slug,
    r.categories.love.slug,
    r.categories.money.slug,
    r.categories.work.slug,
    r.categories.health.slug,
    r.caution.slug,
    r.tip,
    r.keywords.color,
    r.keywords.item,
    r.keywords.timeSlot,
    r.keywords.reason,
  ];
  if (r.variable) out.push(r.variable);
  return out;
};

const runReport = (): void => {
  const t0 = process.hrtime.bigint();
  const charts = buildCharts();
  const generate = ({
    chart,
    estimated,
  }: {
    chart: ZiweiChart;
    estimated: boolean;
  }): Person => {
    const fn = prepareDailyFortune(chart, {
      variantStrategy:
        STRATEGY === "slot" ? undefined : (STRATEGY as DailyVariantStrategy),
    });
    return { estimated, results: dates.map((d) => fn(d)) };
  };
  const people = charts.map(generate);
  const elapsed = Number(process.hrtime.bigint() - t0) / 1e9;

  const exactCount = people.filter((p) => !p.estimated).length;
  console.log(
    `# 시뮬레이션: 명반 ${people.length}개 (시간 미상 ${people.length - exactCount}, ${pct((people.length - exactCount) / people.length)}) × ${DAY_COUNT}일, ${START_DATE}~, 전략=${STRATEGY}${STRATEGY === "slot" ? JSON.stringify(DAILY_SLOT_VARIANT_STRATEGY) : ""}, seed=${SEED}, ${round(elapsed, 1)}s`
  );

  // 1. 카테고리별 level 분포
  console.log("\n## 1. 카테고리별 level 분포 (L1..L5)");
  const dist = (group: Person[], c: DailyCategory): number[] => {
    const counts = [0, 0, 0, 0, 0];
    group.forEach((p) =>
      p.results.forEach((r) => {
        counts[r.categories[c].level - 1] += 1;
      })
    );
    const total = counts.reduce((a, b) => a + b, 0);
    return counts.map((n) => n / total);
  };
  const exactPeople = people.filter((p) => !p.estimated);
  const estPeople = people.filter((p) => p.estimated);
  const catOf = (c: DailyCategory) => c;
  [
    ["전체", people],
    ["확정", exactPeople],
    ["미상", estPeople],
  ].forEach(([label, group]) => {
    console.log(`- ${label as string}`);
    DAILY_CATEGORIES.forEach((c) => {
      console.log(
        `  ${catOf(c).padEnd(8)} ${dist(group as Person[], c)
          .map((v) => pct(v).padStart(6))
          .join(" ")}`
      );
    });
  });

  // 2. 극단 완화: 원 등급 대비 완화 적용 건수는 엔진 내부 → 결과 기준 연속 길이
  console.log("\n## 2. 극단 등급 연속 길이 (완화 후 결과 기준, 카테고리 합산)");
  const runLengths = new Map<number, number>();
  people.forEach((p) =>
    DAILY_CATEGORIES.forEach((c) => {
      let streak = 0;
      let last = 0;
      p.results.forEach((r) => {
        const { level } = r.categories[c];
        const extreme = level === 1 || level === 5;
        if (extreme && level === last) streak += 1;
        else streak = extreme ? 1 : 0;
        last = extreme ? level : 0;
        if (streak > 0) {
          runLengths.set(streak, (runLengths.get(streak) ?? 0) + 1);
        }
      });
    })
  );
  console.log(
    `  연속 1일째 ${runLengths.get(1) ?? 0}건 / 2일째 ${runLengths.get(2) ?? 0}건 / 3일째 ${runLengths.get(3) ?? 0}건 (0이어야 정상: 3일째는 완화됨) / 4일째+ ${[...runLengths.entries()].filter(([k]) => k >= 4).reduce((a, [, v]) => a + v, 0)}건`
  );

  // 3. 재등장 간격
  console.log(
    "\n## 3. 슬롯별 동일 슬러그 재등장 간격 (사람별, 같은 슬러그의 연속 등장 사이 일수)"
  );
  console.log(
    "slot | kind | 슬러그수 | 사람당 고유 | 간격 중앙값 | 7일내 재등장률 | 30일내 재등장률 | 판정"
  );
  const intervalsBySlot = new Map<DailySlotId, number[]>();
  const uniqueBySlot = new Map<DailySlotId, number[]>();
  const intervalsBySlotGroup = new Map<string, number[]>();
  people.forEach((p) => {
    const lastSeen = new Map<string, number>();
    const uniq = new Map<DailySlotId, Set<string>>();
    p.results.forEach((r, dayIdx) => {
      emittedSlugs(r).forEach((slug) => {
        const slot = getDailySlotOf(slug);
        if (!slot) throw new Error(`카탈로그 밖 슬러그: ${slug}`);
        (uniq.get(slot) ?? uniq.set(slot, new Set()).get(slot)!).add(slug);
        const prev = lastSeen.get(slug);
        if (prev !== undefined) {
          const gap = dayIdx - prev;
          (
            intervalsBySlot.get(slot) ??
            intervalsBySlot.set(slot, []).get(slot)!
          ).push(gap);
          const key = `${slot}:${p.estimated ? "est" : "exact"}`;
          (
            intervalsBySlotGroup.get(key) ??
            intervalsBySlotGroup.set(key, []).get(key)!
          ).push(gap);
        }
        lastSeen.set(slug, dayIdx);
      });
    });
    uniq.forEach((set, slot) => {
      (uniqueBySlot.get(slot) ?? uniqueBySlot.set(slot, []).get(slot)!).push(
        set.size
      );
    });
  });
  const KIND: Record<DailySlotId, string> = {
    hl: "문장",
    hx: "문장",
    ob: "문장",
    cb: "문장",
    vr: "문장",
    ca: "문장",
    tp: "문장",
    kc: "라벨",
    ki: "라벨",
    kt: "라벨",
    kr: "문장",
  };
  /** 제안 기준(2단계)에 따른 판정 */
  const judge = (slot: DailySlotId, med: number, in7: number): string => {
    if (slot === "hl" || slot === "hx" || slot === "ob") {
      return med >= 30 ? "PASS(>=30)" : "FAIL(>=30)";
    }
    if (slot === "cb") return med >= 21 ? "PASS(>=21)" : "FAIL(>=21)";
    if (slot === "vr" || slot === "ca" || slot === "tp") {
      return `7일내 ${pct(in7)} (관리)`;
    }
    if (slot === "kr") return "기준 없음";
    return "제외(라벨)";
  };
  const SLUG_COUNT = {} as Record<DailySlotId, number>;
  SLOT_ORDER.forEach((s) => {
    SLUG_COUNT[s] = DAILY_SLOTS[s].slugs.length;
  });
  SLOT_ORDER.forEach((slot) => {
    const gaps = intervalsBySlot.get(slot) ?? [];
    const uniq = uniqueBySlot.get(slot) ?? [];
    if (gaps.length === 0) {
      console.log(
        `${slot} | ${KIND[slot]} | ${SLUG_COUNT[slot]} | - | 재등장 없음 | - | - | -`
      );
      return;
    }
    const med = median(gaps);
    const within = (n: number): number =>
      gaps.filter((g) => g <= n).length / gaps.length;
    const verdict = judge(slot, med, within(7));
    console.log(
      `${slot} | ${KIND[slot]} | ${SLUG_COUNT[slot]} | ${round(uniq.reduce((a, b) => a + b, 0) / uniq.length, 1)} | ${med}일 | ${pct(within(7))} | ${pct(within(30))} | ${verdict}`
    );
  });
  console.log("\n  (확정 vs 미상 분리, 간격 중앙값)");
  SLOT_ORDER.forEach((slot) => {
    const e = intervalsBySlotGroup.get(`${slot}:exact`);
    const u = intervalsBySlotGroup.get(`${slot}:est`);
    console.log(
      `  ${slot}: 확정 ${e ? `${median(e)}일(7일내 ${pct(e.filter((g) => g <= 7).length / e.length)})` : "-"} / 미상 ${u ? `${median(u)}일(7일내 ${pct(u.filter((g) => g <= 7).length / u.length)})` : "-"}`
    );
  });

  // 4. 같은 날 두 사람 동일 문구 비율
  console.log("\n## 4. 같은 날 두 사람 동일 슬러그 비율 (무작위 쌍 샘플)");
  const rng = createRng(SEED + 1);
  const PAIRS_PER_DAY = 400;
  const pairHit = new Map<string, { hit: number; total: number }>();
  const addPair = (key: string, same: boolean): void => {
    const cur = pairHit.get(key) ?? { hit: 0, total: 0 };
    cur.total += 1;
    if (same) cur.hit += 1;
    pairHit.set(key, cur);
  };
  for (let d = 0; d < DAY_COUNT; d += 1) {
    for (let k = 0; k < PAIRS_PER_DAY; k += 1) {
      const a = people[Math.floor(rng() * people.length)];
      const b = people[Math.floor(rng() * people.length)];
      if (a === b) continue;
      const ra = a.results[d];
      const rb = b.results[d];
      if (!a.estimated && !b.estimated) {
        addPair("hl (확정-확정)", ra.headline === rb.headline);
        addPair(
          "hl 별+밝기군 (변형 무시)",
          ra.headline.slice(0, -3) === rb.headline.slice(0, -3)
        );
      }
      if (a.estimated && b.estimated) {
        addPair("hx (미상-미상)", ra.headline === rb.headline);
      }
      if (!a.estimated && !b.estimated) {
        addPair(
          "ob (확정-확정)",
          ra.categories.overall.slug === rb.categories.overall.slug
        );
        (["love", "money", "work", "health"] as const).forEach((c) =>
          addPair(
            `cb-${c} (확정-확정)`,
            ra.categories[c].slug === rb.categories[c].slug
          )
        );
      }
      addPair("ob", ra.categories.overall.slug === rb.categories.overall.slug);
      (["love", "money", "work", "health"] as const).forEach((c) =>
        addPair(`cb-${c}`, ra.categories[c].slug === rb.categories[c].slug)
      );
      addPair("tp", ra.tip === rb.tip);
      addPair("kr", ra.keywords.reason === rb.keywords.reason);
      addPair("ca", ra.caution.slug === rb.caution.slug);
      addPair(
        "ob+cb 전부 (한 화면 본문 5개 모두 동일)",
        [
          ra.categories.overall.slug,
          ra.categories.love.slug,
          ra.categories.money.slug,
          ra.categories.work.slug,
          ra.categories.health.slug,
        ].join() ===
          [
            rb.categories.overall.slug,
            rb.categories.love.slug,
            rb.categories.money.slug,
            rb.categories.work.slug,
            rb.categories.health.slug,
          ].join()
      );
    }
  }
  [...pairHit.entries()].forEach(([key, { hit, total }]) => {
    console.log(`  ${key.padEnd(34)} ${pct(hit / total, 2)}  (n=${total})`);
  });

  // 5. 성향군/별 편중
  console.log("\n## 5. 성향군(ob) 분포: 확정 vs 미상");
  const groupCount = (group: Person[]): Map<string, number> => {
    const m = new Map<string, number>();
    group.forEach((p) =>
      p.results.forEach((r) => {
        const [, , , g] = r.categories.overall.slug.split("-");
        m.set(g, (m.get(g) ?? 0) + 1);
      })
    );
    return m;
  };
  const ge = groupCount(exactPeople);
  const gu = groupCount(estPeople);
  const te = [...ge.values()].reduce((a, b) => a + b, 0);
  const tu = [...gu.values()].reduce((a, b) => a + b, 0);
  ["lead", "think", "warm", "drive", "ease", "charm", "shift"].forEach((g) => {
    console.log(
      `  ${g.padEnd(6)} 확정 ${pct((ge.get(g) ?? 0) / te)}  미상 ${pct((gu.get(g) ?? 0) / tu)}`
    );
  });
  const hxKinds = new Map<string, number>();
  estPeople.forEach((p) =>
    p.results.forEach((r) => {
      const [, , , k] = r.headline.split("-");
      hxKinds.set(k, (hxKinds.get(k) ?? 0) + 1);
    })
  );
  console.log(
    `  hx 사화 종류(미상): ${[...hxKinds.entries()].map(([k, v]) => `${k} ${pct(v / tu)}`).join(", ")}`
  );

  // 6. 기타: 변수 문장·주의 포인트·시간 미상 레벨 평균
  console.log("\n## 6. 기타");
  const all = people.flatMap((p) =>
    p.results.map((r) => ({ r, e: p.estimated }))
  );
  const varRate = (e: boolean): number => {
    const sub = all.filter((x) => x.e === e);
    return sub.filter((x) => x.r.variable !== null).length / sub.length;
  };
  console.log(
    `  variable 노출률: 확정 ${pct(varRate(false))} / 미상 ${pct(varRate(true))}`
  );
  const cautionDist = new Map<string, number>();
  all.forEach(({ r }) =>
    cautionDist.set(
      r.caution.category,
      (cautionDist.get(r.caution.category) ?? 0) + 1
    )
  );
  console.log(
    `  caution 카테고리: ${[...cautionDist.entries()].map(([k, v]) => `${k} ${pct(v / all.length)}`).join(", ")}`
  );
  const lowest = (r: DailyFortuneKeys): number =>
    Math.min(...DAILY_CATEGORIES.map((c) => r.categories[c].level));
  const lowDist = [0, 0, 0, 0, 0];
  all.forEach(({ r }) => (lowDist[lowest(r) - 1] += 1));
  console.log(
    `  하루 중 최저 level 분포(L1..L5): ${lowDist.map((v) => pct(v / all.length)).join(" ")}`
  );
  // hl 밝기군 vs 총운 level 정렬 위반 (확정만)
  const hlTotal = { n: 0, brightLow: 0, darkHigh: 0 };
  const hlGroup = { bright: 0, neutral: 0, dark: 0 };
  all.forEach(({ r, e }) => {
    if (e) return;
    const g = /-(bright|neutral|dark)-v\d$/.exec(r.headline)?.[1] as
      | "bright"
      | "neutral"
      | "dark";
    const lv = r.categories.overall.level;
    hlTotal.n += 1;
    hlGroup[g] += 1;
    if (g === "bright" && lv <= 2) hlTotal.brightLow += 1;
    if (g === "dark" && lv >= 4) hlTotal.darkHigh += 1;
  });
  console.log(
    `  hl 정렬 위반(확정): bright+총운<=2 ${pct(hlTotal.brightLow / hlTotal.n, 2)} / dark+총운>=4 ${pct(hlTotal.darkHigh / hlTotal.n, 2)} (목표 0%) | 밝기군 분포 bright ${pct(hlGroup.bright / hlTotal.n)} neutral ${pct(hlGroup.neutral / hlTotal.n)} dark ${pct(hlGroup.dark / hlTotal.n)}`
  );
  const healthCaution = all.filter((x) => x.r.caution.category === "health");
  console.log(
    `  건강 주의 포인트 비율 ${pct(healthCaution.length / all.length)} (건강이 level<=2인 날 중 ${pct(healthCaution.length / Math.max(1, all.filter((x) => x.r.categories.health.level <= 2).length))})`
  );
  const distinctHeadlines = people.map(
    (p) => new Set(p.results.map((r) => r.headline)).size
  );
  console.log(
    `  사람당 연간 고유 headline 수 평균 ${round(distinctHeadlines.reduce((a, b) => a + b, 0) / people.length, 1)}`
  );

  void DAILY_LEVEL_CUTS;
};

if (CALIBRATE) runCalibrate();
else runReport();
