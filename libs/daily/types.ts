import type {
  DailyCategory,
  DailyConfidence,
  DailyDigit,
  DailyLevel,
} from "@/libs/zi-wei-dou-shu/calculators/daily-fortune-types";

/**
 * 오늘의 운세 View DTO (서버 → 화면/API 경계)
 *
 * 문장은 사전에서 슬러그로 조회한 결과만 담는다. 명반 구조·생년월일시·이름·프로필 ID는
 * 이 DTO에 들어갈 수 없다 (아래 컴파일 타임 가드). 이름은 페이지가 프로필에서 따로 읽어
 * 인사말에만 쓴다.
 */

export interface DailyTextItem {
  slug: string;
  text: string;
}

export interface DailyCategoryResult {
  category: DailyCategory;
  level: DailyLevel;
  slug: string;
  text: string;
}

export interface DailyLabelItem {
  slug: string;
  label: string;
}

/** 유료 CTA 상품. 인생운세 단일, 구매자는 올해운세/궁합 링크로 대체 */
export type DailyCtaProduct = "lifetime" | "yearly_compatibility";

export interface DailyCta {
  /** 분석용 카테고리. 건강 주의 포인트여도 건강으로 두지 않는다 */
  category: Exclude<DailyCategory, "health">;
  product: DailyCtaProduct;
}

export interface DailyFortuneView {
  /** KST 기준 YYYY-MM-DD */
  date: string;
  confidence: DailyConfidence;
  headline: DailyTextItem;
  overall: DailyCategoryResult;
  /** 애정 · 재물 · 일·학업 · 건강 순 */
  categories: DailyCategoryResult[];
  variable: DailyTextItem | null;
  caution: DailyTextItem & { category: DailyCategory };
  tip: DailyTextItem;
  keywords: {
    color: DailyLabelItem;
    item: DailyLabelItem;
    number: DailyDigit;
    timeSlot: DailyLabelItem;
    reason: DailyTextItem;
  };
  cta: DailyCta;
}

// ============================================================
// 개인정보 비노출 컴파일 타임 가드 (엔진 키 가드와 같은 키 집합)
// ============================================================

type DailyViewPersonalDataKey =
  | "id"
  | "userId"
  | "user_id"
  | "profileId"
  | "profile_id"
  | "name"
  | "birthDate"
  | "birth_date"
  | "birthTime"
  | "birth_time"
  | "birthTimeUnknown"
  | "birth_time_unknown"
  | "calendarType"
  | "calendar_type"
  | "isLeapMonth"
  | "is_leap_month"
  | "gender"
  | "chart"
  | "palaces"
  | "stars"
  | "mainStars"
  | "lifePalace"
  | "bodyPalace"
  | "wuxingJu"
  | "sihua"
  | "directionBranch";

type DeepKeys<T> = T extends readonly (infer U)[]
  ? DeepKeys<U>
  : T extends object
    ? {
        [K in keyof T & string]: K | DeepKeys<T[K]>;
      }[keyof T & string]
    : never;

type HasNoPersonalData<T> =
  Extract<DeepKeys<T>, DailyViewPersonalDataKey> extends never ? true : false;

type Assert<T extends true> = T;

export type AssertDailyFortuneViewHasNoPersonalData = Assert<
  HasNoPersonalData<DailyFortuneView>
>;
