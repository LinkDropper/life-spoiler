import type {
  CategoryBodySlug,
  CautionSlug,
  ColorSlug,
  DailyCategory,
  DailyConfidence,
  DailyLevel,
  DailySubCategory,
  EstimatedHeadlineSlug,
  HeadlineSlug,
  ItemSlug,
  OverallBodySlug,
  ReasonSlug,
  TimeSlotSlug,
  TipSlug,
  VariableSlug,
} from "../constants/daily-fortune-table";
import type { BranchIndex, ZiweiChart } from "../types";

/**
 * 오늘의 운세(Daily Fortune) — 엔진 출력 계약
 *
 * `calculateDailyFortune(chart, kstDate)`의 출력은 **문장이 아니라 슬러그와 값**이다.
 * 문장은 `libs/daily/dictionary/ko.ts`가 슬러그로 조회한다.
 *
 * @개인정보_경계
 * 출력에는 명반 구조·생년월일시·이름·프로필 ID가 들어갈 수 없다. 아래 컴파일 타임 가드가
 * 이런 키가 (중첩 포함) 추가되는 순간 빌드를 깨뜨린다 (`libs/universe/types.ts` 선례).
 * 공유 토큰에는 `directionBranch`를 포함하지 않는다 (명반에서 파생되는 값이며 화면 미사용).
 *
 * @순수성 같은 chart + 같은 kstDate + 같은 사전 버전 = 같은 출력.
 */

export type {
  DailyCategory,
  DailyConfidence,
  DailyLevel,
} from "../constants/daily-fortune-table";

/** 카테고리별 본문 키: level과 본문 슬러그는 같은 level에서 파생된다 (PRD 규칙 6) */
export interface DailyOverallKey {
  level: DailyLevel;
  slug: OverallBodySlug;
}

export interface DailySubCategoryKey<C extends DailySubCategory> {
  level: DailyLevel;
  slug: Extract<CategoryBodySlug, `df-cb-${C}-${string}`>;
}

/** 주의 포인트: category와 slug의 카테고리가 항상 일치하도록 판별 유니온으로 둔다 */
export type DailyCautionKey = {
  [C in DailyCategory]: {
    category: C;
    slug: Extract<CautionSlug, `df-ca-${C}-${string}`>;
  };
}[DailyCategory];

/** 예고 키워드 숫자 (한 자리, 1~9. 복권 번호 연상 방지로 단일 숫자만) */
export type DailyDigit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface DailyKeywordKeys {
  /** 색 이름 라벨 슬러그 (이름 텍스트 병기 필수) */
  color: ColorSlug;
  /** 소품 라벨 슬러그 */
  item: ItemSlug;
  /** 한 자리 숫자 (생수/성수 중 날짜 해시로 선택) */
  number: DailyDigit;
  /** 시간대 라벨 슬러그 (일간 화록이 앉은 궁의 지지 기준) */
  timeSlot: TimeSlotSlug;
  /** 색·소품이 도움이 되는 이유 (일반어, 전문 용어 없음) */
  reason: ReasonSlug;
  /**
   * 방향용 지지 인덱스. Phase 2용으로 산출만 하고 화면·공유 토큰에는 쓰지 않는다.
   */
  directionBranch: BranchIndex;
}

export interface DailyFortuneKeys {
  /** KST 기준 날짜 YYYY-MM-DD */
  date: string;
  /** exact: 시간 확정 / estimated: 시간 미상(12시진 평균 × 0.6 수축) */
  confidence: DailyConfidence;
  /**
   * 오늘의 한 줄. exact면 `df-hl-*`, estimated면 `df-hx-*`.
   * (공유 카드의 중심 문구)
   */
  headline: HeadlineSlug | EstimatedHeadlineSlug;
  /** 총운 + 4개 카테고리. 문구·별 개수·등급명은 모두 같은 level에서 파생한다 */
  categories: {
    overall: DailyOverallKey;
    love: DailySubCategoryKey<"love">;
    money: DailySubCategoryKey<"money">;
    work: DailySubCategoryKey<"work">;
    health: DailySubCategoryKey<"health">;
  };
  /** 일간 사화 변수 문장. 해당 신호가 없으면 null */
  variable: VariableSlug | null;
  /** 가장 낮은 카테고리 기준 주의 포인트 (총운 포함 가능) */
  caution: DailyCautionKey;
  tip: TipSlug;
  keywords: DailyKeywordKeys;
}

/**
 * 엔진 진입점 시그니처 (구현은 1단계: `calculators/daily-fortune.ts`).
 *
 * @param chart 본인 명반. 시간 미상이면 `ZiweiChart`의 시간 미상 표현을 따른다
 *              (12시진 평균은 엔진 내부에서 처리, 호출자는 신경 쓰지 않는다).
 * @param kstDate KST 기준 `YYYY-MM-DD`. 서버 UTC → KST 변환은 호출자(`libs/daily/service.ts`) 책임.
 */
export type CalculateDailyFortune = (
  chart: ZiweiChart,
  kstDate: string
) => DailyFortuneKeys;

// ============================================================
// 개인정보 비노출 컴파일 타임 가드
// ============================================================

/** DailyFortuneKeys 어디에도(중첩 포함) 등장하면 안 되는 키 */
type DailyPersonalDataKey =
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
  | "sihua";

type DeepKeys<T> = T extends readonly (infer U)[]
  ? DeepKeys<U>
  : T extends object
    ? {
        [K in keyof T & string]: K | DeepKeys<T[K]>;
      }[keyof T & string]
    : never;

type HasNoPersonalData<T> =
  Extract<DeepKeys<T>, DailyPersonalDataKey> extends never ? true : false;

type Assert<T extends true> = T;

export type AssertDailyFortuneKeysHasNoPersonalData = Assert<
  HasNoPersonalData<DailyFortuneKeys>
>;
