import type { CSSProperties, ReactNode } from "react";

interface FormattedTextProps {
  children: string;
  className?: string;
  style?: CSSProperties;
  as?: "p" | "div";
}

/**
 * AI 응답 텍스트를 포맷팅하는 컴포넌트.
 * - **bold** → <strong>bold</strong>
 * - \n → 줄바꿈 유지 (CSS white-space: pre-line)
 */
export const FormattedText = ({
  children,
  className,
  style,
  as: Tag = "p",
}: FormattedTextProps) => {
  const mergedStyle = { whiteSpace: "pre-line" as const, ...style };
  return (
    <Tag className={className} style={mergedStyle}>
      {parseBold(children)}
    </Tag>
  );
};

/**
 * **text** 패턴을 <strong>으로 변환.
 * 중첩 없이 단순 볼드만 처리.
 */
const parseBold = (text: string): ReactNode[] => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};
