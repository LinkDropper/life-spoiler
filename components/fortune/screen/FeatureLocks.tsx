import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";

import styles from "./screen.module.css";

const LOCKED_SCENES = ["act2", "act3", "act4", "bonus"] as const;

/** 영향력이 가장 큰 키워드 3개는 본편에서 연다 (기존 KeywordGrid 미리보기와 같은 규칙) */
const LOCKED_KEYWORD_COUNT = 3;

const REDACTED_WIDTHS = [72, 48, 96, 60, 84, 40, 66];

interface FeatureLocksProps {
  keywords: string[];
}

/** 본편에서 상영돼요: 결제하면 열리는 장면 목록 + 흐린 키워드 */
export const FeatureLocks = ({ keywords }: FeatureLocksProps) => {
  const t = useTranslations("fortune.screen.feature");
  const lockedCount = Math.min(keywords.length, LOCKED_KEYWORD_COUNT);

  return (
    <section className={styles.section}>
      <p className={styles.eyebrow}>FEATURE</p>
      <h2 className={styles.sectionTitle}>{t("title")}</h2>

      <div className={styles.spoilerBox}>
        <span className={styles.spoilerStamp}>SPOILER</span>
        <div className={styles.redacted} aria-hidden="true">
          {REDACTED_WIDTHS.map((width, index) => (
            <span key={index} style={{ width }} />
          ))}
        </div>
        <span className={styles.sectionDesc}>{t("spoilerHint")}</span>
      </div>

      <ul className={styles.lockList}>
        {LOCKED_SCENES.map((scene) => (
          <li key={scene} className={styles.lockItem}>
            <span className={styles.lockAct}>{t(`${scene}.act`)}</span>
            <span className={styles.lockText}>
              <b>{t(`${scene}.title`)}</b>
              <span>{t(`${scene}.desc`)}</span>
            </span>
            <Lock size={16} className={styles.lockCount} aria-hidden="true" />
          </li>
        ))}
      </ul>

      {keywords.length > 0 && (
        <>
          <p className={styles.sectionDesc}>
            {t("keywords", { count: lockedCount })}
          </p>
          <ul className={styles.keywords}>
            {keywords.map((keyword, index) => {
              const isLocked = index < LOCKED_KEYWORD_COUNT;
              return (
                <li
                  key={`${keyword}-${index}`}
                  className={`${styles.keyword} ${
                    isLocked ? styles.keywordLocked : ""
                  }`}
                  aria-hidden={isLocked}
                >
                  #{isLocked ? t("lockedKeyword") : keyword}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
};
