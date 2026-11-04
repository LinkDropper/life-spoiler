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

/** 마지막 글자가 받침 있는 한글인지. 한글이 아니면 false */
export const hasKoreanBatchim = (word: string): boolean => {
  const code = word.trim().charCodeAt(word.trim().length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
};

/**
 * 받침 유무로 조사를 고른다.
 * @example pickParticle("태음", "이에요", "예요") // "이에요"
 * @example pickParticle("천부", "과", "와") // "와"
 */
export const pickParticle = (
  word: string,
  withBatchim: string,
  withoutBatchim: string
): string => (hasKoreanBatchim(word) ? withBatchim : withoutBatchim);
