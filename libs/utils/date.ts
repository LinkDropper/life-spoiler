/**
 * 날짜 관련 유틸리티 함수
 */

/**
 * 생년월일 문자열로부터 현재 나이 계산
 *
 * @param birthDate - 생년월일 (YYYY-MM-DD 형식)
 * @returns 만 나이
 */
export const calculateAge = (birthDate: string): number =>
  calculateAgeInYear(birthDate, new Date().getFullYear());

/**
 * 대상 연도의 나이 (만 나이 기준).
 * 지금 나이에 대상 연도까지 남은 햇수를 더한다. 내년 운세(2027)처럼 미래 연도를 볼 때
 * 지금 나이로 대운·나이를 고르면 1살 어긋나서, 대운 경계에 걸린 사람은 다른 10년이 들어갔다.
 * 올해 운세는 targetYear가 올해라 calculateAge와 같다.
 *
 * @param birthDate - 생년월일 (YYYY-MM-DD 형식)
 * @param targetYear - 운세 대상 연도
 * @param today - 기준 날짜 (테스트용)
 */
export const calculateAgeInYear = (
  birthDate: string,
  targetYear: number,
  today: Date = new Date()
): number => {
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age + (targetYear - today.getFullYear());
};
