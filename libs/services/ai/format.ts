// ============================================================
// 운세 해석 본문(content / summary) 마크다운 표시용 정규화 헬퍼.
// 데이터(DB)는 LLM 원본을 그대로 보존하고, 렌더링 시점에만 보정한다.
// ============================================================

/**
 * `**` 양옆에 공백/구두점이 아닌 문자(CJK 등 letter)가 붙어 있으면 공백을 1칸 삽입한다.
 *
 * 이유: CommonMark/GFM의 emphasis flanking rule에 따라, `**`가 letter로
 * 둘러싸인 경우 left·right 모두 flanking이 되어 emphasis를 열지 못한다.
 * 한국어 본문에서 `재**중요한**부분` 같은 패턴이 자주 발생해 `**`가 그대로
 * 노출되는 문제가 있다. 양옆에 공백을 더하면 markdown이 무조건 인식하며,
 * 어절 구분이 자연스러운 한국어 텍스트에서는 시각적 손실이 거의 없다.
 *
 * `*xxx*`(italic) 까지 일괄 처리하면 리스트 마커 `* `와 충돌하므로 `**`만 다룬다.
 */
export const padCjkBoldEmphasis = (text: string): string => {
  return text.replace(
    /\*\*([^*\n]+?)\*\*/g,
    (match: string, _content: string, offset: number, src: string) => {
      const before = offset > 0 ? src[offset - 1] : "";
      const after = src[offset + match.length] ?? "";
      const blocksFlanking = (ch: string): boolean =>
        ch !== "" && !/\s/.test(ch) && !/[\p{P}\p{S}]/u.test(ch);
      const padBefore = blocksFlanking(before);
      const padAfter = blocksFlanking(after);
      return `${padBefore ? " " : ""}${match}${padAfter ? " " : ""}`;
    }
  );
};
