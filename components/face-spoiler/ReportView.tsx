import { getTranslations } from "next-intl/server";

import type { FaceReportData } from "@/libs/face-spoiler/types";

import { FeatureBadges } from "./FeatureBadges";
import { IntensityIndicator } from "./IntensityIndicator";
import { ShareableQuoteCard } from "./ShareableQuoteCard";
import styles from "./ReportView.module.css";

interface ReportViewProps {
  report: FaceReportData;
}

const splitParagraphs = (text: string): string[] => {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
};

interface ParagraphStackProps {
  text: string;
}

const ParagraphStack = ({ text }: ParagraphStackProps) => {
  const paragraphs = splitParagraphs(text);
  if (paragraphs.length === 0) {
    return null;
  }
  return (
    <div className={styles.paragraphStack}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={styles.paragraph}>
          {paragraph}
        </p>
      ))}
    </div>
  );
};

interface TagListProps {
  tags: string[];
  variant?: "default" | "vibe";
}

const TagList = ({ tags, variant = "default" }: TagListProps) => {
  if (tags.length === 0) {
    return null;
  }
  return (
    <div className={styles.tagGroup}>
      {tags.map((tag, index) => (
        <span
          key={index}
          className={`${styles.tag} ${variant === "vibe" ? styles.vibeTag : ""}`}
        >
          #{tag}
        </span>
      ))}
    </div>
  );
};

export const ReportView = async ({ report }: ReportViewProps) => {
  const t = await getTranslations("faceSpoiler.report.sections");
  const tTraits = await getTranslations("faceSpoiler.report.traitsLabels");
  const tFortune = await getTranslations("faceSpoiler.report.fortuneLabels");
  const tRelationship = await getTranslations(
    "faceSpoiler.report.relationshipLabels"
  );
  const {
    firstImpression,
    traits,
    relationship,
    fortune,
    observation,
    actions,
    shareLine,
  } = report;

  return (
    <div className={styles.report}>
      {/* 1. 첫인상 */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t("firstImpression")}</h2>
          <IntensityIndicator intensity={firstImpression.intensity} />
        </header>
        <h3 className={styles.headline}>{firstImpression.headline}</h3>
        <p className={styles.description}>{firstImpression.description}</p>
        <ParagraphStack text={firstImpression.summary} />
        <TagList tags={firstImpression.vibeTags} variant="vibe" />
      </section>

      {/* 2. 성향과 매력 */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t("traits")}</h2>
          <IntensityIndicator intensity={traits.intensity} />
        </header>
        <h3 className={`${styles.headline} ${styles.headlineCompact}`}>
          {traits.headline}
        </h3>
        <div className={styles.labeledBlock}>
          <span className={styles.blockLabel}>{tTraits("strengths")}</span>
          <ParagraphStack text={traits.strengths} />
        </div>
        <div className={styles.labeledBlock}>
          <span className={styles.blockLabel}>{tTraits("hiddenSide")}</span>
          <ParagraphStack text={traits.hiddenSide} />
        </div>
        <TagList tags={traits.tags} />
      </section>

      {/* 3. 어울리는 사람 */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t("relationship")}</h2>
          <IntensityIndicator intensity={relationship.intensity} />
        </header>
        <h3 className={`${styles.headline} ${styles.headlineCompact}`}>
          {relationship.headline}
        </h3>
        <ParagraphStack text={relationship.content} />
        <div className={styles.labeledBlock}>
          <span className={styles.blockLabel}>
            {tRelationship("idealType")}
          </span>
          <p className={styles.paragraph}>{relationship.idealType}</p>
        </div>
        <ShareableQuoteCard quote={relationship.shareableQuote} />
        <TagList tags={relationship.tags} />
      </section>

      {/* 4. 일과 재물의 흐름 */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t("fortune")}</h2>
          <IntensityIndicator intensity={fortune.intensity} />
        </header>
        <h3 className={`${styles.headline} ${styles.headlineCompact}`}>
          {fortune.headline}
        </h3>
        <div className={styles.labeledBlock}>
          <span className={styles.blockLabel}>{tFortune("workFlow")}</span>
          <ParagraphStack text={fortune.workFlow} />
        </div>
        <div className={styles.labeledBlock}>
          <span className={styles.blockLabel}>{tFortune("wealthFlow")}</span>
          <ParagraphStack text={fortune.wealthFlow} />
        </div>
        <TagList tags={fortune.tags} />
      </section>

      {/* 5. 관상 관찰 */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t("observation")}</h2>
        </header>
        <h3 className={`${styles.headline} ${styles.headlineCompact}`}>
          {observation.headline}
        </h3>
        <ParagraphStack text={observation.content} />
        <div className={styles.observationFeatures}>
          <FeatureBadges features={observation.features} />
        </div>
      </section>

      {/* 6. 이번 주 작은 행동 */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t("actions")}</h2>
        </header>
        <ol className={styles.actionList}>
          {actions.map((action, index) => (
            <li key={index} className={styles.actionItem}>
              <span className={styles.actionNumber}>{index + 1}</span>
              <div className={styles.actionBody}>
                <strong className={styles.actionTitle}>{action.title}</strong>
                <p className={styles.actionDetail}>{action.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 7. shareLine */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t("shareLine")}</h2>
        </header>
        <p className={styles.shareLine}>{shareLine}</p>
      </section>
    </div>
  );
};
