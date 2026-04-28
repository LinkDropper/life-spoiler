import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { FaceReportSection } from "@/libs/face-spoiler/types";

import styles from "./FaceReportMarkdown.module.css";

interface FaceReportMarkdownProps {
  sections: FaceReportSection[];
}

const formatNumber = (n: number): string => String(n).padStart(2, "0");

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
const padCjkBoldEmphasis = (text: string): string => {
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

/**
 * 섹션 제목 정규화.
 * - 앞뒤 `**` / `*` 마크다운 마커 제거 (LLM이 굵은 글씨로 강조하려 끼운 경우)
 * - 앞에 붙은 숫자 prefix("1.", "1)", "1]" 등) 제거 — 우리 UI가 별도 번호 배지를 그리므로 중복 방지
 * - 양끝 공백 제거
 *
 * title은 plain text(h2)로 렌더되므로 markdown 마커가 그대로 보이는 것을 차단.
 */
const cleanTitle = (raw: string): string => {
  let t = raw.trim();
  t = t.replace(/^\**\s*/, "");
  t = t.replace(/\s*\**$/, "");
  t = t.replace(/^\d+\s*[.)\]]\s*/, "");
  return t.trim();
};

export const FaceReportMarkdown = ({ sections }: FaceReportMarkdownProps) => {
  if (sections.length === 0) return null;

  return (
    <div className={styles.sections}>
      {sections.map((section, i) => {
        const title = cleanTitle(section.title);
        const body = padCjkBoldEmphasis(section.body);
        return (
          <section key={`${section.number}-${i}`} className={styles.section}>
            <header className={styles.sectionHeader}>
              <span className={styles.sectionNumber}>
                {formatNumber(section.number)}
              </span>
              <h2 className={styles.sectionTitle}>{title}</h2>
            </header>
            {body.length > 0 && (
              <div className={styles.sectionBody}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {body}
                </ReactMarkdown>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};
