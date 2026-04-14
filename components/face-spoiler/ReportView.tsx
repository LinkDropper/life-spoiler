import { getTranslations } from "next-intl/server";

import { REGION_LABEL } from "@/libs/face-spoiler/constants/regions";
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

const getGapLevel = (percent: number): "small" | "medium" | "large" => {
  if (percent <= 30) {
    return "small";
  }
  if (percent <= 65) {
    return "medium";
  }
  return "large";
};

export const ReportView = async ({ report }: ReportViewProps) => {
  const t = await getTranslations("faceSpoiler.report.sections");
  const tTraits = await getTranslations("faceSpoiler.report.traitsLabels");
  const tRelationship = await getTranslations(
    "faceSpoiler.report.relationshipLabels"
  );
  const tCompat = await getTranslations(
    "faceSpoiler.report.compatibilityLabels"
  );
  const tAnimals = await getTranslations("faceSpoiler.animals");
  const tGapLevels = await getTranslations("faceSpoiler.report.gapLevels");
  const tObservation = await getTranslations(
    "faceSpoiler.report.observationLabels"
  );
  const {
    firstImpression,
    traits,
    gapAnalysis,
    relationship,
    villain,
    compatibility,
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

      {/* 3. 겉과 속의 차이 */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t("gapAnalysis")}</h2>
          <IntensityIndicator intensity={gapAnalysis.intensity} />
        </header>
        <h3 className={`${styles.headline} ${styles.headlineCompact}`}>
          {gapAnalysis.headline}
        </h3>
        <div className={styles.gapHero}>
          <div
            className={styles.gapGauge}
            role="img"
            aria-label={tGapLevels(getGapLevel(gapAnalysis.gapPercent))}
          >
            <div
              className={styles.gapGaugeFill}
              style={{ width: `${gapAnalysis.gapPercent}%` }}
            />
          </div>
          <p className={styles.gapLevelLabel}>
            {tGapLevels(getGapLevel(gapAnalysis.gapPercent))}
          </p>
          <p className={styles.paragraph}>{gapAnalysis.gapSummary}</p>
        </div>
        <div className={styles.gapTagComparison}>
          <div className={styles.gapTagColumn}>
            <span className={styles.blockLabel}>{t("gapOuter")}</span>
            <TagList tags={gapAnalysis.outerTags} />
          </div>
          <span className={styles.gapVs}>vs</span>
          <div className={styles.gapTagColumn}>
            <span className={styles.blockLabel}>{t("gapInner")}</span>
            <TagList tags={gapAnalysis.innerTags} />
          </div>
        </div>
        <div className={styles.labeledBlock}>
          <span className={styles.blockLabel}>{t("gapMisread")}</span>
          <ParagraphStack text={gapAnalysis.commonMisread} />
        </div>
        <div className={styles.labeledBlock}>
          <span className={styles.blockLabel}>{t("gapReversal")}</span>
          <ParagraphStack text={gapAnalysis.reversalTip} />
        </div>
      </section>

      {/* 4. 어울리는 사람 */}
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

      {/* 5. 조심해야 할 관상 */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t("villain")}</h2>
        </header>
        <h3 className={`${styles.headline} ${styles.headlineCompact}`}>
          {villain.headline}
        </h3>
        <ParagraphStack text={villain.clashReason} />
        {villain.appearance.map((feature, index) => {
          type K = keyof typeof REGION_LABEL;
          const l = REGION_LABEL[feature.region as K] ?? feature.region;
          return (
            <div key={index} className={styles.labeledBlock}>
              <span className={styles.blockLabel}>{l}</span>
              <p className={styles.paragraph}>{feature.description}</p>
            </div>
          );
        })}
        <div className={styles.labeledBlock}>
          <span className={styles.blockLabel}>{t("villainClashScene")}</span>
          <ParagraphStack text={villain.clashScene} />
        </div>
        <div className={styles.labeledBlock}>
          <span className={styles.blockLabel}>{t("villainSurvivalTip")}</span>
          <p className={styles.paragraph}>{villain.survivalTip}</p>
        </div>
      </section>

      {/* 6. 궁합 동물상 */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t("compatibility")}</h2>
        </header>
        <div className={styles.compatPair}>
          <div className={styles.compatCard}>
            <div className={`${styles.compatIcon} ${styles.compatIconBest}`}>
              ♥
            </div>
            <div className={styles.compatBody}>
              <span className={styles.compatLabel}>{tCompat("bestMatch")}</span>
              <strong className={styles.compatAnimal}>
                {tAnimals(compatibility.bestMatch)}
              </strong>
              <p className={styles.compatReason}>
                {compatibility.bestMatchReason}
              </p>
            </div>
          </div>
          <div className={styles.compatCard}>
            <div className={`${styles.compatIcon} ${styles.compatIconWorst}`}>
              ✦
            </div>
            <div className={styles.compatBody}>
              <span className={styles.compatLabel}>
                {tCompat("worstMatch")}
              </span>
              <strong className={styles.compatAnimal}>
                {tAnimals(compatibility.worstMatch)}
              </strong>
              <p className={styles.compatReason}>
                {compatibility.worstMatchReason}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. 관상 관찰 */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t("observation")}</h2>
        </header>
        <h3 className={`${styles.headline} ${styles.headlineCompact}`}>
          {observation.headline}
        </h3>
        <ParagraphStack text={observation.content} />
        <div className={styles.observationFeatures}>
          <FeatureBadges
            features={observation.features}
            showMoreLabel={tObservation("showMore")}
            showLessLabel={tObservation("showLess")}
          />
        </div>
      </section>

      {/* 8. 이번 주 작은 행동 */}
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

      {/* 9. shareLine */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t("shareLine")}</h2>
        </header>
        <p className={styles.shareLine}>{shareLine}</p>
      </section>
    </div>
  );
};
