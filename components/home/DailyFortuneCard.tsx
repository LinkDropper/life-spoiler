import { useTranslations } from "next-intl";

import styles from "./DailyFortuneCard.module.css";

interface DailyFortuneCardProps {
  onClick?: () => void;
}

/**
 * 홈 — 오늘의 운세 진입 카드.
 *
 * **KO 로케일에서만 노출한다** (노출 분기는 호출부인 `app/home/page.tsx`가 담당).
 * 문구 사전이 KO뿐이라 EN/JA 화면에서는 진입점을 숨긴다. 링크 직접 진입은 막지 않는다.
 * 다른 홈 카드의 164px 고정 높이와 달리 EN/JA 타이틀이 2줄로 감겨도 넘치지 않도록
 * 최소 높이만 둔다.
 */
export const DailyFortuneCard = ({ onClick }: DailyFortuneCardProps) => {
  const t = useTranslations("daily.home");

  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <div className={styles.content}>
        <h2 className={styles.title}>{t("title")}</h2>
        <p className={styles.subtitle}>{t("subtitle")}</p>
        <span className={styles.badge}>FREE</span>
      </div>
      <div className={styles.button}>
        <span>{t("button")}</span>
      </div>
    </button>
  );
};
