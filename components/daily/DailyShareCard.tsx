import type { Ref } from "react";
import { useLocale, useTranslations } from "next-intl";

import { getColorSwatch } from "./color-swatch";
import { formatDailyDate } from "./format-date";
import styles from "./DailyShareCard.module.css";

export interface DailyShareCardProps {
  date: string;
  headline: string;
  color: string;
  /** 색 견본용 슬러그. 없으면 견본 없이 색 이름만 보여준다 */
  colorSlug?: string;
  item: string;
  number: number;
  timeSlot: string;
  /** 이미지 저장(html-to-image) 대상 연결용 */
  ref?: Ref<HTMLDivElement>;
}

/**
 * 공유 카드 (1:1). 한 줄 + 예고 키워드만 담는다 — 이름·생년월일시·별 이름·최저 등급 라벨 없음.
 * 이미지 저장, 공유 수신자 화면에서 같은 카드를 쓴다.
 */
export const DailyShareCard = ({
  date,
  headline,
  color,
  colorSlug,
  item,
  number,
  timeSlot,
  ref,
}: DailyShareCardProps) => {
  const t = useTranslations("daily");
  const locale = useLocale();
  const swatch = getColorSwatch(colorSlug);

  const keywords: { label: string; value: string; swatch?: string }[] = [
    { label: t("result.keywordColor"), value: color, swatch },
    { label: t("result.keywordItem"), value: item },
    { label: t("result.keywordNumber"), value: String(number) },
    { label: t("result.keywordTime"), value: timeSlot },
  ];

  return (
    <div ref={ref} className={styles.card}>
      <span className={styles.glow} aria-hidden="true" />
      <p className={styles.date}>
        {t("share.dateLabel", { date: formatDailyDate(date, locale) })}
      </p>
      <div className={styles.body}>
        <p className={styles.eyebrow}>{t("share.eyebrow")}</p>
        <p className={styles.headline}>{headline}</p>
      </div>
      <dl className={styles.keywords}>
        {keywords.map(({ label, value, swatch: chipSwatch }) => (
          <div key={label} className={styles.keyword}>
            <dt className={styles.keywordLabel}>{label}</dt>
            <dd className={styles.keywordValue}>
              {chipSwatch && (
                <span
                  className={styles.swatch}
                  style={{ backgroundColor: chipSwatch }}
                  aria-hidden="true"
                />
              )}
              <span>{value}</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className={styles.brand}>
        <span className={styles.brandMark} aria-hidden="true" />
        {t("share.brand")}
      </p>
    </div>
  );
};
