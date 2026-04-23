import { ScoreGauge } from "./ScoreGauge";
import { SignatureHookCard } from "./SignatureHookCard";
import styles from "./SignatureHero.module.css";

import type { SignatureSection } from "@/libs/face-spoiler/types.v3";

interface SignatureHeroProps {
  signature: SignatureSection;
  /** 종합 점수 — 히어로에서 미리 공개. undefined면 잠금 표시 */
  totalScore?: number;
  /** scoreOneLiner — 종합 점수 한 줄 평. undefined면 비표시 */
  scoreOneLiner?: string;
  /** 라벨들 (i18n) */
  labels: {
    keywordsTitle: string;
    phraseLabel: string;
    misreadLabel: string;
    scoreLabel: string;
  };
}

export const SignatureHero = ({
  signature,
  totalScore,
  scoreOneLiner,
  labels,
}: SignatureHeroProps) => (
  <section className={styles.hero}>
    {signature.faceAge && (
      <div className={styles.faceAgeCard}>
        <span className={styles.faceAgeLabel}>첫인상 나이</span>
        <strong className={styles.faceAgeValue}>
          {signature.faceAge.label}
        </strong>
        <span className={styles.faceAgeRange}>{signature.faceAge.range}</span>
        <p className={styles.faceAgeNote}>{signature.faceAge.note}</p>
      </div>
    )}

    <div className={styles.titleBlock}>
      <h1 className={styles.oneLine}>{signature.oneLineDefinition}</h1>
      <p className={styles.subDef}>{signature.subDefinition}</p>
    </div>

    <div className={styles.chipRow}>
      <span className={styles.animalChip}>{signature.animalChip.label}</span>
    </div>

    <div className={styles.keywords}>
      <span className={styles.keywordsTitle}>{labels.keywordsTitle}</span>
      <div className={styles.keywordList}>
        {signature.coreKeywords.map((kw, i) => (
          <span key={i} className={styles.keyword}>
            #{kw}
          </span>
        ))}
      </div>
    </div>

    <div className={styles.hooks}>
      <SignatureHookCard
        variant="phrase"
        label={labels.phraseLabel}
        content={signature.commonlyHeardPhrase}
      />
      <SignatureHookCard
        variant="misread"
        label={labels.misreadLabel}
        content={signature.commonMisread}
      />
    </div>

    {typeof totalScore === "number" && (
      <div className={styles.scoreBlock}>
        <ScoreGauge
          score={totalScore}
          label={labels.scoreLabel}
          variant="total"
        />
        {scoreOneLiner && (
          <blockquote className={styles.scoreOneLiner}>
            {scoreOneLiner}
          </blockquote>
        )}
      </div>
    )}
  </section>
);
