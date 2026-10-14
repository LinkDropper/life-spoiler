/**
 * KST 날짜(YYYY-MM-DD)를 로케일에 맞는 "10월 14일 수요일" 형태로 바꾼다.
 * 날짜 문자열을 UTC 자정으로 해석해 UTC 기준으로 포맷하므로 실행 환경의 시간대와 무관하다.
 */
export const formatDailyDate = (date: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
