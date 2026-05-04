"use client";

import { useState } from "react";

import { ChevronIcon } from "./ChevronIcon";
import { MarkdownContent } from "./MarkdownContent";
import { OneLinerAlert } from "./OneLinerAlert";

import styles from "./ScenarioItem.module.css";

interface ScenarioItemProps {
  label: string;
  headline: string;
  content?: string;
  /** 신규 구조: 짧은 불릿 리스트 */
  bullets?: string[];
  /** 신규 구조: 마무리 alert 한 줄 정리 */
  oneLiner?: string;
  oneLinerLabel?: string;
  defaultExpanded?: boolean;
}

export const ScenarioItem = ({
  label,
  headline,
  content,
  bullets,
  oneLiner,
  oneLinerLabel,
  defaultExpanded = true,
}: ScenarioItemProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasBullets = !!bullets && bullets.length > 0;

  return (
    <div className={styles.scenarioItem}>
      <button
        type="button"
        className={styles.scenarioHeader}
        onClick={() => setExpanded(!expanded)}
      >
        <div className={styles.scenarioHeaderLeft}>
          <div className={styles.scenarioLabel}>{label}</div>
          <div className={styles.scenarioHeadline}>{headline}</div>
        </div>
        <ChevronIcon expanded={expanded} size="small" />
      </button>
      {expanded && (
        <>
          {hasBullets ? (
            <ul className={styles.scenarioBullets}>
              {bullets!.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          ) : (
            content && (
              <MarkdownContent className={styles.scenarioContent}>
                {content}
              </MarkdownContent>
            )
          )}
          {oneLiner && <OneLinerAlert text={oneLiner} label={oneLinerLabel} />}
        </>
      )}
    </div>
  );
};

interface ScenarioListProps {
  children: React.ReactNode;
}

export const ScenarioList = ({ children }: ScenarioListProps) => {
  return (
    <div className={styles.scenarioContainer}>
      <div className={styles.scenarioList}>{children}</div>
    </div>
  );
};
