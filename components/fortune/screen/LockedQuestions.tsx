import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";

import type { LockedQuestion } from "@/libs/fortune/lifetime-extras";

import extras from "./LifetimeExtras.module.css";
import styles from "./screen.module.css";

interface LockedQuestionsProps {
  /** buildLockedQuestions 결과. 빈 배열이면 아무것도 그리지 않음 */
  questions: LockedQuestion[];
}

const YEAR_MASK = "●●●●";

/** 예고편: 본편에서 답해 주는 질문을 라벨로만 보여 준다 (내용은 가림) */
export const LockedQuestions = ({ questions }: LockedQuestionsProps) => {
  const t = useTranslations("fortune.screen.answers");
  const tTopic = useTranslations("fortune.screen.timing.topics");
  const tUnit = useTranslations("fortune.screen.timing");

  if (questions.length === 0) {
    return null;
  }

  const describe = (question: LockedQuestion) => {
    switch (question.kind) {
      case "timing":
        return {
          group: t("groupWhen"),
          title: t("timingTitle", { topic: tTopic(question.topic) }),
          desc: t("timingDesc", { count: question.count }),
          masks: question.count,
        };
      case "caution":
        return {
          group: t("groupWhen"),
          title: t("cautionTitle", { topic: tTopic(question.topic) }),
          desc: t("cautionDesc"),
          masks: 1,
        };
      case "fields":
        return {
          group: t("groupWork"),
          title: t("fieldsTitle"),
          desc: t("fieldsDesc", { count: question.count }),
          masks: 0,
        };
      case "partner":
        return {
          group: t("groupLove"),
          title: t("partnerTitle"),
          desc: t("partnerDesc"),
          masks: 0,
        };
    }
  };

  return (
    <section className={styles.section}>
      <p className={styles.eyebrow}>ANSWERS</p>
      <h2 className={styles.sectionTitle}>{t("title")}</h2>
      <p className={styles.sectionDesc}>{t("desc")}</p>
      <ul className={styles.lockList}>
        {questions.map((question) => {
          const row = describe(question);
          const key =
            "topic" in question
              ? `${question.kind}-${question.topic}`
              : question.kind;
          return (
            <li key={key} className={styles.lockItem}>
              <span className={styles.lockAct}>{row.group}</span>
              <span className={styles.lockText}>
                <b>{row.title}</b>
                <span>
                  {row.desc}
                  {row.masks > 0 && (
                    <span className={extras.maskYears} aria-hidden="true">
                      {Array.from(
                        { length: row.masks },
                        () => `${YEAR_MASK}${tUnit("yearUnit")}`
                      ).join(" ")}
                    </span>
                  )}
                </span>
              </span>
              <Lock
                size={16}
                className={styles.lockCount}
                role="img"
                aria-label={t("lockedAria")}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
};
