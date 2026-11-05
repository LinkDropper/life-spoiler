import { useTranslations } from "next-intl";

import type { YearlyInsights } from "@/libs/zi-wei-dou-shu/calculators";

import styles from "./screen.module.css";

interface YearMemoProps {
  insights: YearlyInsights;
  year: number;
  when: "upcoming" | "current";
}

/**
 * 올해의 메모: 명반으로 계산한 재물 공략 · 연애 모드 · 귀인 · 건강 주의.
 * 행운의 색상·장소는 뺐다(브랜드 금지 표현 "럭키 컬러"류, 근거 설명이 약함 — 기획서 §10).
 */
export const YearMemo = ({ insights, year, when }: YearMemoProps) => {
  const t = useTranslations("fortune.screen.yearly.memo");
  const { wealthStrategy, romanceMode, nobleHelper, healthWarning } = insights;

  const rows = [
    {
      key: "wealth",
      value: wealthStrategy.recommendedAreas[0] || wealthStrategy.mainStrategy,
    },
    { key: "romance", value: romanceMode.mode },
    {
      key: "noble",
      value: nobleHelper.samhap.animals
        .slice(0, 2)
        .map((animal) => t("nobleAnimal", { animal }))
        .join(" · "),
    },
    { key: "health", value: healthWarning.concerns.slice(0, 2).join(" · ") },
  ].filter((row) => row.value);

  return (
    <section className={styles.section}>
      <p className={styles.eyebrow}>DIRECTOR&apos;S NOTE</p>
      <h2 className={styles.sectionTitle}>{t("title", { year, when })}</h2>
      <p className={styles.sectionDesc}>{t("desc")}</p>
      <dl className={styles.memoList}>
        {rows.map((row) => (
          <div key={row.key} className={styles.memoRow}>
            <dt>{t(`${row.key}.label`)}</dt>
            <dd>
              <b>{row.value}</b>
              <span>{t(`${row.key}.source`)}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
