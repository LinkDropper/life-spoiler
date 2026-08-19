import { readFileSync } from "fs";
import { join } from "path";

import {
  calculateOwnerOneLiner,
  type OwnerOneLinerPerson,
} from "../calculators/owner-one-liner";
import {
  BRANCH_TO_OWNER_ANIMAL,
  OWNER_ONE_LINER_MATRIX_VERSION,
  OWNER_ONE_LINERS,
  OWNER_ELEMENT_OPENING,
  OWNER_PACE_OPENING,
  OWNER_STAR_CLOSING,
  OWNER_ZODIAC_CLOSING,
  STEM_TO_OWNER_ELEMENT_VARIANT,
  buildOwnerOneLinerId,
  buildOwnerYearOneLinerId,
  derivePaceKey,
  isYangBranch,
  type OwnerPaceKey,
  type OwnerYearElementVariant,
} from "../constants/owner-one-liner-table";
import type { BrightnessGroup } from "../constants/star-traits";
import { MAIN_STAR_NAMES } from "../constants/stars";
import { generateZiweiChart } from "../core";
import type {
  BranchIndex,
  CalendarType,
  StemIndex,
  TimeBranchValue,
} from "../types";

// ============================================================
// 표본 생성
// ============================================================

const TIMES: TimeBranchValue[] = [
  "자",
  "축",
  "인",
  "묘",
  "진",
  "사",
  "오",
  "미",
  "신",
  "유",
  "술",
  "해",
];

const pad = (n: number): string => String(n).padStart(2, "0");

/**
 * 12지지(띠) 전부 + 10천간 전부 + 12시진을 고르게 덮는 결정론적 표본 48명.
 * `friend-compatibility.test.ts`의 표본 생성 방식과 동일한 소수 배수 분산 기법.
 */
const buildSamples = (): OwnerOneLinerPerson[] => {
  const samples: OwnerOneLinerPerson[] = [];

  for (let year = 1972; year <= 1995; year++) {
    samples.push({
      birthDate: `${year}-${pad(((year * 7) % 12) + 1)}-${pad(((year * 13) % 27) + 1)}`,
      birthTime: TIMES[(year * 5) % 12],
      calendarType: "solar" as CalendarType,
      gender: year % 2 === 0 ? "male" : "female",
    });
    samples.push({
      birthDate: `${year}-${pad(((year * 3) % 12) + 1)}-${pad(((year * 19) % 27) + 1)}`,
      birthTime: TIMES[(year * 11) % 12],
      calendarType: "solar" as CalendarType,
      gender: year % 2 === 0 ? "female" : "male",
    });
  }

  return samples;
};

const SAMPLES = buildSamples();

const withUnknownTime = (person: OwnerOneLinerPerson): OwnerOneLinerPerson => ({
  ...person,
  birthTime: "unknown",
});

const readCodeWithoutComments = (relativePath: string): string =>
  readFileSync(join(__dirname, "..", relativePath), "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

// ============================================================
// 1. 결정론
// ============================================================

describe("owner 한줄평 — 결정론", () => {
  it("동일 입력이면 항상 동일한 결과를 돌려준다", () => {
    const [person] = SAMPLES;
    const first = calculateOwnerOneLiner(person);
    const second = calculateOwnerOneLiner(person);
    const third = calculateOwnerOneLiner(person);

    expect(second).toEqual(first);
    expect(third).toEqual(first);
  });

  it("전 표본에서 두 번 호출한 결과가 동일하다 (exact 경로)", () => {
    for (const person of SAMPLES) {
      expect(calculateOwnerOneLiner(person)).toEqual(
        calculateOwnerOneLiner(person)
      );
    }
  });

  it("전 표본에서 두 번 호출한 결과가 동일하다 (시간 미상 경로)", () => {
    for (const person of SAMPLES.slice(0, 16)) {
      const unknown = withUnknownTime(person);
      expect(calculateOwnerOneLiner(unknown)).toEqual(
        calculateOwnerOneLiner(unknown)
      );
    }
  });

  it("소스에 Math.random / Date.now / new Date 가 없다", () => {
    const sources = [
      "calculators/owner-one-liner.ts",
      "constants/owner-one-liner-table.ts",
    ].map(readCodeWithoutComments);

    for (const source of sources) {
      expect(source).not.toMatch(/Math\.random/);
      expect(source).not.toMatch(/Date\.now/);
      expect(source).not.toMatch(/new Date\(/);
    }
  });
});

// ============================================================
// 2. LLM / 날짜 비의존 보장
// ============================================================

describe("owner 한줄평 — 금지 의존성", () => {
  const source = readCodeWithoutComments("calculators/owner-one-liner.ts");

  it("AI 서비스 모듈을 import하지 않는다", () => {
    expect(source).not.toMatch(/services\/ai/);
    expect(source).not.toMatch(/compatibility-interpreter/);
    expect(source).not.toMatch(/ziwei-interpreter/);
  });

  it("조회 시점(오늘 날짜)에 의존하지 않는다 — 같은 명반 입력은 언제 호출해도 같다", () => {
    const [person] = SAMPLES.slice(3);
    const realDateNow = Date.now;

    try {
      const t1 = calculateOwnerOneLiner(person);

      // Date.now를 임의 시점으로 흔들어도 결과가 바뀌지 않아야 한다.
      Date.now = () => new Date("2030-01-01").getTime();
      const t2 = calculateOwnerOneLiner(person);

      Date.now = () => new Date("1999-01-01").getTime();
      const t3 = calculateOwnerOneLiner(person);

      expect(t2).toEqual(t1);
      expect(t3).toEqual(t1);
    } finally {
      Date.now = realDateNow;
    }
  });
});

// ============================================================
// 3. 성별 무관
// ============================================================

describe("owner 한줄평 — 성별 무관", () => {
  it("gender만 바꾸면(male↔female) 나머지 입력이 같을 때 결과가 동일하다", () => {
    for (const person of SAMPLES.slice(0, 24)) {
      const male = calculateOwnerOneLiner({ ...person, gender: "male" });
      const female = calculateOwnerOneLiner({ ...person, gender: "female" });

      expect(female).toEqual(male);
    }
  });

  it("시간 미상 경로도 gender와 무관하다", () => {
    for (const person of SAMPLES.slice(0, 12)) {
      const unknown = withUnknownTime(person);
      const male = calculateOwnerOneLiner({ ...unknown, gender: "male" });
      const female = calculateOwnerOneLiner({ ...unknown, gender: "female" });

      expect(female).toEqual(male);
    }
  });
});

// ============================================================
// 4. 시간 미상 폴백
// ============================================================

describe("owner 한줄평 — 시간 미상 폴백", () => {
  it("시간 미상이면 confidence가 estimated이고 슬러그가 oo-year- 로 시작한다", () => {
    for (const person of SAMPLES.slice(0, 16)) {
      const result = calculateOwnerOneLiner(withUnknownTime(person));

      expect(result.confidence).toBe("estimated");
      expect(result.oneLinerId.startsWith("oo-year-")).toBe(true);
    }
  });

  it("시간 확정이면 confidence가 exact이고 슬러그가 oo-year-로 시작하지 않는다", () => {
    for (const person of SAMPLES.slice(0, 16)) {
      const result = calculateOwnerOneLiner(person);

      expect(result.confidence).toBe("exact");
      expect(result.oneLinerId.startsWith("oo-year-")).toBe(false);
    }
  });

  it("시간 미상 슬러그는 연간(年干)·연지(年支)에서만 나온다", () => {
    const [person] = SAMPLES.slice(5);
    const chart = generateZiweiChart({
      name: "t",
      birthDate: person.birthDate,
      birthTime: "12:00",
      gender: person.gender,
      calendarType: person.calendarType,
    });

    const expectedId = buildOwnerYearOneLinerId(
      STEM_TO_OWNER_ELEMENT_VARIANT[chart.lunarDate.yearStem],
      BRANCH_TO_OWNER_ANIMAL[chart.lunarDate.yearBranch]
    );

    const result = calculateOwnerOneLiner(withUnknownTime(person));
    expect(result.oneLinerId).toBe(expectedId);
  });

  it("대표 시각을 무엇으로 잡아도(00:00~23:00) 연간·연지는 변하지 않는다 — 임의의 시진을 정답으로 고르지 않는다는 설계를 코드로 증명", () => {
    const [person] = SAMPLES.slice(9);

    const morning = generateZiweiChart({
      name: "t",
      birthDate: person.birthDate,
      birthTime: "00:30",
      gender: person.gender,
      calendarType: person.calendarType,
    });
    const night = generateZiweiChart({
      name: "t",
      birthDate: person.birthDate,
      birthTime: "23:30",
      gender: person.gender,
      calendarType: person.calendarType,
    });

    expect(night.lunarDate.yearStem).toBe(morning.lunarDate.yearStem);
    expect(night.lunarDate.yearBranch).toBe(morning.lunarDate.yearBranch);

    const expectedId = buildOwnerYearOneLinerId(
      STEM_TO_OWNER_ELEMENT_VARIANT[morning.lunarDate.yearStem],
      BRANCH_TO_OWNER_ANIMAL[morning.lunarDate.yearBranch]
    );

    expect(calculateOwnerOneLiner(withUnknownTime(person)).oneLinerId).toBe(
      expectedId
    );
  });

  it("연간(年干) 음양과 연지(年支) 음양은 항상 일치한다 — 60갑자 구조를 코드로 확인", () => {
    for (const person of SAMPLES) {
      const chart = generateZiweiChart({
        name: "t",
        birthDate: person.birthDate,
        birthTime: "12:00",
        gender: person.gender,
        calendarType: person.calendarType,
      });

      const stemIsYang = chart.lunarDate.yearStem % 2 === 0;
      expect(isYangBranch(chart.lunarDate.yearBranch)).toBe(stemIsYang);
    }
  });
});

// ============================================================
// 5. 고아 슬러그 0건 / 테이블 완전성
// ============================================================

describe("owner 한줄평 — 테이블 완전성", () => {
  it("exact 경로 252가지(14별 × 3밝기군 × 6페이스키) 슬러그가 전부 테이블에 있다 (full cartesian)", () => {
    const brightnessGroups: BrightnessGroup[] = ["bright", "neutral", "dark"];
    const paces = Object.keys(OWNER_PACE_OPENING) as OwnerPaceKey[];

    let count = 0;
    for (const star of MAIN_STAR_NAMES) {
      for (const brightness of brightnessGroups) {
        for (const pace of paces) {
          const id = buildOwnerOneLinerId(star, brightness, pace);
          expect(OWNER_ONE_LINERS[id]).toBeDefined();
          count += 1;
        }
      }
    }

    expect(paces).toHaveLength(6);
    expect(count).toBe(14 * 3 * 6);
  });

  it("fallback 경로 60가지(60갑자 유효 조합만) 슬러그가 전부 테이블에 있다", () => {
    const animals = Object.keys(OWNER_ZODIAC_CLOSING) as Array<
      keyof typeof OWNER_ZODIAC_CLOSING
    >;
    const elementVariants = Object.keys(
      OWNER_ELEMENT_OPENING
    ) as OwnerYearElementVariant[];

    expect(elementVariants).toHaveLength(10);

    let count = 0;
    for (let stem = 0; stem < 10; stem++) {
      const elementVariant = STEM_TO_OWNER_ELEMENT_VARIANT[stem as StemIndex];
      const stemIsYang = stem % 2 === 0;

      for (let branch = 0; branch < 12; branch++) {
        const branchIndex = branch as BranchIndex;
        if (isYangBranch(branchIndex) !== stemIsYang) continue;

        const animal = BRANCH_TO_OWNER_ANIMAL[branchIndex];
        const id = buildOwnerYearOneLinerId(elementVariant, animal);
        expect(OWNER_ONE_LINERS[id]).toBeDefined();
        count += 1;
      }
    }

    expect(count).toBe(60);
    // 참고용: animals 배열은 12띠가 전부 정의돼 있는지 다른 테스트에서 검증한다.
    expect(animals).toHaveLength(12);
  });

  it("테이블 총 개수는 312(exact 252 + fallback 60)이고 고아 슬러그가 없다", () => {
    expect(Object.keys(OWNER_ONE_LINERS)).toHaveLength(312);

    for (const [id, entry] of Object.entries(OWNER_ONE_LINERS)) {
      expect(entry.id).toBe(id);
      expect(entry.ko.length).toBeGreaterThan(0);
    }
  });

  it("실제 계산 결과가 만들어내는 모든 슬러그는 테이블에 존재한다", () => {
    for (const person of SAMPLES) {
      const result = calculateOwnerOneLiner(person);
      expect(OWNER_ONE_LINERS[result.oneLinerId]).toBeDefined();
      expect(result.oneLinerKo).toBe(OWNER_ONE_LINERS[result.oneLinerId].ko);
    }

    for (const person of SAMPLES.slice(0, 16)) {
      const result = calculateOwnerOneLiner(withUnknownTime(person));
      expect(OWNER_ONE_LINERS[result.oneLinerId]).toBeDefined();
      expect(result.oneLinerKo).toBe(OWNER_ONE_LINERS[result.oneLinerId].ko);
    }
  });

  it("matrixVersion은 항상 상수값과 같다", () => {
    for (const person of SAMPLES.slice(0, 10)) {
      expect(calculateOwnerOneLiner(person).matrixVersion).toBe(
        OWNER_ONE_LINER_MATRIX_VERSION
      );
    }
  });
});

// ============================================================
// 6. 브랜드 보이스 / 문구 품질
// ============================================================

describe("owner 한줄평 — 문구 품질", () => {
  const allLiners = Object.values(OWNER_ONE_LINERS);

  it("모든 문구가 45자 이내다", () => {
    for (const { id, ko } of allLiners) {
      expect(ko.length).toBeLessThanOrEqual(45);
      if (ko.length > 45) {
        console.error(`${id}: ${ko.length}자 — ${ko}`);
      }
    }
  });

  it("모든 문구가 존댓말(~요/~습니다)로 끝난다", () => {
    for (const { ko } of allLiners) {
      expect(/(요|니다)\.$/.test(ko)).toBe(true);
    }
  });

  it("금지 표현을 포함하지 않는다", () => {
    const banned = [
      "뼈 때리는",
      "소름 돋는",
      "충격적인",
      "대박",
      "인생역전",
      "운명을 바꿔라",
      "럭키 컬러",
      "99% 적중",
      "충격!",
      "!!",
      "??",
    ];

    for (const { ko } of allLiners) {
      for (const term of banned) {
        expect(ko).not.toContain(term);
      }
    }
  });

  it("자미두수 전문 용어를 표면 문구에 쓰지 않는다", () => {
    const jargon = [
      "명궁",
      "신궁",
      "오행국",
      "화록",
      "화권",
      "화과",
      "화기",
      "대운",
      "삼합",
      "육합",
      "사화",
      "묘궁",
      "천간",
      "십이지지",
      ...MAIN_STAR_NAMES,
    ];

    for (const { ko } of allLiners) {
      for (const term of jargon) {
        expect(ko).not.toContain(term);
      }
    }
  });

  it("생시를 역산할 수 있는 시각 표현을 쓰지 않는다", () => {
    const timeOfDayWords = [
      "새벽",
      "한밤중",
      "밤에",
      "아침에",
      "낮에",
      "자정",
      "정오",
      "오전",
      "오후",
    ];

    for (const { ko } of allLiners) {
      for (const word of timeOfDayWords) {
        expect(ko).not.toContain(word);
      }
    }
  });

  it("이모지를 쓰지 않는다", () => {
    const emojiPattern = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    for (const { ko } of allLiners) {
      expect(emojiPattern.test(ko)).toBe(false);
    }
  });

  it("312개 문구가 전부 유일하다 (완전 중복 없음)", () => {
    const texts = allLiners.map((l) => l.ko);
    expect(new Set(texts).size).toBe(texts.length);
  });

  /**
   * 화면 1곳에 1개만 노출되지만, 여러 owner의 스크린샷이 나란히 놓였을 때
   * 같은 종결 형태가 반복되면 템플릿 티가 난다 (CTO 지시 — 종결 어미 분포 집계).
   * `friend-compatibility.test.ts`와 동일한 방식으로 최빈 종결 2음절을 집계한다.
   */
  const grammarEnding = (ko: string): string =>
    ko.replace(/[.!?]+$/, "").slice(-2);

  const MAX_ENDING_SHARE = 0.2;
  const MIN_ENDING_VARIETY = 10;

  it("종결 어미가 한쪽으로 쏠리지 않는다 (최빈 형태 20% 미만, 10종 이상)", () => {
    const counts = new Map<string, number>();
    for (const { ko } of allLiners) {
      const ending = grammarEnding(ko);
      counts.set(ending, (counts.get(ending) ?? 0) + 1);
    }

    expect(counts.size).toBeGreaterThanOrEqual(MIN_ENDING_VARIETY);
    expect(Math.max(...counts.values()) / allLiners.length).toBeLessThan(
      MAX_ENDING_SHARE
    );
  });

  /**
   * CPO 재검수(수정 2): 도입절이 3종뿐이면 126개 중 첫 구절이 3갈래로만 갈려
   * 스크린샷을 나란히 두면 첫 구절이 반복된다는 지적. exact는 6종, fallback은
   * 오행 5종 각각 음양 2종씩 10종으로 늘렸다 — 분포도 균등해야 한다(치우침 없음).
   */
  it("exact 도입절은 6종이고 252개에 균등 분포한다", () => {
    const paces = Object.keys(OWNER_PACE_OPENING) as OwnerPaceKey[];
    expect(paces).toHaveLength(6);

    const counts = new Map<string, number>();
    for (const [id, { ko }] of Object.entries(OWNER_ONE_LINERS)) {
      if (id.startsWith("oo-year-")) continue;
      const opening = paces.find((p) => ko.startsWith(OWNER_PACE_OPENING[p]));
      expect(opening).toBeDefined();
      counts.set(opening as string, (counts.get(opening as string) ?? 0) + 1);
    }

    expect(counts.size).toBe(6);
    for (const count of counts.values()) {
      expect(count).toBe(14 * 3); // 42 — 별 14 × 밝기군 3, 페이스마다 균등
    }
  });

  it("fallback 도입절은 오행별 2종(음양)씩 총 10종이고 각 6개 띠에 대응한다", () => {
    const variants = Object.keys(
      OWNER_ELEMENT_OPENING
    ) as OwnerYearElementVariant[];
    expect(variants).toHaveLength(10);

    const counts = new Map<string, number>();
    for (const [id, { ko }] of Object.entries(OWNER_ONE_LINERS)) {
      if (!id.startsWith("oo-year-")) continue;
      const opening = variants.find((v) =>
        ko.startsWith(OWNER_ELEMENT_OPENING[v])
      );
      expect(opening).toBeDefined();
      counts.set(opening as string, (counts.get(opening as string) ?? 0) + 1);
    }

    expect(counts.size).toBe(10);
    for (const count of counts.values()) {
      expect(count).toBe(6); // 오행×음양 하나당 유효 띠 6개
    }
  });

  /**
   * CPO 재검수(2번, 확정 지시): 도입절 개수를 늘려도 마지막 연결 어구가 전부
   * 같으면("~편이라," 5/6) 여전히 같은 틀로 읽힌다는 지적. 마지막 공백 이후
   * 토큰(연결 어구)을 최소 3종 이상으로 흩어야 한다 — fallback이 이미
   * "타고나서" 앞의 명사(기운/성향/기질)를 3갈래로 흩힌 것과 같은 원칙이다.
   * 이 테스트가 다음 사람이 다시 "~편이라,"로 전부 되돌리는 것을 막는다.
   */
  const lastToken = (opening: string): string => {
    const stripped = opening.replace(/,$/, "");
    const parts = stripped.split(" ");
    return parts[parts.length - 1];
  };

  const MIN_OPENING_TAIL_VARIETY = 3;
  const MAX_OPENING_TAIL_SHARE = 0.4;

  it("exact 도입절 6종의 마지막 연결 어구가 3종 이상으로 흩어져 있다", () => {
    const paces = Object.keys(OWNER_PACE_OPENING) as OwnerPaceKey[];
    const counts = new Map<string, number>();

    for (const pace of paces) {
      const tail = lastToken(OWNER_PACE_OPENING[pace]);
      counts.set(tail, (counts.get(tail) ?? 0) + 1);
    }

    expect(counts.size).toBeGreaterThanOrEqual(MIN_OPENING_TAIL_VARIETY);
    expect(Math.max(...counts.values()) / paces.length).toBeLessThanOrEqual(
      MAX_OPENING_TAIL_SHARE
    );
  });

  /**
   * fallback은 이미 승인된 상태(문구 재검수 종료)라 임계값을 새로 만들지 않고,
   * "타고나서," 앞의 명사(기운/성향/기질)가 최소 3종 흩어져 있는지만 확인한다.
   * exact와 분류 기준(마지막 토큰 vs 명사 토큰)이 다른 것은 fallback의 분산
   * 지점이 최종 연결어가 아니라 그 앞 명사이기 때문이다 — 그대로 반영했다.
   */
  const nounBeforeTail = (opening: string): string => {
    const stripped = opening.replace(/,$/, "");
    const parts = stripped.split(" ");
    return parts[parts.length - 2];
  };

  it("fallback 도입절 10종은 '타고나서' 앞 명사가 3종 이상으로 흩어져 있다", () => {
    const variants = Object.keys(
      OWNER_ELEMENT_OPENING
    ) as OwnerYearElementVariant[];
    const counts = new Map<string, number>();

    for (const variant of variants) {
      const noun = nounBeforeTail(OWNER_ELEMENT_OPENING[variant]);
      counts.set(noun, (counts.get(noun) ?? 0) + 1);
    }

    expect(counts.size).toBeGreaterThanOrEqual(MIN_OPENING_TAIL_VARIETY);
    // 현재 실측: 기운을 5/10(50%) — exact보다 여유를 넉넉히 둔다(0.6).
    expect(Math.max(...counts.values()) / variants.length).toBeLessThanOrEqual(
      0.6
    );
  });

  /**
   * CPO 재검수(수정 1): dark 14개 중 10개가 "겉으로 드러나지 않는다"는
   * 단일 테마로 수렴해 별끼리 변별력이 사라졌다는 지적. "말이 적다/조용하다"
   * 계열 서술이 dark 14개 중 최대 1~2개까지만 남도록 강제한다.
   */
  it("dark 밝기군에서 '말이 적다' 서술은 14개 중 최대 2개다", () => {
    const scarcitySpeechPattern = /말(수|은)\s*(는|은)?\s*(적|안|아껴)/;

    const hits = MAIN_STAR_NAMES.filter((star) =>
      scarcitySpeechPattern.test(OWNER_STAR_CLOSING[star].dark)
    );

    expect(hits.length).toBeLessThanOrEqual(2);
  });

  it("자미 dark는 과시/허세로 읽힐 수 있는 '티가 난다'류 표현을 쓰지 않는다", () => {
    expect(OWNER_STAR_CLOSING.자미.dark).not.toContain("티");
  });

  it("띠 '용' 종결절은 옛말 '배포' 대신 '배짱'을 쓴다", () => {
    expect(OWNER_ZODIAC_CLOSING.dragon).not.toContain("배포");
    expect(OWNER_ZODIAC_CLOSING.dragon).toContain("배짱");
  });
});

// ============================================================
// 7. building block 무결성 (STAR_CLOSING / ZODIAC_CLOSING 직접 검증)
// ============================================================

describe("owner 한줄평 — building block 무결성", () => {
  it("OWNER_STAR_CLOSING은 14별 × 3밝기군을 모두 채운다", () => {
    const brightnessGroups: BrightnessGroup[] = ["bright", "neutral", "dark"];
    for (const star of MAIN_STAR_NAMES) {
      for (const brightness of brightnessGroups) {
        expect(OWNER_STAR_CLOSING[star][brightness]).toBeTruthy();
      }
    }
  });

  it("OWNER_ZODIAC_CLOSING은 12띠를 모두 채운다", () => {
    expect(Object.keys(OWNER_ZODIAC_CLOSING)).toHaveLength(12);
  });

  it("derivePaceKey: 오행국 2·3·5·6은 그대로, 4는 연간 음양으로 wj4a/wj4b로 갈린다", () => {
    expect(derivePaceKey(2, 0)).toBe("wj2");
    expect(derivePaceKey(3, 0)).toBe("wj3");
    expect(derivePaceKey(5, 0)).toBe("wj5");
    expect(derivePaceKey(6, 0)).toBe("wj6");

    // 갑(0)·병(2)·무(4)·경(6)·임(8) = 양간 → wj4a
    for (const yangStem of [0, 2, 4, 6, 8] as const) {
      expect(derivePaceKey(4, yangStem)).toBe("wj4a");
    }
    // 을(1)·정(3)·기(5)·신(7)·계(9) = 음간 → wj4b
    for (const yinStem of [1, 3, 5, 7, 9] as const) {
      expect(derivePaceKey(4, yinStem)).toBe("wj4b");
    }
  });
});
