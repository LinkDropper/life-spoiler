import { MarkdownContent } from "@/components/fortune";
import type { SubSection } from "@/libs/services/ai/types";

import styles from "./screen.module.css";

interface NumberedSectionsProps {
  items: SubSection[];
}

/** 소제목 + 본문(마크다운)을 01, 02… 번호로 */
export const NumberedSections = ({ items }: NumberedSectionsProps) => (
  <ol className={styles.numbered}>
    {items.map((item, index) => (
      <li key={`${item.heading}-${index}`} className={styles.numberedItem}>
        <span className={styles.numberedNo} aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className={styles.numberedBody}>
          <h3 className={styles.numberedHeading}>{item.heading}</h3>
          <MarkdownContent className={styles.prose}>
            {item.body}
          </MarkdownContent>
        </div>
      </li>
    ))}
  </ol>
);
