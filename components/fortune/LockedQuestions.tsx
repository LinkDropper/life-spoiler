"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import type { LockedQuestion } from "@/libs/fortune/lifetime-extras";

import { SectionHeader } from "./common";

import styles from "./LockedQuestions.module.css";

interface LockedQuestionsProps {
  /** 서버가 내려준 lockedQuestions. 빈 배열이면 섹션 자체를 그리지 않는다 */
  questions: LockedQuestion[];
}

type LockGroup = "when" | "work" | "love";

interface LockRowData {
  key: string;
  group: LockGroup;
  title: string;
  desc: string;
}

const GROUP_ORDER: LockGroup[] = ["when", "work", "love"];

const LockIcon = () => (
  <svg
    className={styles.lockIcon}
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
  >
    <rect
      x="4"
      y="9"
      width="12"
      height="8"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M7 9V6.5a3 3 0 0 1 6 0V9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

/** 예고편: 본편에서 답해 주는 질문을 라벨로만 보여 준다 (연도·내용은 내려오지 않음) */
export const LockedQuestions = ({ questions }: LockedQuestionsProps) => {
  const t = useTranslations("fortune.lifetime.answers");
  const tTopic = useTranslations("fortune.lifetime.timing.topics");
  const [expanded, setExpanded] = useState(true);

  if (questions.length === 0) {
    return null;
  }

  const toRow = (question: LockedQuestion): LockRowData => {
    switch (question.kind) {
      case "timing":
        return {
          key: `timing-${question.topic}`,
          group: "when",
          title: t("timingTitle", { topic: tTopic(question.topic) }),
          desc: t("timingDesc", { count: question.count }),
        };
      case "caution":
        return {
          key: `caution-${question.topic}`,
          group: "when",
          title: t("cautionTitle", { topic: tTopic(question.topic) }),
          desc: t("cautionDesc"),
        };
      case "fields":
        return {
          key: "fields",
          group: "work",
          title: t("fieldsTitle"),
          desc: t("fieldsDesc", { count: question.count }),
        };
      case "partner":
        return {
          key: "partner",
          group: "love",
          title: t("partnerTitle"),
          desc: t("partnerDesc"),
        };
    }
  };

  const rows = questions.map(toRow);

  return (
    <>
      <SectionHeader
        title={t("title")}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      />

      {expanded && (
        <section className={styles.section}>
          <p className={styles.desc}>{t("desc")}</p>

          <div className={styles.groups}>
            {GROUP_ORDER.map((group) => {
              const groupRows = rows.filter((row) => row.group === group);
              if (groupRows.length === 0) {
                return null;
              }
              return (
                <div key={group}>
                  <h4 className={styles.groupTitle}>{t(`group.${group}`)}</h4>
                  <ul className={styles.list}>
                    {groupRows.map((row) => (
                      <li key={row.key} className={styles.row}>
                        <div className={styles.text}>
                          <span className={styles.title}>{row.title}</span>
                          <span className={styles.rowDesc}>{row.desc}</span>
                        </div>
                        <LockIcon />
                        <span className={styles.srOnly}>{t("lockedAria")}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
};
