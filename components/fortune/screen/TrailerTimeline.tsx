import { Play } from "lucide-react";
import { useTranslations } from "next-intl";

import { MarkdownContent } from "@/components/fortune";
import type { SubSection } from "@/libs/services/ai/types";

import styles from "./screen.module.css";

interface TrailerTimelineProps {
  items: SubSection[];
}

/** 장면당 예고편 길이(초). 타임코드는 장면 순서를 보여 주는 장치일 뿐 실제 재생은 없다 */
const SCENE_SECONDS = 40;

const toTimecode = (seconds: number): string =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60
  ).padStart(2, "0")}`;

/**
 * 예고편 타임라인 (기획서 §10, 예고 컷 3안).
 * 무료 본문(소제목)을 예고편 재생 목록처럼: 타임코드 · 재생 점 · SCENE 번호 · 큰 소제목.
 * 본문은 접지 않고 다 읽힌다.
 */
export const TrailerTimeline = ({ items }: TrailerTimelineProps) => {
  const t = useTranslations("fortune.screen.yearly.trailer");

  return (
    <section className={styles.section}>
      <p className={styles.eyebrow}>TRAILER</p>
      <h2 className={styles.sectionTitle}>
        {t("title", { count: items.length })}
      </h2>
      <div className={styles.trailerBar} aria-hidden="true">
        <div className={styles.trailerBarHead}>
          <span>▶ TRAILER</span>
          <span>{t("free", { count: items.length })}</span>
        </div>
        <div className={styles.trailerSegments}>
          {items.map((item, index) => (
            <span
              key={`${item.heading}-${index}`}
              className={index === 0 ? styles.trailerSegmentOn : undefined}
            />
          ))}
        </div>
      </div>
      <ol className={styles.timeline}>
        {items.map((item, index) => (
          <li key={`${item.heading}-${index}`} className={styles.timelineItem}>
            <span className={styles.timelineRail} aria-hidden="true">
              <span
                className={`${styles.timelineDot} ${
                  index === 0 ? styles.timelineDotOn : ""
                }`}
              >
                <Play size={12} fill="currentColor" strokeWidth={0} />
              </span>
              <span className={styles.timelineCode}>
                {toTimecode(index * SCENE_SECONDS)}
              </span>
              {index < items.length - 1 && (
                <span className={styles.timelineLine} />
              )}
            </span>
            <div className={styles.timelineBody}>
              <span className={styles.timelineScene}>
                SCENE {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className={styles.timelineHeading}>{item.heading}</h3>
              <MarkdownContent className={styles.prose}>
                {item.body}
              </MarkdownContent>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};
