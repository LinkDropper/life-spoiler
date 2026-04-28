import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import styles from "./FaceReportMarkdown.module.css";

interface FaceReportMarkdownProps {
  text: string;
}

export const FaceReportMarkdown = ({ text }: FaceReportMarkdownProps) => {
  return (
    <div className={styles.body}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
};
