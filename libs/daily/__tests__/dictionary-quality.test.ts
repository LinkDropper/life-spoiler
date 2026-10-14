import { calculateDailyFortune } from "@/libs/zi-wei-dou-shu/calculators/daily-fortune";
import {
  ALL_DAILY_SLUGS,
  DAILY_SLOT_IDS,
  DAILY_SLOTS,
  getDailySlotOf,
} from "@/libs/zi-wei-dou-shu/constants/daily-fortune-table";
import { generateZiweiChart } from "@/libs/zi-wei-dou-shu/core";
import type {
  DailySlotId,
  DailySlug,
} from "@/libs/zi-wei-dou-shu/constants/daily-fortune-table";
import type { ZiweiInput } from "@/libs/zi-wei-dou-shu/types";

import { DAILY_DICTIONARY_KO } from "../dictionary/ko";
import { buildDailyFortuneView } from "../service";

/**
 * 오늘의 운세 KO 사전 품질 테스트 (3단계)
 *
 * 선례: owner-one-liner.test.ts / friend-compatibility.test.ts의 종결 어미 분포 검사
 * (끝 2글자 집계). 사전 문구는 코드로 고정되므로 금지어·길이·어미 분포를 여기서 잠근다.
 */

const dictionary = DAILY_DICTIONARY_KO as Record<string, string>;

const slotOf = (slug: string): DailySlotId => {
  const slot = getDailySlotOf(slug);
  if (!slot) {
    throw new Error(`카탈로그에 없는 슬러그: ${slug}`);
  }
  return slot;
};

const entriesOf = (slot: DailySlotId): [string, string][] =>
  (DAILY_SLOTS[slot].slugs as readonly DailySlug[]).map(
    (slug) => [slug, dictionary[slug]] as [string, string]
  );

// ============================================================
// 금지 사전
// ============================================================

/** brand-voice.md 금지 표현 + 과장·보장 표현 */
const BRAND_BANNED = [
  "뼈 때리",
  "소름",
  "충격",
  "대박",
  "인생역전",
  "운명을 바꿔",
  "럭키",
  "적중",
  "100%",
  "99%",
  "무조건",
  "대길",
  "반드시",
  "틀림없",
  "확실히",
];

/** 느낌표·물음표 연속 */
const REPEATED_PUNCT = /[!?]{2,}/;

/** 이모지·픽토그램 (변형 선택자 포함) */
const EMOJI = /[\p{Extended_Pictographic}️]/u;

/** 의료 어휘 (생활 습관 수준 밖) */
const MEDICAL_WORDS = [
  "진단",
  "치료",
  "처방",
  "증상",
  "질병",
  "병원",
  "수술",
  "통증",
  "복용",
  "약물",
  "영양제",
];
/** "약"은 "약속/절약/약간"과 구분하기 위해 단어 경계로 검사한다 */
const MEDICINE_WORD = /(?<![가-힣])약(?:을|은|이|도|으로)?(?![가-힣])/;

/** 투자·도박 어휘 */
const INVESTMENT_WORDS = [
  "주식",
  "코인",
  "로또",
  "복권",
  "매수",
  "매도",
  "투자",
  "수익",
  "배당",
  "도박",
  "베팅",
  "펀드",
];

/** 법률 단정 어휘 */
const LEGAL_WORDS = ["소송", "고소", "계약 위반", "법적", "위법", "변호사"];

/** 사건 단정·확정 서술 */
const EVENT_ASSERTION_WORDS = [
  "사고가",
  "사고를",
  "헤어지",
  "헤어져",
  "이별",
  "잃어",
  "잃게",
  "잃습",
  "다치",
  "부상",
  "싸우게",
  "깨져요",
  "이혼",
  "해고",
  "실직",
  "도난",
  "손해를",
];
const EVENT_ASSERTION_PATTERNS = [
  /게 (?:됩니다|돼요|될 거)/,
  /거예요/,
  /것입니다/,
];

/** 전문 용어 (표면 문구 노출 금지) */
const JARGON_WORDS = [
  // 14주성
  "자미",
  "천기",
  "태양",
  "무곡",
  "천동",
  "염정",
  "천부",
  "태음",
  "탐랑",
  "거문",
  "천상",
  "천량",
  "칠살",
  "파군",
  // 12궁
  "명궁",
  "형제궁",
  "부처궁",
  "자녀궁",
  "재백궁",
  "질액궁",
  "천이궁",
  "노복궁",
  "관록궁",
  "전택궁",
  "복덕궁",
  "부모궁",
  // 오행국·오행·사화·기타 용어
  "수이국",
  "목삼국",
  "금사국",
  "토오국",
  "화육국",
  "오행",
  "사화",
  "화록",
  "화권",
  "화과",
  "화기",
  "일진",
  "천간",
  "시진",
  "명반",
  "대운",
  "삼방",
  "자미두수",
];
/** 오행 한자·한자 일반 */
/** "지지"는 "흐트러지지 않아요"와 구분하기 위해 조사가 붙은 단독 어휘만 검사한다 */
const BRANCH_WORD = /(?<![가-힣])지지(?:가|를|는|의|에)(?![가-힣])/;
const HANJA = /[一-鿿]/;
/** 별(星)을 가리키는 단독 어휘 */
const STAR_WORD = /(?<![가-힣])별(?:이|을|은|의|도|들)?(?![가-힣])/;

const findBanned = (text: string, words: readonly string[]): string[] =>
  words.filter((word) => text.includes(word));

// ============================================================
// 어미 분포 (선례와 같은 방식: 끝 2글자)
// ============================================================

const MAX_ENDING_SHARE = 0.25;
const MIN_ENDING_VARIETY = 10;

const grammarEnding = (text: string): string =>
  text.replace(/[.!?]+$/, "").slice(-2);

const countEndings = (texts: readonly string[]): Map<string, number> => {
  const counts = new Map<string, number>();
  texts.forEach((text) => {
    const ending = grammarEnding(text);
    counts.set(ending, (counts.get(ending) ?? 0) + 1);
  });
  return counts;
};

/** 슬롯별 최대 문장 수 (스펙: 본문 슬롯만 2문장 허용) */
const MAX_SENTENCES: Record<DailySlotId, number> = {
  hl: 1,
  hx: 1,
  ob: 2,
  cb: 2,
  vr: 1,
  ca: 2,
  tp: 1,
  kc: 1,
  ki: 1,
  kt: 1,
  kr: 1,
};

const countSentences = (text: string): number =>
  text.split(/[.?]/).filter((part) => part.trim().length > 0).length;

describe("오늘의 운세 KO 사전 품질", () => {
  describe("슬러그 전수 매칭", () => {
    it("카탈로그의 모든 슬러그에 비어 있지 않은 문구가 있다", () => {
      const missing = ALL_DAILY_SLUGS.filter(
        (slug) => !dictionary[slug] || dictionary[slug].trim().length === 0
      );
      expect(missing).toEqual([]);
    });

    it("사전에 카탈로그 밖 키가 없다", () => {
      const known = new Set<string>(ALL_DAILY_SLUGS);
      const unknown = Object.keys(dictionary).filter((key) => !known.has(key));
      expect(unknown).toEqual([]);
      expect(Object.keys(dictionary)).toHaveLength(ALL_DAILY_SLUGS.length);
    });
  });

  describe.each(DAILY_SLOT_IDS)("슬롯 %s", (slot) => {
    const entries = entriesOf(slot);
    const { maxChars, kind } = DAILY_SLOTS[slot];

    it(`모든 문구가 ${maxChars}자 이하다`, () => {
      const over = entries.filter(([, text]) => text.length > maxChars);
      expect(over).toEqual([]);
    });

    it("슬롯 안에 완전히 같은 문구가 없다", () => {
      const texts = entries.map(([, text]) => text);
      expect(new Set(texts).size).toBe(texts.length);
    });

    it("앞뒤 공백·줄바꿈이 없다", () => {
      const dirty = entries.filter(([, text]) => text !== text.trim());
      expect(dirty).toEqual([]);
      expect(entries.filter(([, text]) => /\n/.test(text))).toEqual([]);
    });

    it(`문장 수가 ${MAX_SENTENCES[slot]}개 이하다`, () => {
      const over = entries.filter(
        ([, text]) => countSentences(text) > MAX_SENTENCES[slot]
      );
      expect(over).toEqual([]);
    });

    if (kind === "sentence") {
      it("존댓말 완결 문장(~요/~습니다)으로 끝난다", () => {
        const bad = entries.filter(
          ([, text]) => !/(?:요|니다|죠)[.?]$/.test(text.trim())
        );
        expect(bad).toEqual([]);
      });

      it("문장 중간이 마침표로 끝나는 문장도 모두 존댓말이다", () => {
        const bad = entries.filter(([, text]) =>
          text
            .split(/(?<=[.?])\s+/)
            .some((sentence) => !/(?:요|니다|죠)[.?]$/.test(sentence))
        );
        expect(bad).toEqual([]);
      });

      it(`최빈 종결 어미 비율이 ${MAX_ENDING_SHARE * 100}% 이하이고 ${MIN_ENDING_VARIETY}종 이상이다`, () => {
        const counts = countEndings(entries.map(([, text]) => text));
        expect(counts.size).toBeGreaterThanOrEqual(MIN_ENDING_VARIETY);
        expect(
          Math.max(...counts.values()) / entries.length
        ).toBeLessThanOrEqual(MAX_ENDING_SHARE);
      });
    } else {
      it("라벨 슬롯은 마침표 없는 명사구다", () => {
        const bad = entries.filter(([, text]) => /[.?!]/.test(text));
        expect(bad).toEqual([]);
      });
    }
  });

  describe("금지 표현", () => {
    const allEntries = ALL_DAILY_SLUGS.map(
      (slug) => [slug, dictionary[slug] ?? ""] as [string, string]
    );

    const expectNone = (find: (text: string) => string[]): void => {
      const hits = allEntries
        .map(([slug, text]) => ({ slug, hits: find(text) }))
        .filter(({ hits: found }) => found.length > 0);
      expect(hits).toEqual([]);
    };

    it("브랜드 금지 표현과 과장·보장 표현이 없다", () => {
      expectNone((text) => findBanned(text, BRAND_BANNED));
    });

    it("느낌표·물음표 연속과 이모지가 없다", () => {
      expectNone((text) => [
        ...(REPEATED_PUNCT.test(text) ? ["repeated-punct"] : []),
        ...(EMOJI.test(text) ? ["emoji"] : []),
      ]);
    });

    it("느낌표가 하나도 없다 (담백한 톤)", () => {
      expectNone((text) => (text.includes("!") ? ["!"] : []));
    });

    it("물음표는 전체 사전에서 최대 2개다", () => {
      const count = allEntries.filter(([, text]) => text.includes("?")).length;
      expect(count).toBeLessThanOrEqual(2);
    });

    it("의료 어휘가 없다", () => {
      expectNone((text) => [
        ...findBanned(text, MEDICAL_WORDS),
        ...(MEDICINE_WORD.test(text) ? ["약"] : []),
      ]);
    });

    it("투자·도박 어휘가 없다", () => {
      expectNone((text) => findBanned(text, INVESTMENT_WORDS));
    });

    it("법률 단정 어휘가 없다", () => {
      expectNone((text) => findBanned(text, LEGAL_WORDS));
    });

    it("사건 단정·확정 서술이 없다", () => {
      expectNone((text) => [
        ...findBanned(text, EVENT_ASSERTION_WORDS),
        ...EVENT_ASSERTION_PATTERNS.filter((p) => p.test(text)).map(String),
      ]);
    });

    it("자미두수 전문 용어와 한자가 표면 문구에 노출되지 않는다", () => {
      expectNone((text) => [
        ...findBanned(text, JARGON_WORDS),
        ...(HANJA.test(text) ? ["hanja"] : []),
        ...(BRANCH_WORD.test(text) ? ["지지"] : []),
        ...(STAR_WORD.test(text) ? ["별"] : []),
      ]);
    });
  });

  describe("3단계 사람 검수 결과 고정", () => {
    const allEntries = ALL_DAILY_SLUGS.map(
      (slug) => [slug, dictionary[slug] ?? ""] as [string, string]
    );
    const countOf = (word: string): number =>
      allEntries.filter(([, text]) => text.includes(word)).length;

    it("물음표가 하나도 없다 (평서문 원칙)", () => {
      expect(allEntries.filter(([, text]) => text.includes("?"))).toEqual([]);
    });

    it("'기운'은 오행 용어처럼 읽히므로 어느 슬롯에도 쓰지 않는다", () => {
      expect(allEntries.filter(([, text]) => text.includes("기운"))).toEqual(
        []
      );
    });

    it("소품 라벨이 상품 추천처럼 읽히지 않는다", () => {
      const bad = entriesOf("ki").filter(([, text]) =>
        /향 좋은|손난로|구매|쇼핑|신상/.test(text)
      );
      expect(bad).toEqual([]);
    });

    it("반복 어휘가 전체 사전에서 상한을 넘지 않는다", () => {
      expect(countOf("한 번 더")).toBeLessThanOrEqual(8);
      expect(countOf("한결")).toBeLessThanOrEqual(6);
      expect(countOf("보세요")).toBeLessThanOrEqual(30);
      expect(countOf("날이에요")).toBeLessThanOrEqual(40);
      expect(countOf("오늘은")).toBeLessThanOrEqual(18);
    });

    it("hl은 총운 level과 독립이므로 브레이크 톤 문구(늦추고/쉬어/묵혀)를 쓰지 않는다", () => {
      const bad = entriesOf("hl").filter(([, text]) =>
        /늦추|한 박자|쉬어|묵혀|멈추고/.test(text)
      );
      expect(bad).toEqual([]);
    });

    it("tp 문구의 시간대 소재가 일진 지지의 시간대와 모순되지 않는다", () => {
      const FORBIDDEN: Record<string, RegExp> = {
        ja: /오전|점심|오후|출근|퇴근|저녁/,
        chuk: /아침|오전|점심|오후|출근|퇴근|저녁/,
        in: /점심|오후|퇴근|저녁|밤/,
        myo: /점심|오후|퇴근|저녁|밤/,
        jin: /점심|오후|퇴근|저녁|밤/,
        sa: /점심|오후|퇴근|저녁|밤/,
        o: /아침|퇴근|저녁|밤/,
        mi: /아침|출근|저녁|밤|오전/,
        sin: /아침|출근|밤|오전/,
        yu: /아침|오전|점심|출근/,
        sul: /아침|오전|점심|출근|오후/,
        hae: /아침|오전|점심|오후|출근|퇴근/,
      };
      const bad = entriesOf("tp").filter(([slug, text]) => {
        const [, , branch] = slug.split("-");
        return FORBIDDEN[branch]?.test(text);
      });
      expect(bad).toEqual([]);
    });
  });

  describe("건강 슬롯 (L1 주의 포인트는 생활 습관 제안만)", () => {
    const healthEntries = ALL_DAILY_SLUGS.filter((slug) =>
      slug.includes("health")
    ).map((slug) => [slug, dictionary[slug] ?? ""] as [string, string]);
    const warnEntries = healthEntries.filter(([slug]) =>
      /^df-(?:ca-health|cb-health-l[12]|vr-gi-health)/.test(slug)
    );

    it("건강 슬롯이 비어 있지 않고 대상 슬러그를 잡는다", () => {
      expect(healthEntries.length).toBeGreaterThanOrEqual(40);
      expect(warnEntries.length).toBe(24);
    });

    it("증상·질병·부상 어휘가 없다", () => {
      const SYMPTOM =
        /아프|아파|통증|두통|감기|몸살|위염|다치|피로|탈(?![가-힣])|탈이|탈나|쑤시|결리/;
      const hits = healthEntries.filter(([, text]) => SYMPTOM.test(text));
      expect(hits).toEqual([]);
    });

    it("몸 상태 단정·추측과 불안 조장 표현이 없다", () => {
      const ASSERT =
        /쌓였|쌓여|지쳤|지친|무거워|무겁게|출렁|떨어질|조심하지|무리하면|않으면|수 있어요|수 있습니다|무리/;
      const hits = warnEntries.filter(([, text]) => ASSERT.test(text));
      expect(hits).toEqual([]);
    });

    it("L1·주의 슬롯은 행동 제안 어미로 끝나거나 습관 소재를 담는다", () => {
      const TOPIC =
        /수면|잠|불을 끄|물|카페인|차를|화면|스마트폰|스트레칭|호흡|숨|걷|걸|산책|식사|끼니|쉬|휴식|눈|어깨|저녁/;
      const hits = warnEntries.filter(([, text]) => !TOPIC.test(text));
      expect(hits).toEqual([]);
    });
  });

  describe("한 화면 단위 샘플 (명반 × 날짜 200건)", () => {
    // 시드 고정 PRNG(mulberry32). 엔진이 바뀌면 이 수치도 다시 확인해야 한다.
    const SAMPLE_COUNT = 200;
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

    const buildScreens = (seed: number): string[][] => {
      const rng = createRng(seed);
      return Array.from({ length: SAMPLE_COUNT }, () => {
        const year = 1950 + Math.floor(rng() * 61);
        const month = 1 + Math.floor(rng() * 12);
        const day = 1 + Math.floor(rng() * 28);
        const unknown = rng() < 0.2;
        const birthTime = unknown
          ? "unknown"
          : `${pad(Math.floor(rng() * 24))}:${pad(Math.floor(rng() * 60))}`;
        const chart = generateZiweiChart({
          name: "sample",
          birthDate: `${year}-${pad(month)}-${pad(day)}`,
          birthTime,
          gender: rng() < 0.5 ? "male" : "female",
          calendarType: "solar",
        } as ZiweiInput);
        const date = `2026-${pad(1 + Math.floor(rng() * 12))}-${pad(
          1 + Math.floor(rng() * 28)
        )}`;
        const view = buildDailyFortuneView(calculateDailyFortune(chart, date), {
          hasLifetime: false,
        });
        return [
          view.headline.text,
          view.overall.text,
          ...view.categories.map((category) => category.text),
          ...(view.variable ? [view.variable.text] : []),
          view.caution.text,
          view.tip.text,
          view.keywords.reason.text,
        ];
      });
    };

    const lastSentence = (text: string): string =>
      text.split(/(?<=[.?])\s+/).pop() ?? text;

    const screens = buildScreens(7);

    it("어미(끝 2글자)가 3연속 같은 화면이 8% 이하다", () => {
      const repeated = screens.filter((screen) => {
        const endings = screen.map((text) => grammarEnding(lastSentence(text)));
        return endings.some(
          (ending, i) =>
            i >= 2 && ending === endings[i - 1] && ending === endings[i - 2]
        );
      });
      expect(repeated.length / SAMPLE_COUNT).toBeLessThanOrEqual(0.08);
    });

    it("'한 번 더/한결/보세요'가 한 화면에 2회 이상 나오는 화면이 10% 이하다", () => {
      const words = ["한 번 더", "한결", "보세요"];
      const repeated = screens.filter((screen) => {
        const joined = screen.join(" ");
        return words.some((word) => joined.split(word).length - 1 >= 2);
      });
      expect(repeated.length / SAMPLE_COUNT).toBeLessThanOrEqual(0.1);
    });
  });

  describe("금지어 검사기 자체", () => {
    it("'약속/절약'은 통과시키고 약 복용 표현은 잡는다", () => {
      expect(MEDICINE_WORD.test("약속을 지켜요")).toBe(false);
      expect(MEDICINE_WORD.test("절약 방법")).toBe(false);
      expect(MEDICINE_WORD.test("약을 먹어요")).toBe(true);
      expect(MEDICINE_WORD.test("약 챙기세요")).toBe(true);
    });

    it("어미 집계가 끝 2글자를 센다", () => {
      expect(grammarEnding("편안해져요.")).toBe("져요");
      expect(grammarEnding("좋습니다.")).toBe("니다");
    });
  });

  describe("라벨 슬롯 형식", () => {
    it("시간대 라벨이 가이드의 2시간 구간 표기와 같다", () => {
      expect(dictionary["df-kt-ja"]).toBe("밤 11시~새벽 1시");
      expect(dictionary["df-kt-sin"]).toBe("오후 3시~5시");
      entriesOf("kt").forEach(([slug, text]) => {
        expect(slotOf(slug)).toBe("kt");
        expect(text).toMatch(/\d+시~(?:오전 |오후 |새벽 |밤 )?\d+시$/);
      });
    });

    it("색 라벨은 '~색' 이름만 쓴다", () => {
      entriesOf("kc").forEach(([, text]) => {
        expect(text).toMatch(/색$/);
      });
    });
  });
});
