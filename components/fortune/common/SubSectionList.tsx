import { MarkdownContent } from "./MarkdownContent";

import styles from "./SubSectionList.module.css";

import type { SubSection } from "@/libs/services/ai/types";

interface SubSectionListProps {
  items: SubSection[];
}

/**
 * 관상스포 부위별 카드 패턴.
 * heading + body(마크다운) 카드를 세로로 나열한다.
 * body 안에는 ### 소제목을 넣지 않도록 프롬프트가 강제한다 (heading 이 그 역할).
 */
export const SubSectionList = ({ items }: SubSectionListProps) => {
  if (!items || items.length === 0) return null;

  return (
    <div className={styles.list}>
      {items.map((item, idx) => (
        <article key={`${item.heading}-${idx}`} className={styles.card}>
          <h4 className={styles.heading}>{item.heading}</h4>
          <MarkdownContent className={styles.body}>{item.body}</MarkdownContent>
        </article>
      ))}
    </div>
  );
};
