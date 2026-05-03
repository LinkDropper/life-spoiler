"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  cleanSectionTitle,
  padCjkBoldEmphasis,
} from "@/libs/face-spoiler/format";
import { stripOneLinerSubsections } from "@/libs/face-spoiler/preview-parser";

import styles from "./FaceReportMarkdown.module.css";

import type { FaceReportSection } from "@/libs/face-spoiler/types";

interface FaceReportMarkdownProps {
  sections: FaceReportSection[];
}

interface SectionItemProps {
  section: FaceReportSection;
}

/**
 * 한 줄 평(oneLiner) alert 를 노출하는 섹션 번호 화이트리스트.
 *
 * 4 (첫인상 오해 포인트), 5 (재물운) — 한 줄 평 의미가 살아 있는 섹션.
 * 6~9 (연애운 / 잘 어울리는 직업 / 화났을 때 특징 / 종합 평가) — 한 줄 평
 *   대신 본문 자체가 결론 역할이라 alert 를 두지 않는다(프롬프트에서도 oneLiner
 *   를 빈 문자열로 두도록 지시하지만, legacy 리포트는 채워져 있을 수 있어
 *   UI 측에서도 명시적으로 차단).
 */
const ALERT_ENABLED_SECTION_NUMBERS = new Set<number>([4, 5]);

const SectionItem = ({ section }: SectionItemProps) => {
  const [expanded, setExpanded] = useState(true);
  const title = cleanSectionTitle(section.title);
  // body 에 LLM 이 끼워 넣었을 수 있는 한 줄 정리 / 한 줄 평 / 최종 한 줄 평
  // subsection 과 인라인 한 줄 라인을 UI 측에서도 한 번 더 거른 뒤 렌더한다.
  const body = padCjkBoldEmphasis(stripOneLinerSubsections(section.body));
  const rawOneLiner = section.oneLiner.trim();
  const showAlert =
    ALERT_ENABLED_SECTION_NUMBERS.has(section.number) && rawOneLiner.length > 0;

  const handleToggle = () => setExpanded((prev) => !prev);

  return (
    <section className={styles.section}>
      <button
        type="button"
        className={styles.header}
        onClick={handleToggle}
        aria-expanded={expanded}
      >
        <span className={styles.title}>{title}</span>
        <svg
          className={`${styles.chevron} ${
            expanded ? styles.chevronUp : styles.chevronDown
          }`}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9.55806 7.05806C9.80214 6.81398 10.1979 6.81398 10.4419 7.05806L15.4419 12.0581C15.686 12.3021 15.686 12.6979 15.4419 12.9419C15.1979 13.186 14.8021 13.186 14.5581 12.9419L10 8.38388L5.44194 12.9419C5.19786 13.186 4.80214 13.186 4.55806 12.9419C4.31398 12.6979 4.31398 12.3021 4.55806 12.0581L9.55806 7.05806Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {expanded && (
        <div className={styles.body}>
          {showAlert && (
            <div className={styles.alert} role="note">
              <p className={styles.alertText}>{rawOneLiner}</p>
            </div>
          )}

          {body.length > 0 && (
            <div className={styles.markdown}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export const FaceReportMarkdown = ({ sections }: FaceReportMarkdownProps) => {
  if (sections.length === 0) return null;

  return (
    <div className={styles.sections}>
      {sections.map((section, i) => (
        <SectionItem key={`${section.number}-${i}`} section={section} />
      ))}
    </div>
  );
};
