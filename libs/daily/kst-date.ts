import { DailyError } from "./errors";

/** 공유 토큰 날짜 범위의 하한 (서비스 시작일, KST) */
export const DAILY_SERVICE_START_DATE = "2026-10-14";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * 서버(UTC) 시각 → KST 기준 YYYY-MM-DD.
 * 일진은 KST 자정 기준이므로 반드시 이 변환을 거친 날짜를 엔진에 넘긴다.
 */
export const toKstDateString = (now: Date): string =>
  new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);

/** 형식(YYYY-MM-DD)과 실제 달력상 존재 여부(2월 30일 등)를 함께 검사한다 */
export const isValidDateString = (value: unknown): value is string => {
  if (typeof value !== "string") {
    return false;
  }

  const match = DATE_REGEX.exec(value);
  if (!match) {
    return false;
  }

  const [, year, month, day] = match;
  const parsed = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day))
  );

  return parsed.toISOString().slice(0, 10) === value;
};

interface ResolveKstDateOptions {
  now?: Date;
  /** 개발용 날짜 오버라이드. production에서는 무시한다 */
  override?: string | null;
  nodeEnv?: string;
}

/**
 * 오늘의 KST 날짜를 결정한다.
 * 오버라이드는 production이 아닐 때만 허용하며, 형식이 틀리면 조용히 무시하지 않고 드러낸다.
 */
export const resolveKstDate = ({
  now = new Date(),
  override,
  nodeEnv = process.env.NODE_ENV,
}: ResolveKstDateOptions = {}): string => {
  if (!override || nodeEnv === "production") {
    return toKstDateString(now);
  }

  if (!isValidDateString(override)) {
    throw new DailyError(
      "INVALID_DATE",
      "날짜 형식이 올바르지 않아요. (예: 2026-10-14)"
    );
  }

  return override;
};

/** "YYYY-MM-DD"는 사전식 비교가 곧 날짜 비교다 */
export const isDateInServiceRange = (date: string, todayKst: string): boolean =>
  isValidDateString(date) &&
  date >= DAILY_SERVICE_START_DATE &&
  date <= todayKst;
