/**
 * 오늘의 콜시트 표시용 순수 함수. 데이터(DailyFortuneView)는 그대로 두고 보여 주는 형식만 만든다.
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** KST 날짜(YYYY-MM-DD)를 콜시트 머리의 "2026.11.05"로 */
export const formatCallSheetDate = (date: string): string =>
  date.replaceAll("-", ".");

/** KST 날짜의 짧은 요일(ko "목", en "Thu", ja "木") */
export const formatCallSheetWeekday = (date: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`)
  );

/** 다음 KST 자정(다음 콜시트)까지 남은 시간. 0 이하가 되면 0시간 0분 */
export const getTimeUntilNextCall = (
  now: Date
): { hours: number; minutes: number } => {
  const kstNow = now.getTime() + KST_OFFSET_MS;
  const remainingMs = DAY_MS - (((kstNow % DAY_MS) + DAY_MS) % DAY_MS);
  const totalMinutes = Math.max(0, Math.ceil(remainingMs / 60000));
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
};
