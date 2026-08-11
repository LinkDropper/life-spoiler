/** 연 단위 운세 상품의 edition 정의 */
export const YEARLY_EDITIONS = {
  yearly: {
    /** null이면 조회 시점의 현재 연도를 사용 */
    targetYear: null,
    i18nKey: "yearly",
  },
  yearly_2027: {
    targetYear: 2027,
    i18nKey: "yearly2027",
  },
} as const;

export type YearlyEdition = keyof typeof YEARLY_EDITIONS;

export const isYearlyEdition = (value: string): value is YearlyEdition =>
  value in YEARLY_EDITIONS;

/** edition의 대상 연도를 해석한다. yearly는 현재 연도, yearly_2027은 2027 고정 */
export const resolveTargetYear = (edition: YearlyEdition): number =>
  YEARLY_EDITIONS[edition].targetYear ?? new Date().getFullYear();
