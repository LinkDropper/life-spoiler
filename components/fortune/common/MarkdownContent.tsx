import type { CSSProperties } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { padCjkBoldEmphasis } from "@/libs/services/ai/format";

import styles from "./MarkdownContent.module.css";

interface MarkdownContentProps {
  children: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * AI 해석 본문(content / summary) 마크다운 렌더링.
 * - `**bold**`, 리스트, 표, 소제목, 단락 분리(빈 줄)를 모두 지원
 * - CJK 본문에서 `재**중요**부분` 처럼 letter로 둘러싸인 emphasis가
 *   인식 안 되는 문제는 `padCjkBoldEmphasis`로 보정
 * - plain text 입력도 그대로 정상 렌더되므로 마크다운 미적용 prompt에서도 안전
 */
export const MarkdownContent = ({
  children,
  className,
  style,
}: MarkdownContentProps) => {
  const text = padCjkBoldEmphasis(children);
  const wrapperClass = className
    ? `${styles.markdown} ${className}`
    : styles.markdown;
  return (
    <div className={wrapperClass} style={style}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
};
