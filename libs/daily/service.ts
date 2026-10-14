import { logger } from "@/libs/logger";
import { calculateDailyFortune } from "@/libs/zi-wei-dou-shu/calculators/daily-fortune";
import { generateZiweiChart } from "@/libs/zi-wei-dou-shu/core";
import { ZiWeiError } from "@/libs/zi-wei-dou-shu/errors";
import type {
  CalculateDailyFortune,
  DailyDigit,
  DailyFortuneKeys,
} from "@/libs/zi-wei-dou-shu/calculators/daily-fortune-types";
import type {
  DailyCategory,
  DailyLevel,
  DailySlug,
  DailySubCategory,
} from "@/libs/zi-wei-dou-shu/constants/daily-fortune-table";
import type { ZiweiChart, ZiweiInput } from "@/libs/zi-wei-dou-shu/types";

import { resolveDailyCta } from "./cta";
import { DAILY_DICTIONARY_KO } from "./dictionary/ko";
import { DailyError } from "./errors";
import { decodeShareToken } from "./share-token";
import type {
  DailyCategoryResult,
  DailyFortuneView,
  DailyLabelItem,
  DailyTextItem,
} from "./types";

export type DailyDictionary = Readonly<Partial<Record<DailySlug, string>>>;

const SUB_CATEGORY_ORDER: readonly DailySubCategory[] = [
  "love",
  "money",
  "work",
  "health",
];

/**
 * 슬러그 → 문구. 사전에 없으면 임의 문구로 대체하지 않고 서버 에러로 드러낸다.
 * (슬러그↔사전 전수 매칭이 깨졌다는 뜻이므로 사용자에게는 결과 불러오기 실패로 보인다)
 */
export const lookupDailyText = (
  dictionary: DailyDictionary,
  slug: DailySlug
): string => {
  const text = dictionary[slug];

  if (!text) {
    const error = new DailyError(
      "DICTIONARY_MISS",
      "결과를 불러오지 못했어요.",
      { slug }
    );
    logger.error("[daily] 문구 사전에 슬러그가 없습니다", error, { slug });
    throw error;
  }

  return text;
};

/**
 * 엔진 키 → View DTO. 엔진이 내보낸 슬러그/값만 사전으로 해석하며
 * 점수와 문구는 같은 level에서 파생된 키를 그대로 따른다.
 */
export const buildDailyFortuneView = (
  keys: DailyFortuneKeys,
  options: { dictionary?: DailyDictionary; hasLifetime: boolean }
): DailyFortuneView => {
  const { dictionary = DAILY_DICTIONARY_KO, hasLifetime } = options;

  const text = (slug: DailySlug): string => lookupDailyText(dictionary, slug);
  const textItem = (slug: DailySlug): DailyTextItem => ({
    slug,
    text: text(slug),
  });
  const labelItem = (slug: DailySlug): DailyLabelItem => ({
    slug,
    label: text(slug),
  });

  const { categories, keywords, caution } = keys;

  const overall: DailyCategoryResult = {
    category: "overall",
    level: categories.overall.level,
    ...textItem(categories.overall.slug),
  };

  const subCategories: DailyCategoryResult[] = SUB_CATEGORY_ORDER.map(
    (category) => ({
      category,
      level: categories[category].level,
      ...textItem(categories[category].slug),
    })
  );

  const cautionCategory: DailyCategory = caution.category;

  return {
    date: keys.date,
    confidence: keys.confidence,
    headline: textItem(keys.headline),
    overall,
    categories: subCategories,
    variable: keys.variable ? textItem(keys.variable) : null,
    caution: { category: cautionCategory, ...textItem(caution.slug) },
    tip: textItem(keys.tip),
    keywords: {
      color: labelItem(keywords.color),
      item: labelItem(keywords.item),
      number: keywords.number,
      timeSlot: labelItem(keywords.timeSlot),
      reason: textItem(keywords.reason),
    },
    cta: resolveDailyCta({ cautionCategory, hasLifetime }),
  };
};

export interface DailyFortuneInput {
  /** 프로필에서 만든 엔진 입력. 이 객체는 로그·에러 컨텍스트에 남기지 않는다 */
  input: ZiweiInput;
  /** KST 기준 YYYY-MM-DD */
  kstDate: string;
  /** 인생운세 이용 권한 (CTA 분기) */
  hasLifetime: boolean;
}

interface DailyFortuneDeps {
  calculate?: CalculateDailyFortune;
  generateChart?: (input: ZiweiInput) => ZiweiChart;
  dictionary?: DailyDictionary;
}

/**
 * 프로필 입력 → 명반 → 엔진 → 사전 해석 → View DTO.
 * 엔진/명반 의존성은 테스트에서 주입할 수 있다.
 */
export const getDailyFortuneView = (
  { input, kstDate, hasLifetime }: DailyFortuneInput,
  {
    calculate = calculateDailyFortune,
    generateChart = generateZiweiChart,
    dictionary,
  }: DailyFortuneDeps = {}
): DailyFortuneView => {
  let keys: DailyFortuneKeys;

  try {
    keys = calculate(generateChart(input), kstDate);
  } catch (error) {
    if (!(error instanceof ZiWeiError)) {
      throw error;
    }

    // 입력값·명반은 남기지 않고 에러 코드만 기록한다
    const failure = new DailyError(
      "CALCULATION_FAILED",
      "결과를 불러오지 못했어요.",
      { zwCode: error.code, date: kstDate }
    );
    logger.error("[daily] 오늘의 운세 계산 실패", failure);
    throw failure;
  }

  return buildDailyFortuneView(keys, { dictionary, hasLifetime });
};

/** 공유 수신자 화면/OG가 쓰는 카드 내용. 사전 조회 결과만 담는다 */
export interface SharedDailyCard {
  date: string;
  headline: string;
  overallLevel: DailyLevel;
  color: string;
  /** 색 견본 매핑용 슬러그 (공개 카탈로그 값) */
  colorSlug: string;
  item: string;
  number: DailyDigit;
  timeSlot: string;
}

/**
 * 공유 토큰 → 카드 내용.
 * 토큰 검증 실패는 `INVALID_SHARE_TOKEN`, 검증을 통과했는데 사전에 없으면 `DICTIONARY_MISS`다.
 * 쿼리 값은 화면에 직접 출력하지 않고 사전 조회 결과만 돌려준다.
 */
export const getSharedDailyCard = (
  token: unknown,
  todayKst: string,
  dictionary: DailyDictionary = DAILY_DICTIONARY_KO
): SharedDailyCard => {
  const keys = decodeShareToken(token, todayKst);

  return {
    date: keys.date,
    headline: lookupDailyText(dictionary, keys.headline),
    overallLevel: keys.levels.overall,
    color: lookupDailyText(dictionary, keys.color),
    colorSlug: keys.color,
    item: lookupDailyText(dictionary, keys.item),
    number: keys.number,
    timeSlot: lookupDailyText(dictionary, keys.timeSlot),
  };
};
