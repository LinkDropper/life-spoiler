import { locales } from "@/i18n/config";
import {
  BRIGHTNESS_INFO,
  MINOR_STAR_INFO,
  PALACE_INFO,
  SIHUA_INFO,
  STAR_COMBOS,
  STAR_IN_PALACE,
} from "@/libs/zi-wei-dou-shu/constants/explanations";
import { PALACE_ORDER } from "@/libs/zi-wei-dou-shu/constants/palaces";
import {
  MAIN_STAR_NAMES,
  MINOR_STAR_NAMES,
} from "@/libs/zi-wei-dou-shu/constants/stars";
import { buildPalaceExplanation } from "@/libs/zi-wei-dou-shu/palace-explanation";

import type { BrightnessKey } from "@/libs/zi-wei-dou-shu/constants/explanations";
import type { Palace, StarInfo } from "@/libs/zi-wei-dou-shu/types";

type BranchIndex = Palace["branch"];

// 테스트용 궁 생성 헬퍼
const makePalace = (
  name: string,
  branch: BranchIndex,
  mainStars: StarInfo[] = [],
  minorStars: StarInfo[] = []
): Palace => ({
  name,
  branch,
  stem: 0,
  mainStars,
  minorStars,
  isShenGong: false,
});

const ALL_BRANCHES: BranchIndex[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

describe("해석 상수 완전성", () => {
  it("12궁 × 14주성 = 168개 조합이 ko/en/ja energy·caution을 모두 채운다", () => {
    for (const palace of PALACE_ORDER) {
      const starMap = STAR_IN_PALACE[palace];
      expect(starMap).toBeDefined();
      for (const star of MAIN_STAR_NAMES) {
        const entry = starMap[star];
        expect(entry).toBeDefined();
        for (const locale of locales) {
          expect(entry.energy[locale].trim().length).toBeGreaterThan(0);
          expect(entry.caution[locale].trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("모든 궁이 일반어 title·meaning을 ko/en/ja로 갖는다", () => {
    for (const palace of PALACE_ORDER) {
      const info = PALACE_INFO[palace];
      expect(info).toBeDefined();
      for (const locale of locales) {
        expect(info.title[locale].trim().length).toBeGreaterThan(0);
        expect(info.meaning[locale].trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("16개 보조성이 group·keyword·note(ko/en/ja)를 갖는다", () => {
    for (const star of MINOR_STAR_NAMES) {
      const entry = MINOR_STAR_INFO[star];
      expect(entry).toBeDefined();
      expect(["helper", "challenger", "mobile"]).toContain(entry.group);
      for (const locale of locales) {
        expect(entry.keyword[locale].trim().length).toBeGreaterThan(0);
        expect(entry.note[locale].trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("6단계 밝기 · 4종 사화가 ko/en/ja phrase를 갖는다", () => {
    const brightnessKeys: BrightnessKey[] = [
      "묘",
      "왕",
      "득",
      "리",
      "평",
      "함",
    ];
    for (const key of brightnessKeys) {
      for (const locale of locales) {
        expect(
          BRIGHTNESS_INFO[key].phrase[locale].trim().length
        ).toBeGreaterThan(0);
      }
    }
    for (const key of ["화록", "화권", "화과", "화기"] as const) {
      for (const locale of locales) {
        expect(SIHUA_INFO[key].phrase[locale].trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("모든 동궁 조합 노트가 ko/en/ja로 채워져 있다", () => {
    const keys = Object.keys(STAR_COMBOS);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      for (const locale of locales) {
        expect(STAR_COMBOS[key].note[locale].trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe("buildPalaceExplanation — 하나의 조합으로 합성", () => {
  it("단일 주성: 그 궁의 풀이를 핵심으로 + 밝기(묘)를 reading에 녹인다", () => {
    const palace = makePalace("재백궁", 0, [
      { name: "무곡", brightness: "묘" },
    ]);
    const result = buildPalaceExplanation(palace, [palace], "ko");

    expect(result).not.toBeNull();
    expect(result!.isEmpty).toBe(false);
    expect(result!.stars).toHaveLength(1);
    expect(result!.stars[0]).toMatchObject({ name: "무곡", isMain: true });
    // 핵심 = 그 궁의 무곡 풀이
    expect(result!.reading).toContain(
      STAR_IN_PALACE["재백궁"]["무곡"].energy.ko
    );
    // 묘 밝기가 reading에 합쳐짐
    expect(result!.reading).toContain(BRIGHTNESS_INFO["묘"].phrase.ko);
    // 단독 주성의 주의가 caution에
    expect(result!.caution).toContain(
      STAR_IN_PALACE["재백궁"]["무곡"].caution.ko
    );
  });

  it("두 주성 동궁: 각각이 아니라 '합쳐진' 동궁 풀이 하나만 핵심으로 쓴다", () => {
    const palace = makePalace("재백궁", 0, [
      { name: "무곡", brightness: "득" },
      { name: "천부", brightness: "득" },
    ]);
    const result = buildPalaceExplanation(palace, [palace], "ko");

    // 동궁 노트가 핵심
    expect(result!.reading).toContain(STAR_COMBOS["무곡+천부"].note.ko);
    // 무곡 단독 풀이를 따로 나열하지 않는다
    expect(result!.reading).not.toContain(
      STAR_IN_PALACE["재백궁"]["무곡"].energy.ko
    );
    expect(result!.reading).not.toContain(
      STAR_IN_PALACE["재백궁"]["천부"].energy.ko
    );
    expect(result!.stars).toHaveLength(2);
  });

  it("동궁 노트는 별 순서와 무관하게 찾는다", () => {
    const p1 = makePalace("관록궁", 0, [
      { name: "무곡", brightness: "득" },
      { name: "파군", brightness: "득" },
    ]);
    const p2 = makePalace("관록궁", 0, [
      { name: "파군", brightness: "득" },
      { name: "무곡", brightness: "득" },
    ]);
    const r1 = buildPalaceExplanation(p1, [p1], "ko");
    const r2 = buildPalaceExplanation(p2, [p2], "ko");
    expect(r1!.reading).toContain(STAR_COMBOS["무곡+파군"].note.ko);
    expect(r2!.reading).toContain(STAR_COMBOS["무곡+파군"].note.ko);
  });

  it("무곡+파군+영성+타라: 4별을 각각 설명하지 않고 조합 풀이 + 살성 영향을 한 덩어리로", () => {
    const palace = makePalace(
      "재백궁",
      0,
      [
        { name: "무곡", brightness: "묘" },
        { name: "파군", brightness: "득" },
      ],
      [
        { name: "영성", brightness: "평" },
        { name: "타라", brightness: "평" },
      ]
    );
    const result = buildPalaceExplanation(palace, [palace], "ko");

    // 핵심 = 무곡+파군 합쳐진 풀이 (각각 X)
    expect(result!.reading).toContain(STAR_COMBOS["무곡+파군"].note.ko);
    // 살성은 개별 설명이 아니라 묶여서 caution 한 절로
    expect(result!.caution).toContain(MINOR_STAR_INFO["영성"].keyword.ko);
    expect(result!.caution).toContain(MINOR_STAR_INFO["타라"].keyword.ko);
    // 영성/타라의 개별 note 문장은 본문에 등장하지 않는다
    expect(result!.reading).not.toContain(MINOR_STAR_INFO["영성"].note.ko);
    expect(result!.caution).not.toContain(MINOR_STAR_INFO["타라"].note.ko);
    // 별 칩은 4개
    expect(result!.stars).toHaveLength(4);
  });

  it("길성 보조성은 받쳐주는 한 절로 reading에 녹는다", () => {
    const palace = makePalace(
      "재백궁",
      0,
      [{ name: "천부", brightness: "득" }],
      [{ name: "좌보", brightness: "묘" }]
    );
    const result = buildPalaceExplanation(palace, [palace], "ko");
    expect(result!.reading).toContain(MINOR_STAR_INFO["좌보"].keyword.ko);
  });

  it("사화(화록)는 reading에, 화기는 caution에 녹는다", () => {
    const palace = makePalace("명궁", 6, [
      { name: "자미", brightness: "왕", sihua: "화록" },
    ]);
    const result = buildPalaceExplanation(palace, [palace], "ko");
    expect(result!.reading).toContain(SIHUA_INFO["화록"].phrase.ko);
  });

  it("빈 궁(주성 0): isEmpty=true, 대궁 라벨이 reading에, 칩은 보조성만", () => {
    const empty = makePalace(
      "형제궁",
      0,
      [],
      [{ name: "좌보", brightness: "묘" }]
    );
    const opposite = makePalace("천이궁", 6, [
      { name: "태양", brightness: "왕" },
    ]);
    const result = buildPalaceExplanation(empty, [empty, opposite], "ko");

    expect(result!.isEmpty).toBe(true);
    expect(result!.reading).toContain(PALACE_INFO["천이궁"].title.ko);
    expect(result!.stars).toHaveLength(1);
    expect(result!.stars[0].isMain).toBe(false);
  });

  it("잘못된 궁 이름은 null", () => {
    const bad = makePalace("없는궁", 0, []);
    expect(buildPalaceExplanation(bad, [bad], "ko")).toBeNull();
  });

  it("모든 궁·언어 조합에서 예외 없이 합성한다 (스모크)", () => {
    for (let i = 0; i < PALACE_ORDER.length; i++) {
      const palace = makePalace(PALACE_ORDER[i], ALL_BRANCHES[i], [
        { name: MAIN_STAR_NAMES[i % MAIN_STAR_NAMES.length], brightness: "득" },
      ]);
      for (const locale of locales) {
        const result = buildPalaceExplanation(palace, [palace], locale);
        expect(result).not.toBeNull();
        expect(result!.reading.length).toBeGreaterThan(0);
      }
    }
  });
});
