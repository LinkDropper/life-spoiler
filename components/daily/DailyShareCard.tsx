import type { Ref } from "react";
import { useLocale, useTranslations } from "next-intl";

import {
  formatCallSheetDate,
  formatCallSheetWeekday,
} from "@/libs/daily/call-sheet";
import type { DailyLevel } from "@/libs/zi-wei-dou-shu/constants/daily-fortune-table";

import { DailyStars } from "./DailyStars";
import { getColorSwatch } from "./color-swatch";
import styles from "./DailyShareCard.module.css";

export interface DailyShareCardProps {
  date: string;
  headline: string;
  overallLevel: DailyLevel;
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
 * 공유 카드 (1:1) — 결과 화면과 같은 "오늘의 콜시트" 분홍 종이 한 장.
 * 공유 토큰에 담기는 값(한 줄·총운 등급·예고 키워드)만 쓴다 — 이름·생년월일시·오늘의 제목 없음.
 * 이미지 저장, 공유 수신자 화면에서 같은 카드를 쓴다.
 */
export const DailyShareCard = ({
  date,
  headline,
  overallLevel,
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

  return (
    <div ref={ref} className={styles.card}>
      <span className={styles.glow} aria-hidden="true" />
      <div className={styles.stage}>
        <span className={styles.clip} aria-hidden="true" />
        <div className={styles.sheet}>
          <div className={styles.head}>
            <span className={styles.mark}>{t("result.callSheet.mark")}</span>
            <span>
              {formatCallSheetDate(date)} {formatCallSheetWeekday(date, locale)}
            </span>
          </div>

          <div className={styles.section}>
            <span className={styles.monoLabel}>
              {t("result.callSheet.synopsis")}
            </span>
            <p className={styles.headline}>{headline}</p>
          </div>

          <dl className={styles.cells}>
            <div className={styles.cell}>
              <dt className={styles.monoLabel}>
                {t("result.callSheet.scene")}
              </dt>
              <dd className={styles.sceneValue}>
                {t("result.callSheet.sceneValue", { number })}
              </dd>
            </div>
            <div className={styles.cell}>
              <dt className={styles.monoLabel}>
                {t("result.callSheet.callTime")}
              </dt>
              <dd className={styles.cellValue}>{timeSlot}</dd>
            </div>
            <div className={styles.cell}>
              <dt className={styles.monoLabel}>{t("category.overall")}</dt>
              <dd className={styles.cellValue}>
                <DailyStars
                  level={overallLevel}
                  layout="stacked"
                  tone="paper"
                />
              </dd>
            </div>
          </dl>

          <dl className={styles.props}>
            <div>
              <dt className={styles.propLabel}>{t("result.callSheet.prop")}</dt>
              <dd className={styles.propValue}>{item}</dd>
            </div>
            <div>
              <dt className={styles.propLabel}>
                {t("result.callSheet.wardrobe")}
              </dt>
              <dd className={styles.propValue}>
                {swatch && (
                  <span
                    className={styles.swatch}
                    style={{ backgroundColor: swatch }}
                    aria-hidden="true"
                  />
                )}
                {color}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      <p className={styles.brand}>
        <span className={styles.logo}>{t("share.brandLogo")}</span>
        {t("share.brand")}
      </p>
    </div>
  );
};
