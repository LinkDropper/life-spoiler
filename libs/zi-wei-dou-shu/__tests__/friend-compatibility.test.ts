import { readFileSync } from "fs";
import { join } from "path";

import {
  calculateFriendCompatibility,
  type FriendCompatibilityPerson,
  type FriendCompatibilityResult,
} from "../calculators/friend-compatibility";
import {
  FRIEND_COMPATIBILITY_BASE_SCORE,
  FRIEND_COMPATIBILITY_MATRIX_VERSION,
  FRIEND_COMPATIBILITY_MAX_SCORE,
  FRIEND_COMPATIBILITY_MIN_SCORE,
  FRIEND_COMPATIBILITY_TIERS,
  FRIEND_ONE_LINERS,
} from "../constants/friend-compatibility-table";
import { generateZiweiChart } from "../core";
import type { TimeBranchValue, ZiweiChart } from "../types";

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
 * 연도/월/일/시진을 서로 다른 소수 배수로 흩어 명궁·오행국·자미 위치를 다양화한다.
 */
const buildSamples = (): FriendCompatibilityPerson[] => {
  const samples: FriendCompatibilityPerson[] = [];

  for (let year = 1972; year <= 1995; year++) {
    samples.push({
      birthDate: `${year}-${pad(((year * 7) % 12) + 1)}-${pad(((year * 13) % 27) + 1)}`,
      birthTime: TIMES[(year * 5) % 12],
      calendarType: "solar",
    });
    samples.push({
      birthDate: `${year}-${pad(((year * 3) % 12) + 1)}-${pad(((year * 19) % 27) + 1)}`,
      birthTime: TIMES[(year * 11) % 12],
      calendarType: "solar",
    });
  }

  return samples;
};

const SAMPLES = buildSamples();

/** 명반에서 원본 입력(성별 포함)을 제외한 계산 결과만 남긴다 */
const omitInput = (chart: ZiweiChart): Omit<ZiweiChart, "input"> => {
  const copy: Partial<ZiweiChart> = { ...chart };
  delete copy.input;
  return copy as Omit<ZiweiChart, "input">;
};

/** 주석을 제거한 소스 코드 (주석 문구 때문에 정적 검사가 오탐하는 것을 방지) */
const readCodeWithoutComments = (relativePath: string): string =>
  readFileSync(join(__dirname, "..", relativePath), "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

const OWNER: FriendCompatibilityPerson = {
  birthDate: "1990-05-15",
  birthTime: "오",
  calendarType: "solar",
};

const GUEST: FriendCompatibilityPerson = {
  birthDate: "1993-11-02",
  birthTime: "인",
  calendarType: "solar",
};

/** 시간 미상 버전 (같은 생년월일, birthTime만 "unknown") */
const withUnknownTime = (
  person: FriendCompatibilityPerson
): FriendCompatibilityPerson => ({ ...person, birthTime: "unknown" });

/**
 * 시간 미상 경로 전용 표본.
 * 144조합 경로는 쌍당 비용이 12조합의 10배라 표본을 16명으로 줄인다
 * (16×15 = 240쌍 × 144조합 = 34,560 명반쌍 — 테스트 실행 시간 1초 미만).
 */
const UNKNOWN_TEST_SAMPLES = SAMPLES.slice(0, 16);

// ============================================================
// 1. 결정론
// ============================================================

describe("친구 우주 궁합 — 결정론", () => {
  it("동일 입력이면 항상 동일한 결과를 돌려준다", () => {
    const first = calculateFriendCompatibility(OWNER, GUEST);
    const second = calculateFriendCompatibility(OWNER, GUEST);
    const third = calculateFriendCompatibility(OWNER, GUEST);

    expect(second).toEqual(first);
    expect(third).toEqual(first);
  });

  it("전 표본에서 두 번 호출한 결과가 동일하다", () => {
    for (const owner of SAMPLES.slice(0, 12)) {
      for (const guest of SAMPLES.slice(12, 24)) {
        expect(calculateFriendCompatibility(owner, guest)).toEqual(
          calculateFriendCompatibility(owner, guest)
        );
      }
    }
  });

  it("소스에 Math.random / Date.now / new Date 가 없다", () => {
    const sources = [
      "calculators/friend-compatibility.ts",
      "constants/friend-compatibility-table.ts",
    ].map(readCodeWithoutComments);

    for (const source of sources) {
      expect(source).not.toMatch(/Math\.random/);
      expect(source).not.toMatch(/Date\.now/);
      expect(source).not.toMatch(/new Date\(/);
    }
  });
});

// ============================================================
// 2. LLM / 대운 미사용 보장
// ============================================================

describe("친구 우주 궁합 — 금지 의존성", () => {
  const source = readCodeWithoutComments("calculators/friend-compatibility.ts");

  it("AI 서비스 모듈을 import하지 않는다", () => {
    expect(source).not.toMatch(/services\/ai/);
    expect(source).not.toMatch(/compatibility-interpreter/);
    expect(source).not.toMatch(/generateCompatibilityInterpretation/);
  });

  it("성별에 의존하는 대운(dayun) 계산을 사용하지 않는다", () => {
    expect(source).not.toMatch(/dayun/i);
    expect(source).not.toMatch(/calculateDayun/);
  });

  it("명반의 input(성별 포함)을 읽지 않는다", () => {
    // chart.input.gender 등 입력 원본을 참조하면 성별 비의존성이 깨진다.
    expect(source).not.toMatch(/Chart\.input/);
    expect(source).not.toMatch(/\.input\.gender/);
  });
});

// ============================================================
// 3. 성별 비의존 (guest는 성별을 입력하지 않는다)
// ============================================================

describe("친구 우주 궁합 — 성별 비의존", () => {
  it("generateZiweiChart는 gender를 바꿔도 input 외 모든 필드가 동일하다", () => {
    for (const sample of SAMPLES.slice(0, 24)) {
      const base = {
        name: "테스트",
        birthDate: sample.birthDate,
        birthTime: "12:00",
        calendarType: sample.calendarType,
      } as const;

      const male = generateZiweiChart({ ...base, gender: "male" });
      const female = generateZiweiChart({ ...base, gender: "female" });

      expect(omitInput(female)).toEqual(omitInput(male));
    }
  });

  it("내부 고정 성별을 female로 바꿔도 score/tier/oneLiner가 동일하다", () => {
    const runWithForcedGender = (
      gender: "male" | "female"
    ): FriendCompatibilityResult[] => {
      const results: FriendCompatibilityResult[] = [];

      jest.isolateModules(() => {
        jest.doMock("../core", () => {
          const actual =
            jest.requireActual<typeof import("../core")>("../core");

          return {
            ...actual,
            generateZiweiChart: (
              input: Parameters<typeof actual.generateZiweiChart>[0]
            ) => actual.generateZiweiChart({ ...input, gender }),
          };
        });

        // 모듈 모킹 후 재로딩해야 하므로 동적 require가 필요하다.
        /* eslint-disable @typescript-eslint/no-require-imports */
        const mod =
          require("../calculators/friend-compatibility") as typeof import("../calculators/friend-compatibility");
        /* eslint-enable @typescript-eslint/no-require-imports */

        for (const owner of SAMPLES.slice(0, 10)) {
          for (const guest of SAMPLES.slice(10, 20)) {
            results.push(mod.calculateFriendCompatibility(owner, guest));
          }
        }
      });

      return results;
    };

    const asMale = runWithForcedGender("male");
    const asFemale = runWithForcedGender("female");

    expect(asFemale).toHaveLength(asMale.length);
    expect(asFemale).toEqual(asMale);

    jest.dontMock("../core");
    jest.resetModules();
  });
});

// ============================================================
// 4. 대칭성
// ============================================================

describe("친구 우주 궁합 — 대칭성", () => {
  /**
   * @결정 score / tier / oneLinerId 모두 완전 대칭으로 고정한다.
   *
   * @근거
   * 1) 삼합파에서 두 사람 사이의 판정 축(지지 삼합·육합·충·형·해·파,
   *    명궁 자리 관계, 주성 상성)은 모두 무방향 관계다.
   * 2) 방향성이 있는 축은 오행 생극과 사화 비화(飛化) 둘뿐인데,
   *    합혼(合婚)에서 이 둘은 "관계 전체에 걸리는 긴장/윤활"로 읽는 것이
   *    삼합파의 통상 해석이다. 그래서 양방향을 모두 계산해 합산/평균한다.
   * 3) 제품 관점: 링크 소유자와 친구가 서로 조회했을 때 점수가 다르면
   *    결과를 신뢰하지 못해 공유가 끊긴다. 비대칭을 정당화할 만큼
   *    강한 이론적 근거가 없으므로 대칭을 택했다.
   */
  it("owner/guest를 바꿔도 score·tier·oneLinerId가 같다", () => {
    for (const a of SAMPLES) {
      for (const b of SAMPLES) {
        if (a === b) continue;

        const forward = calculateFriendCompatibility(a, b);
        const backward = calculateFriendCompatibility(b, a);

        expect(backward.score).toBe(forward.score);
        expect(backward.tier).toBe(forward.tier);
        expect(backward.oneLinerId).toBe(forward.oneLinerId);
      }
    }
  });

  it("owner/guest를 바꿔도 factors가 완전히 동일하다", () => {
    for (const a of SAMPLES.slice(0, 16)) {
      for (const b of SAMPLES.slice(16, 32)) {
        expect(calculateFriendCompatibility(b, a).factors).toEqual(
          calculateFriendCompatibility(a, b).factors
        );
      }
    }
  });
});

// ============================================================
// 5. 결과 구조 / 불변식
// ============================================================

describe("친구 우주 궁합 — 결과 불변식", () => {
  const results = SAMPLES.slice(0, 24).flatMap((owner) =>
    SAMPLES.slice(24).map((guest) => calculateFriendCompatibility(owner, guest))
  );

  it("score는 0~100 사이 정수다", () => {
    for (const result of results) {
      expect(Number.isInteger(result.score)).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.score).toBeGreaterThanOrEqual(
        FRIEND_COMPATIBILITY_MIN_SCORE
      );
      expect(result.score).toBeLessThanOrEqual(FRIEND_COMPATIBILITY_MAX_SCORE);
    }
  });

  it("tier는 등급표의 점수 구간과 일치한다", () => {
    for (const result of results) {
      const tier = FRIEND_COMPATIBILITY_TIERS.find(
        (t) => t.tier === result.tier
      );

      expect(tier).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(tier!.minScore);
      expect(result.score).toBeLessThanOrEqual(tier!.maxScore);
    }
  });

  it("등급 구간은 0~100을 빈틈·중복 없이 덮는다", () => {
    const sorted = [...FRIEND_COMPATIBILITY_TIERS].sort(
      (a, b) => a.minScore - b.minScore
    );

    expect(sorted[0].minScore).toBe(0);
    expect(sorted[sorted.length - 1].maxScore).toBe(100);

    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].minScore).toBe(sorted[i - 1].maxScore + 1);
    }
  });

  it("factors delta 합 + 기준 점수 = score (clamp 구간 제외)", () => {
    for (const result of results) {
      const total = result.factors.reduce((sum, f) => sum + f.delta, 0);
      const raw = FRIEND_COMPATIBILITY_BASE_SCORE + total;

      if (
        raw >= FRIEND_COMPATIBILITY_MIN_SCORE &&
        raw <= FRIEND_COMPATIBILITY_MAX_SCORE
      ) {
        expect(result.score).toBe(raw);
      }
    }
  });

  it("factors는 항상 띠·오행·명궁 자리 3축을 포함한다", () => {
    for (const result of results) {
      const labels = result.factors.map((f) => f.label);
      expect(labels).toContain("띠 관계");
      expect(labels).toContain("오행 기운");
      expect(labels).toContain("명궁 자리");
    }
  });

  it("matrixVersion이 고정되어 있다", () => {
    expect(FRIEND_COMPATIBILITY_MATRIX_VERSION).toBe("fu-1.1.0");

    for (const result of results) {
      expect(result.matrixVersion).toBe(FRIEND_COMPATIBILITY_MATRIX_VERSION);
    }
  });

  it("양쪽 시간을 알면 confidence=exact, 조합 수 1이다", () => {
    for (const result of results) {
      expect(result.confidence).toBe("exact");
      expect(result.chartCombinations).toBe(1);
    }
  });

  it("factors 길이는 3~8이고 label은 8종 고정 문자열이다", () => {
    const allowedLabels = [
      "띠 관계",
      "오행 기운",
      "명궁 자리",
      "타고난 성향",
      "친구 자리",
      "서로에게 주는 영향",
      "태어난 해 기운",
      "시간 정보",
    ];

    for (const result of results) {
      expect(result.factors.length).toBeGreaterThanOrEqual(3);
      expect(result.factors.length).toBeLessThanOrEqual(8);

      for (const factor of result.factors) {
        expect(allowedLabels).toContain(factor.label);
        expect(Number.isInteger(factor.delta)).toBe(true);
      }
    }
  });

  it("음력 입력도 처리한다", () => {
    const lunar = calculateFriendCompatibility(
      { birthDate: "1990-04-21", birthTime: "오", calendarType: "lunar" },
      { birthDate: "1993-09-19", birthTime: "인", calendarType: "lunar" }
    );

    expect(lunar.score).toBeGreaterThan(0);
    expect(lunar.oneLinerKo.length).toBeGreaterThan(0);
  });
});

// ============================================================
// 6. 한줄평
// ============================================================

describe("친구 우주 궁합 — 한줄평", () => {
  const ZODIAC_KEYS = [
    "samhap",
    "yukhap",
    "same-sign",
    "clash",
    "punishment",
    "harm",
    "break",
    "neutral",
  ];
  const ELEMENT_KEYS = ["generate", "same", "overcome"];

  it("띠 관계 8종 × 오행 관계 3종 = 24개 템플릿이 모두 정의되어 있다", () => {
    expect(Object.keys(FRIEND_ONE_LINERS)).toHaveLength(24);

    for (const zodiac of ZODIAC_KEYS) {
      for (const element of ELEMENT_KEYS) {
        const id = `fu-${zodiac}-${element}`;
        expect(FRIEND_ONE_LINERS[id]).toBeDefined();
        expect(FRIEND_ONE_LINERS[id].id).toBe(id);
      }
    }
  });

  it("oneLinerId는 안정적인 kebab-case 슬러그다", () => {
    for (const id of Object.keys(FRIEND_ONE_LINERS)) {
      expect(id).toMatch(/^fu-[a-z-]+-[a-z]+$/);
    }
  });

  it("모든 한줄평이 서로 다르다", () => {
    const texts = Object.values(FRIEND_ONE_LINERS).map((o) => o.ko);
    expect(new Set(texts).size).toBe(texts.length);
  });

  it("브랜드 보이스: 금지 표현이 없다", () => {
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

    for (const { ko } of Object.values(FRIEND_ONE_LINERS)) {
      for (const word of banned) {
        expect(ko).not.toContain(word);
      }
    }
  });

  it("브랜드 보이스: 존댓말로 끝난다", () => {
    for (const { ko } of Object.values(FRIEND_ONE_LINERS)) {
      expect(ko.trim()).toMatch(/(요|다)\.$/);
    }
  });

  it("브랜드 보이스: 자미두수 전문 용어를 쓰지 않는다", () => {
    // 일상어에 부분 문자열로 섞여 드는 짧은 용어("지지" ⊂ "친해지지만")는
    // 오탐을 내므로 실제 표기 형태("십이지지")로만 검사한다.
    const jargon = [
      "삼합",
      "육합",
      "명궁",
      "재백궁",
      "교우궁",
      "사화",
      "화록",
      "화기",
      "오행",
      "자미",
      "대운",
      "천간",
      "십이지지",
      "상생",
      "상극",
      "격국",
      "묘왕",
    ];

    for (const { ko } of Object.values(FRIEND_ONE_LINERS)) {
      for (const term of jargon) {
        expect(ko).not.toContain(term);
      }
    }
  });

  /**
   * 4번 영역에서 친구 여러 명의 한줄평이 리스트로 나란히 깔리므로,
   * 종결 어미가 한쪽으로 쏠리면 개별로는 안 보이던 템플릿 티가 한눈에 드러난다.
   * (CPO 지적: 개선 전 24개 중 22개가 "~ㅂ니다/습니다"로 끝났다)
   */
  const classifyEnding = (text: string): string => {
    const patterns: Array<[string, RegExp]> = [
      ["더라고요", /더라고요\.$/],
      ["거든요", /거든요\.$/],
      ["랄까요", /랄까요\.$/],
      ["세요", /세요\.$/],
      ["고요", /고요\.$/],
      ["니다", /니다\.$/],
    ];

    const matched = patterns.find(([, pattern]) => pattern.test(text));
    return matched ? matched[0] : "요";
  };

  /**
   * 현재 실측: 최빈 형태 `~니다` 5/24 = **20.8%** / 임계값 **30%**
   *
   * 30%는 24개 기준 7개까지 허용한다(같은 어미 2개 추가까지 통과).
   * 어미 종류는 현재 7종이며 5종 미만으로 줄면 실패한다.
   */
  const MAX_ENDING_SHARE = 0.3;
  const MIN_ENDING_VARIETY = 5;

  it("종결 어미가 한쪽으로 쏠리지 않는다 (최빈 형태 30% 미만)", () => {
    const counts = new Map<string, number>();
    for (const { ko } of Object.values(FRIEND_ONE_LINERS)) {
      const ending = classifyEnding(ko);
      counts.set(ending, (counts.get(ending) ?? 0) + 1);
    }

    const total = Object.keys(FRIEND_ONE_LINERS).length;
    expect(counts.size).toBeGreaterThanOrEqual(MIN_ENDING_VARIETY);
    expect(Math.max(...counts.values()) / total).toBeLessThan(MAX_ENDING_SHARE);
  });

  /**
   * 현재 실측: "~사이예요."로 끝나는 첫 문장 10/24 = **41.7%** / 임계값 **50%**
   *
   * 50%는 24개 기준 12개까지 허용한다(2개 추가까지 통과).
   * CPO가 원문 고정한 rewrite 6개가 전부 이 형태라 **25%(6/24)가 구조적 하한**이다.
   * 그 아래로는 문구를 다시 쓰지 않는 한 내려갈 수 없으므로 임계값을 25% 근처로 잡지 말 것.
   */
  const MAX_OPENER_SHARE = 0.5;

  it("첫 문장이 같은 어구로 시작·종결되는 비율이 과하지 않다 (50% 미만)", () => {
    const openers = Object.values(FRIEND_ONE_LINERS).filter(({ ko }) =>
      ko.split(". ")[0].endsWith("사이예요")
    ).length;

    expect(openers / Object.keys(FRIEND_ONE_LINERS).length).toBeLessThan(
      MAX_OPENER_SHARE
    );
  });

  it("결과의 oneLinerKo는 템플릿 원문과 일치한다", () => {
    for (const owner of SAMPLES.slice(0, 8)) {
      for (const guest of SAMPLES.slice(8, 16)) {
        const result = calculateFriendCompatibility(owner, guest);
        expect(result.oneLinerKo).toBe(FRIEND_ONE_LINERS[result.oneLinerId].ko);
      }
    }
  });
});

// ============================================================
// 7. 점수 분포 회귀
// ============================================================

describe("친구 우주 궁합 — 점수 분포", () => {
  const scores: number[] = [];
  const tierCount = new Map<string, number>();
  const oneLinerIds = new Set<string>();

  for (let i = 0; i < SAMPLES.length; i++) {
    for (let j = 0; j < SAMPLES.length; j++) {
      if (i === j) continue;
      const result = calculateFriendCompatibility(SAMPLES[i], SAMPLES[j]);
      scores.push(result.score);
      tierCount.set(result.tier, (tierCount.get(result.tier) ?? 0) + 1);
      oneLinerIds.add(result.oneLinerId);
    }
  }

  const total = scores.length;
  const ratio = (n: number): number => n / total;

  it("표본이 충분하다 (2,256쌍)", () => {
    expect(total).toBe(2256);
  });

  it("중앙에 과밀하지 않다 — 어떤 10점 구간도 30%를 넘지 않는다", () => {
    const buckets = new Map<number, number>();
    for (const score of scores) {
      const key = Math.floor(score / 10) * 10;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    for (const count of buckets.values()) {
      expect(ratio(count)).toBeLessThan(0.3);
    }
  });

  it("40~59 구간에 과반이 몰리지 않는다", () => {
    const mid = scores.filter((s) => s >= 40 && s < 60).length;
    expect(ratio(mid)).toBeLessThan(0.35);
  });

  it("최상위 등급이 지나치게 희소하지도 흔하지도 않다 (3%~15%)", () => {
    const top = ratio(tierCount.get("twin-star") ?? 0);
    expect(top).toBeGreaterThan(0.03);
    expect(top).toBeLessThan(0.15);
  });

  it("6개 등급이 모두 등장하고, 각 등급이 3% 이상을 차지한다", () => {
    expect(tierCount.size).toBe(FRIEND_COMPATIBILITY_TIERS.length);

    for (const tier of FRIEND_COMPATIBILITY_TIERS) {
      expect(ratio(tierCount.get(tier.tier) ?? 0)).toBeGreaterThan(0.03);
    }
  });

  it("중앙값이 58~72 사이다 (바이럴용 상향 편향, 단 과도하지 않게)", () => {
    const sorted = [...scores].sort((a, b) => a - b);
    const median = sorted[Math.floor(total / 2)];

    expect(median).toBeGreaterThanOrEqual(58);
    expect(median).toBeLessThanOrEqual(72);
  });

  it("점수 폭이 충분히 넓다 (하위 10% ≤ 50, 상위 10% ≥ 85)", () => {
    const sorted = [...scores].sort((a, b) => a - b);

    expect(sorted[Math.floor(total * 0.1)]).toBeLessThanOrEqual(50);
    expect(sorted[Math.floor(total * 0.9)]).toBeGreaterThanOrEqual(85);
  });

  it("24개 한줄평이 모두 실제로 도달 가능하다", () => {
    expect(oneLinerIds.size).toBe(24);
  });
});

// ============================================================
// 8. exact 경로 골든 회귀 (fu-1.0.0 → fu-1.1.0 점수 불변)
// ============================================================

/**
 * `fu-1.0.0`에서 실측한 값이다.
 * 시간 미상 지원은 **기능 추가**이므로 시진을 모두 아는 경우의 결과가 바뀌면 안 된다.
 * 이 표가 깨지면 매트릭스 튜닝이 섞여 들어간 것이니, 의도한 튜닝이라면
 * `FRIEND_COMPATIBILITY_MATRIX_VERSION`을 올리고 이 표를 함께 갱신해야 한다.
 */
const EXACT_GOLDEN: ReadonlyArray<{
  a: [string, TimeBranchValue];
  b: [string, TimeBranchValue];
  score: number;
  tier: string;
  oneLinerId: string;
}> = [
  {
    a: ["1972-05-14", "신"],
    b: ["1975-01-20", "신"],
    score: 65,
    tier: "steady-orbit",
    oneLinerId: "fu-neutral-overcome",
  },
  {
    a: ["1973-12-27", "축"],
    b: ["1976-04-12", "미"],
    score: 38,
    tier: "distant-star",
    oneLinerId: "fu-break-overcome",
  },
  {
    a: ["1974-07-13", "오"],
    b: ["1977-07-04", "오"],
    score: 68,
    tier: "warm-gravity",
    oneLinerId: "fu-punishment-generate",
  },
  {
    a: ["1975-02-26", "해"],
    b: ["1978-10-23", "사"],
    score: 58,
    tier: "steady-orbit",
    oneLinerId: "fu-break-same",
  },
  {
    a: ["1976-09-12", "진"],
    b: ["1979-01-15", "진"],
    score: 81,
    tier: "bright-orbit",
    oneLinerId: "fu-neutral-generate",
  },
  {
    a: ["1977-04-25", "유"],
    b: ["1980-04-07", "묘"],
    score: 53,
    tier: "crossing-comet",
    oneLinerId: "fu-yukhap-overcome",
  },
  {
    a: ["1978-11-11", "인"],
    b: ["1981-07-26", "인"],
    score: 90,
    tier: "twin-star",
    oneLinerId: "fu-neutral-generate",
  },
  {
    a: ["1979-06-24", "미"],
    b: ["1982-10-18", "축"],
    score: 30,
    tier: "distant-star",
    oneLinerId: "fu-punishment-overcome",
  },
  {
    a: ["1980-01-10", "자"],
    b: ["1983-01-10", "자"],
    score: 60,
    tier: "steady-orbit",
    oneLinerId: "fu-punishment-generate",
  },
  {
    a: ["1981-08-23", "사"],
    b: ["1984-04-02", "해"],
    score: 52,
    tier: "crossing-comet",
    oneLinerId: "fu-break-same",
  },
  {
    a: ["1982-03-09", "술"],
    b: ["1985-07-21", "술"],
    score: 47,
    tier: "crossing-comet",
    oneLinerId: "fu-punishment-overcome",
  },
  {
    a: ["1983-10-22", "묘"],
    b: ["1986-10-13", "유"],
    score: 84,
    tier: "bright-orbit",
    oneLinerId: "fu-yukhap-generate",
  },
  {
    a: ["1984-05-08", "신"],
    b: ["1987-01-05", "신"],
    score: 79,
    tier: "bright-orbit",
    oneLinerId: "fu-neutral-generate",
  },
  {
    a: ["1985-12-21", "축"],
    b: ["1988-04-24", "미"],
    score: 41,
    tier: "distant-star",
    oneLinerId: "fu-break-overcome",
  },
  {
    a: ["1986-07-07", "오"],
    b: ["1989-07-16", "오"],
    score: 45,
    tier: "crossing-comet",
    oneLinerId: "fu-punishment-overcome",
  },
  {
    a: ["1987-02-20", "해"],
    b: ["1990-10-08", "사"],
    score: 56,
    tier: "steady-orbit",
    oneLinerId: "fu-break-same",
  },
  {
    a: ["1988-09-06", "진"],
    b: ["1991-01-27", "진"],
    score: 53,
    tier: "crossing-comet",
    oneLinerId: "fu-neutral-overcome",
  },
  {
    a: ["1989-04-19", "유"],
    b: ["1992-04-19", "묘"],
    score: 65,
    tier: "steady-orbit",
    oneLinerId: "fu-yukhap-overcome",
  },
  {
    a: ["1990-11-05", "인"],
    b: ["1993-07-11", "인"],
    score: 47,
    tier: "crossing-comet",
    oneLinerId: "fu-neutral-overcome",
  },
  {
    a: ["1991-06-18", "미"],
    b: ["1994-10-03", "축"],
    score: 32,
    tier: "distant-star",
    oneLinerId: "fu-punishment-overcome",
  },
  {
    a: ["1992-01-04", "자"],
    b: ["1995-01-22", "자"],
    score: 44,
    tier: "crossing-comet",
    oneLinerId: "fu-punishment-overcome",
  },
  {
    a: ["1993-08-17", "사"],
    b: ["1996-04-14", "해"],
    score: 45,
    tier: "crossing-comet",
    oneLinerId: "fu-break-same",
  },
  {
    a: ["1994-03-03", "술"],
    b: ["1997-07-06", "술"],
    score: 44,
    tier: "crossing-comet",
    oneLinerId: "fu-punishment-overcome",
  },
  {
    a: ["1995-10-16", "묘"],
    b: ["1998-10-25", "유"],
    score: 58,
    tier: "steady-orbit",
    oneLinerId: "fu-yukhap-overcome",
  },
];

describe("친구 우주 궁합 — exact 경로 골든 회귀", () => {
  it("시진을 모두 아는 경우의 점수는 fu-1.0.0과 완전히 동일하다", () => {
    for (const row of EXACT_GOLDEN) {
      const result = calculateFriendCompatibility(
        { birthDate: row.a[0], birthTime: row.a[1], calendarType: "solar" },
        { birthDate: row.b[0], birthTime: row.b[1], calendarType: "solar" }
      );

      expect({
        score: result.score,
        tier: result.tier,
        oneLinerId: result.oneLinerId,
      }).toEqual({
        score: row.score,
        tier: row.tier,
        oneLinerId: row.oneLinerId,
      });
    }
  });
});

// ============================================================
// 9. append-only 계약 (DB에 one_liner_id / tier만 저장하므로 필수)
// ============================================================

describe("친구 우주 궁합 — 슬러그 append-only 계약", () => {
  /** 한 번 릴리스된 ID는 삭제·개명 금지. 추가만 허용. */
  const RELEASED_ONE_LINER_IDS = [
    "fu-samhap-generate",
    "fu-samhap-same",
    "fu-samhap-overcome",
    "fu-yukhap-generate",
    "fu-yukhap-same",
    "fu-yukhap-overcome",
    "fu-same-sign-generate",
    "fu-same-sign-same",
    "fu-same-sign-overcome",
    "fu-clash-generate",
    "fu-clash-same",
    "fu-clash-overcome",
    "fu-punishment-generate",
    "fu-punishment-same",
    "fu-punishment-overcome",
    "fu-harm-generate",
    "fu-harm-same",
    "fu-harm-overcome",
    "fu-break-generate",
    "fu-break-same",
    "fu-break-overcome",
    "fu-neutral-generate",
    "fu-neutral-same",
    "fu-neutral-overcome",
  ];

  const RELEASED_TIERS = [
    "twin-star",
    "bright-orbit",
    "warm-gravity",
    "steady-orbit",
    "crossing-comet",
    "distant-star",
  ];

  it("릴리스된 oneLinerId가 하나도 사라지거나 개명되지 않았다", () => {
    for (const id of RELEASED_ONE_LINER_IDS) {
      expect(FRIEND_ONE_LINERS[id]).toBeDefined();
      expect(FRIEND_ONE_LINERS[id].id).toBe(id);
      expect(typeof FRIEND_ONE_LINERS[id].ko).toBe("string");
    }
  });

  it("릴리스된 tier 슬러그가 하나도 사라지거나 개명되지 않았다", () => {
    const current = FRIEND_COMPATIBILITY_TIERS.map((t) => t.tier);
    for (const tier of RELEASED_TIERS) {
      expect(current).toContain(tier);
    }
  });
});

// ============================================================
// 10. 시간 미상(unknown) 경로
// ============================================================

describe("친구 우주 궁합 — 시간 미상", () => {
  const oneUnknown = calculateFriendCompatibility(
    OWNER,
    withUnknownTime(GUEST)
  );
  const bothUnknown = calculateFriendCompatibility(
    withUnknownTime(OWNER),
    withUnknownTime(GUEST)
  );

  it("한쪽만 미상이면 12조합, 양쪽 미상이면 144조합이다", () => {
    expect(oneUnknown.confidence).toBe("estimated");
    expect(oneUnknown.chartCombinations).toBe(12);

    expect(bothUnknown.confidence).toBe("estimated");
    expect(bothUnknown.chartCombinations).toBe(144);
  });

  it("owner만 미상이든 guest만 미상이든 조합 수가 같다", () => {
    const ownerUnknown = calculateFriendCompatibility(
      withUnknownTime(OWNER),
      GUEST
    );
    expect(ownerUnknown.chartCombinations).toBe(12);
    expect(ownerUnknown.confidence).toBe("estimated");
  });

  it("estimated면 시간 안내 factor가 delta 0으로 포함된다", () => {
    for (const result of [oneUnknown, bothUnknown]) {
      const note = result.factors.find((f) => f.label === "시간 정보");
      expect(note).toBeDefined();
      expect(note!.delta).toBe(0);
      expect(note!.detail).toBe("태어난 시간을 넣으면 결과가 더 선명해져요");
      // 브랜드 보이스: 존댓말 + 전문 용어 없음 + 긍정형
      expect(note!.detail).toMatch(/요$/);
      expect(note!.detail).not.toContain("명궁");
      expect(note!.detail).not.toContain("정확도");
    }
  });

  it("exact 결과에는 시간 안내 factor가 없다", () => {
    const exact = calculateFriendCompatibility(OWNER, GUEST);
    expect(exact.factors.some((f) => f.label === "시간 정보")).toBe(false);
  });

  it("시진 무관 축(띠 관계·태어난 해 기운)은 미상 여부와 무관하게 동일하다", () => {
    const exact = calculateFriendCompatibility(OWNER, GUEST);
    const labels = ["띠 관계", "태어난 해 기운"];

    for (const label of labels) {
      const fromExact = exact.factors.find((f) => f.label === label);
      const fromUnknown = bothUnknown.factors.find((f) => f.label === label);
      expect(fromUnknown).toEqual(fromExact);
    }
  });

  it("시진 의존 축의 detail에는 평균임이 명시된다", () => {
    const palace = bothUnknown.factors.find((f) => f.label === "명궁 자리");
    expect(palace!.detail).toContain("시간 미상 — 144가지 경우의 평균");

    const palace12 = oneUnknown.factors.find((f) => f.label === "명궁 자리");
    expect(palace12!.detail).toContain("시간 미상 — 12가지 경우의 평균");
  });

  it("결정론: 동일 입력이면 항상 동일 결과", () => {
    expect(calculateFriendCompatibility(OWNER, withUnknownTime(GUEST))).toEqual(
      oneUnknown
    );
    expect(
      calculateFriendCompatibility(
        withUnknownTime(OWNER),
        withUnknownTime(GUEST)
      )
    ).toEqual(bothUnknown);
  });

  it("대칭성: 한쪽 미상 조합에서 owner/guest를 바꿔도 결과가 같다", () => {
    for (const a of UNKNOWN_TEST_SAMPLES) {
      for (const b of UNKNOWN_TEST_SAMPLES) {
        if (a === b) continue;

        const forward = calculateFriendCompatibility(a, withUnknownTime(b));
        const backward = calculateFriendCompatibility(withUnknownTime(b), a);

        expect(backward.score).toBe(forward.score);
        expect(backward.tier).toBe(forward.tier);
        expect(backward.oneLinerId).toBe(forward.oneLinerId);
        expect(backward.factors).toEqual(forward.factors);
      }
    }
  });

  it("대칭성: 양쪽 미상 조합에서도 owner/guest를 바꿔도 결과가 같다", () => {
    for (const a of UNKNOWN_TEST_SAMPLES.slice(0, 8)) {
      for (const b of UNKNOWN_TEST_SAMPLES.slice(8)) {
        expect(
          calculateFriendCompatibility(withUnknownTime(b), withUnknownTime(a))
        ).toEqual(
          calculateFriendCompatibility(withUnknownTime(a), withUnknownTime(b))
        );
      }
    }
  });

  it("성별 비의존: 고정 성별을 female로 바꿔도 미상 경로 결과가 동일하다", () => {
    const runWithForcedGender = (
      gender: "male" | "female"
    ): FriendCompatibilityResult[] => {
      const results: FriendCompatibilityResult[] = [];

      jest.isolateModules(() => {
        jest.doMock("../core", () => {
          const actual =
            jest.requireActual<typeof import("../core")>("../core");

          return {
            ...actual,
            generateZiweiChart: (
              input: Parameters<typeof actual.generateZiweiChart>[0]
            ) => actual.generateZiweiChart({ ...input, gender }),
          };
        });

        /* eslint-disable @typescript-eslint/no-require-imports */
        const mod =
          require("../calculators/friend-compatibility") as typeof import("../calculators/friend-compatibility");
        /* eslint-enable @typescript-eslint/no-require-imports */

        for (const a of UNKNOWN_TEST_SAMPLES.slice(0, 6)) {
          for (const b of UNKNOWN_TEST_SAMPLES.slice(6, 12)) {
            results.push(
              mod.calculateFriendCompatibility(a, withUnknownTime(b))
            );
            results.push(
              mod.calculateFriendCompatibility(
                withUnknownTime(a),
                withUnknownTime(b)
              )
            );
          }
        }
      });

      return results;
    };

    const asMale = runWithForcedGender("male");
    const asFemale = runWithForcedGender("female");

    expect(asFemale).toHaveLength(asMale.length);
    expect(asFemale).toEqual(asMale);

    jest.dontMock("../core");
    jest.resetModules();
  });

  it("불변식: score 0~100 정수, tier 구간 일치, factors 합 = score", () => {
    const results = UNKNOWN_TEST_SAMPLES.slice(0, 8).flatMap((a) =>
      UNKNOWN_TEST_SAMPLES.slice(8).map((b) =>
        calculateFriendCompatibility(a, withUnknownTime(b))
      )
    );

    for (const result of results) {
      expect(Number.isInteger(result.score)).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);

      const tier = FRIEND_COMPATIBILITY_TIERS.find(
        (t) => t.tier === result.tier
      );
      expect(tier).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(tier!.minScore);
      expect(result.score).toBeLessThanOrEqual(tier!.maxScore);

      expect(FRIEND_ONE_LINERS[result.oneLinerId]).toBeDefined();
      expect(result.oneLinerKo).toBe(FRIEND_ONE_LINERS[result.oneLinerId].ko);

      const total = result.factors.reduce((sum, f) => sum + f.delta, 0);
      const raw = FRIEND_COMPATIBILITY_BASE_SCORE + total;
      if (
        raw >= FRIEND_COMPATIBILITY_MIN_SCORE &&
        raw <= FRIEND_COMPATIBILITY_MAX_SCORE
      ) {
        expect(result.score).toBe(raw);
      }
    }
  });

  it("미상 경로도 결과가 충분히 분화된다 (동일 점수 쏠림 없음)", () => {
    const scores = UNKNOWN_TEST_SAMPLES.flatMap((a) =>
      UNKNOWN_TEST_SAMPLES.filter((b) => b !== a).map(
        (b) => calculateFriendCompatibility(a, withUnknownTime(b)).score
      )
    );

    const counts = new Map<number, number>();
    for (const s of scores) counts.set(s, (counts.get(s) ?? 0) + 1);

    // 1안(시진 의존 축 제외)이었다면 최빈 점수가 32% 이상을 차지했다.
    const topShare = Math.max(...counts.values()) / scores.length;
    expect(counts.size).toBeGreaterThan(20);
    expect(topShare).toBeLessThan(0.15);
  });
});

// ============================================================
// 11. 점수 ↔ 한줄평 정합성 (QA 가드)
// ============================================================

/**
 * `oneLinerId`는 (띠 × 오행) 2축, `score`는 6축으로 산출되므로 구조적으로 독립이다.
 * 엔진 로직이 아니라 **QA 가드**다 — 문구나 점수 상수를 손댔을 때
 * "높은 점수 + 무거운 문구" 같은 부조화가 늘어나면 실패한다.
 *
 * 극성 기준: 문구의 지배적 절이
 * (a) 이득/편함 → positive, (b) 이득+단서가 균형 → neutral, (c) 마찰/관리 필요 → negative
 */
const ONE_LINER_POLARITY: Record<string, "positive" | "neutral" | "negative"> =
  {
    "fu-samhap-generate": "positive",
    "fu-samhap-same": "neutral",
    "fu-samhap-overcome": "neutral",
    "fu-yukhap-generate": "positive",
    "fu-yukhap-same": "neutral",
    "fu-yukhap-overcome": "neutral",
    "fu-same-sign-generate": "positive",
    "fu-same-sign-same": "neutral",
    "fu-same-sign-overcome": "neutral",
    "fu-clash-generate": "neutral",
    "fu-clash-same": "neutral",
    "fu-clash-overcome": "neutral",
    "fu-punishment-generate": "neutral",
    "fu-punishment-same": "negative",
    "fu-punishment-overcome": "negative",
    "fu-harm-generate": "negative",
    "fu-harm-same": "negative",
    "fu-harm-overcome": "negative",
    "fu-break-generate": "neutral",
    "fu-break-same": "negative",
    "fu-break-overcome": "negative",
    "fu-neutral-generate": "positive",
    "fu-neutral-same": "neutral",
    "fu-neutral-overcome": "neutral",
  };

const TIER_BAND: Record<string, "high" | "mid" | "low"> = {
  "twin-star": "high",
  "bright-orbit": "high",
  "warm-gravity": "mid",
  "steady-orbit": "mid",
  "crossing-comet": "low",
  "distant-star": "low",
};

describe("친구 우주 궁합 — 점수 ↔ 한줄평 정합성", () => {
  const rows = SAMPLES.flatMap((a) =>
    SAMPLES.filter((b) => b !== a).map((b) => {
      const result = calculateFriendCompatibility(a, b);
      return {
        score: result.score,
        tier: result.tier,
        band: TIER_BAND[result.tier],
        polarity: ONE_LINER_POLARITY[result.oneLinerId],
      };
    })
  );

  it("극성 표가 한줄평 24개를 빠짐없이 덮는다", () => {
    expect(Object.keys(ONE_LINER_POLARITY).sort()).toEqual(
      Object.keys(FRIEND_ONE_LINERS).sort()
    );
  });

  /**
   * 현재 실측: 4/2,256 = **0.18%** / 임계값 **0.5%**
   *
   * 한줄평 하나의 극성을 한 단계 나쁘게 재분류했을 때 늘어나는 불일치를 전수 측정한 결과,
   * **최소 영향이 0.18%p**(4쌍)이고 최대는 9.93%p였다.
   * 0.5%는 "최소 규모 재분류 1건(0.18 + 0.18 = 0.36%)은 통과, 2건 또는 중간 규모 이상
   * 1건(≥0.32%p)은 실패"에 해당하는 선이다. 24개 중 19개는 단독 재분류만으로도 걸린다.
   *
   * 참고: EN/JA 번역은 이 지표를 **전혀 움직이지 않는다**.
   * 극성 표가 `oneLinerId`로 키잉되고 점수는 언어 독립이기 때문이다.
   * 이 가드가 실제로 반응하는 변경은 (a) 한줄평 ID 추가/극성 재분류,
   * (b) 점수 상수 튜닝, (c) tier 경계 이동 세 가지다.
   *
   * 알려진 사각지대: 영향이 6쌍(0.27%p) 이하인 재분류 4~5건은 이 임계값을 통과한다.
   * 더 조이지 않는 이유는 기준값 자체가 4쌍이라, 점수 튜닝으로 ±2쌍만 흔들려도
   * 정상 변경에서 오탐이 나기 때문이다. 그 구간은 아래 두 불변식이 대신 잡는다.
   */
  const MAX_MISMATCH_RATE = 0.005;

  it("등급과 문구 극성이 반대로 가는 경우가 0.5% 미만이다", () => {
    const mismatched = rows.filter(
      (r) =>
        (r.band === "high" && r.polarity === "negative") ||
        (r.band === "low" && r.polarity === "positive")
    );

    expect(mismatched.length / rows.length).toBeLessThan(MAX_MISMATCH_RATE);
  });

  /**
   * 비율 임계값은 2,256쌍 기준 1쌍이 0.044%p라 해상도가 거칠다.
   * 아래 두 불변식은 **현재 정확히 0건**이라 단 1건만 생겨도 즉시 실패한다.
   * 구조적 악화를 잡는 실질적인 가드는 이쪽이다.
   */
  it("최상위 등급(twin-star)에 부정 문구가 붙는 경우가 0건이다", () => {
    const broken = rows.filter(
      (r) => r.tier === "twin-star" && r.polarity === "negative"
    );

    expect(broken).toHaveLength(0);
  });

  it("하위 등급에 긍정 문구가 붙는 경우가 0건이다", () => {
    const broken = rows.filter(
      (r) => r.band === "low" && r.polarity === "positive"
    );

    expect(broken).toHaveLength(0);
  });

  it("문구 극성이 올라갈수록 평균 점수도 올라간다 (단조성)", () => {
    const meanOf = (polarity: string): number => {
      const scores = rows
        .filter((r) => r.polarity === polarity)
        .map((r) => r.score);
      return scores.reduce((sum, s) => sum + s, 0) / scores.length;
    };

    expect(meanOf("negative")).toBeLessThan(meanOf("neutral"));
    expect(meanOf("neutral")).toBeLessThan(meanOf("positive"));
  });
});
