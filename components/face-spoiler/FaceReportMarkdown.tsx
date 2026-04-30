import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  cleanSectionTitle,
  padCjkBoldEmphasis,
} from "@/libs/face-spoiler/format";

import type { FaceReportSection } from "@/libs/face-spoiler/types";

import styles from "./FaceReportMarkdown.module.css";

interface FaceReportMarkdownProps {
  sections: FaceReportSection[];
}

const formatNumber = (n: number): string => String(n).padStart(2, "0");

export const FaceReportMarkdown = ({ sections }: FaceReportMarkdownProps) => {
  if (sections.length === 0) return null;

  return (
    <div className={styles.sections}>
      {sections.map((section, i) => {
        const title = cleanSectionTitle(section.title);
        const body = padCjkBoldEmphasis(section.body);
        const oneLiner = section.oneLiner.trim();
        return (
          <section key={`${section.number}-${i}`} className={styles.section}>
            <header className={styles.sectionHeader}>
              <span className={styles.sectionNumber}>
                {formatNumber(section.number)}
              </span>
              <h2 className={styles.sectionTitle}>{title}</h2>
            </header>
            {oneLiner.length > 0 && (
              <blockquote className={styles.oneLiner}>{oneLiner}</blockquote>
            )}
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
