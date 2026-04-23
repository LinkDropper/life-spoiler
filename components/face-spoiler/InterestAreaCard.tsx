import type { InterestArea } from "@/libs/face-spoiler/types.v3";

import styles from "./InterestAreaCard.module.css";

interface InterestAreaCardProps {
  area: InterestArea;
  strengthsLabel: string;
  cautionsLabel: string;
}

const splitParagraphs = (text: string): string[] =>
  text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

export const InterestAreaCard = ({
  area,
  strengthsLabel,
  cautionsLabel,
}: InterestAreaCardProps) => {
  const paragraphs = splitParagraphs(area.body);

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <h3 className={styles.label}>{area.label}</h3>
        <p className={styles.definition}>{area.oneLineDefinition}</p>
      </header>

      <div className={styles.body}>
        {paragraphs.map((paragraph, i) => (
          <p key={i} className={styles.paragraph}>
            {paragraph}
          </p>
        ))}
      </div>

      <div className={styles.scalePair}>
        <div className={`${styles.scaleColumn} ${styles.strengths}`}>
          <span className={styles.scaleLabel}>{strengthsLabel}</span>
          <ul className={styles.list}>
            {area.strengths.map((item, i) => (
              <li key={i} className={styles.listItem}>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className={`${styles.scaleColumn} ${styles.cautions}`}>
          <span className={styles.scaleLabel}>{cautionsLabel}</span>
          <ul className={styles.list}>
            {area.cautions.map((item, i) => (
              <li key={i} className={styles.listItem}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <blockquote className={styles.verdict}>{area.oneLineVerdict}</blockquote>

      <div className={styles.nickname}>
        <span className={styles.nicknameTag}>{area.characterNickname}</span>
        <p className={styles.nicknameSubtext}>{area.nicknameSubtext}</p>
      </div>
    </article>
  );
};
