import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";

import styles from "./screen.module.css";

const LOCKED_SCENES = ["act2", "act3", "act4", "bonus"] as const;

/** 영향력이 가장 큰 키워드 3개는 본편에서 연다 (기존 KeywordGrid 미리보기와 같은 규칙) */
const LOCKED_KEYWORD_COUNT = 3;

const REDACTED_WIDTHS = [72, 48, 96, 60, 84, 40, 66];

export interface LockedScene {
  act: string;
  title: string;
  desc: string;
}

interface FeatureLocksProps {
  keywords?: string[];
  /** 잠긴 장면 목록. 없으면 인생 운세 목록 */
  scenes?: LockedScene[];
  /** 스포일러 상자 안 제목 한 줄 (올해: 이번 달 제목) */
  spoilerTitle?: string;
  /** 스포일러 상자 안내. 없으면 인생 운세 문구 */
  spoilerHint?: string;
}

/** 본편에서 상영돼요: 결제하면 열리는 장면 목록 + 흐린 키워드 */
export const FeatureLocks = ({
  keywords = [],
  scenes,
  spoilerTitle,
  spoilerHint,
}: FeatureLocksProps) => {
  const t = useTranslations("fortune.screen.feature");
  const lockedCount = Math.min(keywords.length, LOCKED_KEYWORD_COUNT);
  const lockedScenes =
    scenes ??
    LOCKED_SCENES.map((scene) => ({
      act: t(`${scene}.act`),
      title: t(`${scene}.title`),
      desc: t(`${scene}.desc`),
    }));

  return (
    <section className={styles.section}>
      <p className={styles.eyebrow}>FEATURE</p>
      <h2 className={styles.sectionTitle}>{t("title")}</h2>

      <div className={styles.spoilerBox}>
        <span className={styles.spoilerStamp}>SPOILER</span>
        {spoilerTitle && <b className={styles.spoilerTitle}>{spoilerTitle}</b>}
        <div className={styles.redacted} aria-hidden="true">
          {REDACTED_WIDTHS.map((width, index) => (
            <span key={index} style={{ width }} />
          ))}
        </div>
        <span className={styles.sectionDesc}>
          {spoilerHint ?? t("spoilerHint")}
        </span>
      </div>

      <ul className={styles.lockList}>
        {lockedScenes.map((scene) => (
          <li key={scene.act} className={styles.lockItem}>
            <span className={styles.lockAct}>{scene.act}</span>
            <span className={styles.lockText}>
              <b>{scene.title}</b>
              <span>{scene.desc}</span>
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
