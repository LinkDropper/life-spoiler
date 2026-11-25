import { calculateDayun } from "@/libs/zi-wei-dou-shu/calculators/dayun";
import { buildLoveFactSheet } from "@/libs/zi-wei-dou-shu/calculators/love-fortune-facts";
import {
  LOVE_PERSON_CUES,
  LOVE_SELF_CUES,
} from "@/libs/zi-wei-dou-shu/constants/lifetime-facts/love-section-cues";
import { MAIN_STAR_NAMES } from "@/libs/zi-wei-dou-shu/constants/stars";
import { generateZiweiChart } from "@/libs/zi-wei-dou-shu/core";
import type { ZiweiInput } from "@/libs/zi-wei-dou-shu/types";

import { findOutputViolations } from "../output-validator";
import {
  formatGuestKo,
  formatPeachKo,
  formatSomeKo,
} from "../love-fact-format";
import type { LoveGuest } from "../love-fact-format";
import { loveValidatorFor } from "../love-interpreter";

const INPUT = {
  name: "t",
  birthDate: "2003-08-08",
  birthTime: "16:40",
  gender: "male",
  calendarType: "solar",
} as ZiweiInput;

const GUEST: LoveGuest = {
  gender: "male",
  age: 23,
  relationshipStatus: "solo",
  currentYear: 2026,
};

const sheetOf = () => {
  const chart = generateZiweiChart(INPUT);
  return buildLoveFactSheet(chart, {
    birthYear: 2003,
    currentYear: 2026,
    dayun: calculateDayun(chart),
  });
};

describe("buildLoveFactSheet", () => {
  it("같은 명반이면 같은 라벨·좌표·시즌을 낸다", () => {
    const a = sheetOf();
    const b = sheetOf();
    expect(a.label).toBe(b.label);
    expect(a.quadrant).toEqual(b.quadrant);
    expect(a.seasons).toEqual(b.seasons);
  });

  it("세 축 점수는 0~100 사이다", () => {
    const sheet = sheetOf();
    for (const axis of [sheet.speed, sheet.expression, sheet.skinship]) {
      expect(axis.score).toBeGreaterThanOrEqual(0);
      expect(axis.score).toBeLessThanOrEqual(100);
    }
  });
});

describe("연애 운세 재료 (LLM 입력)", () => {
  it("장면 단서 표에 별·궁 이름이 없다", () => {
    for (const star of MAIN_STAR_NAMES) {
      const material = {
        self: LOVE_SELF_CUES[star],
        person: LOVE_PERSON_CUES[star],
      };
      expect(findOutputViolations(material, "ko")).toEqual([]);
    }
  });

  it("손님 정보는 나이대로 넘기고 직업·올해는 넘기지 않는다", () => {
    const text = formatGuestKo(GUEST);
    expect(text).toContain("20대 초반");
    expect(text).not.toMatch(/만 \d+세|지금 하는 일|올해/);
  });

  it("썸 재료에 마무리 한 줄 방향이 있다", () => {
    expect(formatSomeKo(sheetOf())).toContain("마무리 한 줄 방향");
  });

  it("설렘 재료에 학교·직장 단어가 없다", () => {
    expect(formatPeachKo(sheetOf())).not.toMatch(/학교|회사|직장|동아리/);
  });
});

describe("loveValidatorFor", () => {
  it("손님·당신 지칭, 나이 옮겨 적기, 직업 가정을 잡는다", () => {
    const output = {
      a: "손님은 먼저 다가가요.",
      b: "만 24세가 되면 바빠져요.",
      c: "퇴근하고 집에 와서 연락해요.",
    };
    expect(
      findOutputViolations(output, "ko", loveValidatorFor()).map((v) => v.code)
    ).toEqual(["THIRD_PERSON", "CONTEXT_MISMATCH", "CONTEXT_MISMATCH"]);
  });

  it("캐릭터 이름 속 '읽는 사람'은 잡지 않는다", () => {
    const output = { a: "답장 한 줄을 세 번 다시 읽는 사람이에요." };
    expect(findOutputViolations(output, "ko", loveValidatorFor())).toEqual([]);
  });
});
