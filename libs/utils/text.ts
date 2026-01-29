/**
 * 텍스트 유틸리티
 */

/**
 * 문자열에서 이모지를 제거합니다.
 * @param text - 이모지를 제거할 문자열
 * @returns 이모지가 제거된 문자열
 */
export const removeEmoji = (text: string): string =>
  text
    .replace(
      /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
      ""
    )
    .trim();
