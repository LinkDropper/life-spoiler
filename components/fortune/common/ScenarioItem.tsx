"use client";

import { useState } from "react";

import { ChevronIcon } from "./ChevronIcon";

import styles from "./ScenarioItem.module.css";

interface ScenarioItemProps {
  label: string;
  headline: string;
  content: string;
  defaultExpanded?: boolean;
}

export const ScenarioItem = ({
  label,
  headline,
  content,
  defaultExpanded = true,
}: ScenarioItemProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

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
      {expanded && <div className={styles.scenarioContent}>{content}</div>}
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
