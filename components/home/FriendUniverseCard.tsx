import { useTranslations } from "next-intl";

import styles from "./FriendUniverseCard.module.css";

interface FriendUniverseCardProps {
  onClick?: () => void;
}

/**
 * 홈 최상단 — 친구 우주 궁합 진입 카드.
 *
 * **KO 로케일에서만 노출한다** (노출 분기는 호출부인 `app/home/page.tsx`가 담당).
 * 한줄평/등급 라벨의 EN/JA 번역이 Phase 2이므로, EN/JA 사용자가 홈에서 이 기능을
 * 발견해 들어갔다가 한국어 콘텐츠를 마주하는 경로 자체를 차단하는 것이 목적이다.
 * (링크를 직접 받아 들어오는 경로는 막지 않는다 — 막으면 바이럴 루프가 끊긴다)
 *
 * 기존 유료 1:1 궁합 카드와 나란히 놓이므로 "무료/링크 공유형" 톤을 카피로 구분한다.
 */
export const FriendUniverseCard = ({ onClick }: FriendUniverseCardProps) => {
  const t = useTranslations("universe.home");

  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <div className={styles.content}>
        <h2 className={styles.title}>{t("title")}</h2>
        <p className={styles.subtitle}>{t("subtitle")}</p>
        <span className={styles.badge}>FREE</span>
        <span className={styles.orbit} aria-hidden="true" />
      </div>
      <div className={styles.button}>
        <span>{t("button")}</span>
      </div>
    </button>
  );
};
