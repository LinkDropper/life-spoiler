import { useTranslations } from "next-intl";

import { MarkdownContent } from "@/components/fortune";
import type { SubSection } from "@/libs/services/ai/types";

import styles from "./screen.module.css";

const STILL_TONES = [styles.still0, styles.still1, styles.still2];

interface TrailerCutsProps {
  items: SubSection[];
}

/** 무료로 보여 주는 인생 스포일러 본문을 예고 컷 단위로 */
export const TrailerCuts = ({ items }: TrailerCutsProps) => {
  const t = useTranslations("fortune.screen.trailer");

  return (
    <section className={styles.section}>
      <p className={styles.eyebrow}>TRAILER</p>
      <h2 className={styles.sectionTitle}>
        {t("title", { count: items.length })}
      </h2>
      {items.map((item, index) => (
        <article key={`${item.heading}-${index}`} className={styles.cut}>
          <div
            className={`${styles.cutStill} ${
              STILL_TONES[index % STILL_TONES.length]
            }`}
          >
            <span className={styles.cutNo}>
              CUT {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className={styles.cutHeading}>
              <span>{item.heading}</span>
            </h3>
          </div>
          <MarkdownContent className={`${styles.cutBody} ${styles.prose}`}>
            {item.body}
          </MarkdownContent>
        </article>
      ))}
    </section>
  );
};
