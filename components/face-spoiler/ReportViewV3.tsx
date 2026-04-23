import { InterestAreaCard } from "./InterestAreaCard";
import { RegionScoreCard } from "./RegionScoreCard";
import { SignatureHero } from "./SignatureHero";
import styles from "./ReportViewV3.module.css";

import type { FaceReportDataV3 } from "@/libs/face-spoiler/types.v3";

interface ReportViewV3Props {
  report: FaceReportDataV3;
  /** 한국어 라벨 (필수). 나중에 i18n으로 교체 시 여기만 변경. */
  labels?: ReportViewV3Labels;
}

export interface ReportViewV3Labels {
  keywordsTitle: string;
  phraseLabel: string;
  misreadLabel: string;
  scoreLabel: string;
  overallTitle: string;
  regionsTitle: string;
  interestTitle: string;
  closingTag: string;
  strengthsLabel: string;
  cautionsLabel: string;
}

const DEFAULT_LABELS: ReportViewV3Labels = {
  keywordsTitle: "핵심 키워드",
  phraseLabel: "자주 듣는 말",
  misreadLabel: "자주 받는 오해",
  scoreLabel: "종합 점수",
  overallTitle: "종합 인상",
  regionsTitle: "부위별 점수",
  interestTitle: "연애 · 재물 · 직장",
  closingTag: "종합 한 줄",
  strengthsLabel: "강점",
  cautionsLabel: "주의점",
};

export const ReportViewV3 = ({
  report,
  labels = DEFAULT_LABELS,
}: ReportViewV3Props) => {
  const { signature, overallScore, regionScores, interestAreas, closing } =
    report;

  const heroLabels = {
    keywordsTitle: labels.keywordsTitle,
    phraseLabel: labels.phraseLabel,
    misreadLabel: labels.misreadLabel,
    scoreLabel: labels.scoreLabel,
  };

  return (
    <div className={styles.report}>
      <SignatureHero
        signature={signature}
        totalScore={overallScore.totalScore}
        scoreOneLiner={overallScore.scoreOneLiner}
        labels={heroLabels}
      />

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{labels.overallTitle}</h2>
        </header>
        <div className={styles.summary}>
          {overallScore.summary
            .split(/\n\s*\n/)
            .map((p) => p.trim())
            .filter((p) => p.length > 0)
            .map((paragraph, i) => (
              <p key={i} className={styles.paragraph}>
                {paragraph}
              </p>
            ))}
        </div>
        <ul className={styles.highlightList}>
          {overallScore.highlights.map((h, i) => (
            <li key={i} className={styles.highlightItem}>
              <strong className={styles.highlightTitle}>{h.title}</strong>
              <span className={styles.highlightBody}>{h.body}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{labels.regionsTitle}</h2>
        </header>
        <div className={styles.regionGrid}>
          {regionScores.regions.map((region) => (
            <RegionScoreCard key={region.region} region={region} />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{labels.interestTitle}</h2>
        </header>
        <div className={styles.interestStack}>
          {interestAreas.areas.map((area) => (
            <InterestAreaCard
              key={area.domain}
              area={area}
              strengthsLabel={labels.strengthsLabel}
              cautionsLabel={labels.cautionsLabel}
            />
          ))}
        </div>
      </section>

      <section className={styles.closing}>
        <div className={styles.closingInner}>
          <span className={styles.closingTag}>{labels.closingTag}</span>
          <h3 className={styles.closingNickname}>{closing.finalNickname}</h3>
          <p className={styles.closingNote}>{closing.finalNote}</p>
        </div>
        <p className={styles.shareLine}>{closing.shareLine}</p>
      </section>
    </div>
  );
};
