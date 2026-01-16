/**
 * 날짜 관련 유틸리티 함수
 */

/**
 * 생년월일 문자열로부터 현재 나이 계산
 *
 * @param birthDate - 생년월일 (YYYY-MM-DD 형식)
 * @returns 만 나이
 */
export const calculateAge = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};
