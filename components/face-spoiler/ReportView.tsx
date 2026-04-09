"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import type {
  FaceReportData,
  FaceReportSection,
} from "@/libs/face-spoiler/types";

import styles from "./ReportView.module.css";

interface ReportViewProps {
  report: FaceReportData;
}

interface AccordionCardProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const AccordionCard = ({
  title,
  children,
  defaultOpen = true,
}: AccordionCardProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className={styles.card}>
      <button
        className={styles.cardHeader}
        onClick={handleToggle}
        aria-expanded={isOpen}
        type="button"
      >
        <h2 className={styles.cardTitle}>
          {title}
          <svg
            className={styles.arrowIcon}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ transform: isOpen ? "scaleY(1)" : "scaleY(-1)" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 15l7-7 7 7"
            />
          </svg>
        </h2>
      </button>
      {isOpen && <div className={styles.contentWrapper}>{children}</div>}
    </div>
  );
};

const renderParagraphs = (text: string) => {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
    .map((paragraph, index) => (
      <p key={index} className={styles.paragraph}>
        {paragraph}
      </p>
    ));
};

interface SectionMetaProps {
  tags: FaceReportSection["tags"];
  score: FaceReportSection["score"];
}

const SectionMeta = ({ tags, score }: SectionMetaProps) => {
  return (
    <div className={styles.sectionMeta}>
      <div className={styles.tagGroup}>
        {tags.map((tag, index) => (
          <span key={index} className={styles.tag}>
            #{tag}
          </span>
        ))}
      </div>
      <div className={styles.score}>
        <span className={styles.scoreValue}>{score}</span>
        <span className={styles.scoreUnit}>/100</span>
      </div>
    </div>
  );
};

export const ReportView = ({ report }: ReportViewProps) => {
  const t = useTranslations("faceSpoiler.report.sections");

  return (
    <div className={styles.report}>
      <AccordionCard title={t("profile", { default: "첫인상" })}>
        <h3 className={styles.profileHeadline}>{report.profile.headline}</h3>
        <p className={styles.profileDescription}>
          {report.profile.description}
        </p>
        <div className={styles.profileSummary}>
          {renderParagraphs(report.profile.summary)}
        </div>
      </AccordionCard>

      <AccordionCard title={t("observation", { default: "관상 관찰" })}>
        <h3 className={styles.sectionHeadline}>
          {report.observation.headline}
        </h3>
        <div className={styles.observationContent}>
          {renderParagraphs(report.observation.content)}
        </div>
      </AccordionCard>

      <AccordionCard title={t("personality", { default: "성향" })}>
        <h3 className={styles.sectionHeadline}>
          {report.personality.headline}
        </h3>
        <div className={styles.sectionContent}>
          {renderParagraphs(report.personality.content)}
        </div>
        <SectionMeta
          tags={report.personality.tags}
          score={report.personality.score}
        />
      </AccordionCard>

      <AccordionCard title={t("career", { default: "일·커리어" })}>
        <h3 className={styles.sectionHeadline}>{report.career.headline}</h3>
        <div className={styles.sectionContent}>
          {renderParagraphs(report.career.content)}
        </div>
        <SectionMeta tags={report.career.tags} score={report.career.score} />
      </AccordionCard>

      <AccordionCard title={t("wealth", { default: "돈·재물" })}>
        <h3 className={styles.sectionHeadline}>{report.wealth.headline}</h3>
        <div className={styles.sectionContent}>
          {renderParagraphs(report.wealth.content)}
        </div>
        <SectionMeta tags={report.wealth.tags} score={report.wealth.score} />
      </AccordionCard>

      <AccordionCard title={t("relationship", { default: "관계·연애" })}>
        <h3 className={styles.sectionHeadline}>
          {report.relationship.headline}
        </h3>
        <div className={styles.sectionContent}>
          {renderParagraphs(report.relationship.content)}
        </div>
        <SectionMeta
          tags={report.relationship.tags}
          score={report.relationship.score}
        />
      </AccordionCard>

      <AccordionCard title={t("actions", { default: "실행 행동 5가지" })}>
        <ol className={styles.actionList}>
          {report.actions.map((action, index) => (
            <li key={index} className={styles.actionItem}>
              <span className={styles.actionNumber}>{index + 1}</span>
              <div className={styles.actionBody}>
                <strong className={styles.actionTitle}>{action.title}</strong>
                <p className={styles.actionDetail}>{action.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </AccordionCard>

      <AccordionCard title={t("shareLine", { default: "공유 문구" })}>
        <p className={styles.shareLineContent}>{report.shareLine}</p>
      </AccordionCard>
    </div>
  );
};
