import { getTranslations } from "next-intl/server";

import { CrtScreen } from "./CrtScreen";
import styles from "./DisclaimerSection.module.css";

/** 비디오테이프 첫 화면의 경고문처럼 읽히는 세 줄 */
const LINE_KEYS = ["line1", "line2", "line3"] as const;

/**
 * 면책 안내 — 영화가 시작되기 전 나오는 "FBI WARNING" 화면을 빌린 브랜드 위트.
 * 웃음 포인트는 유지하되, 콘텐츠 가이드라인의 법적 문구(재미로 보는 운세,
 * 의료·법률·투자 판단 아님)를 실제로 담는다.
 * 문구는 서버에서 그리고, 브라운관이 켜지는 연출만 CrtScreen이 맡는다.
 */
export const DisclaimerSection = async () => {
  const t = await getTranslations("landing.disclaimer");

  return (
    <section className={styles.container} aria-labelledby="disclaimer-title">
      <CrtScreen className={styles.screen}>
        <h2 id="disclaimer-title" className={styles.badge} data-crt-badge>
          {t("badge")}
        </h2>
        <div className={styles.body}>
          {LINE_KEYS.map((key) => (
            <p key={key} className={styles.line} data-crt-line>
              {t(key)}
            </p>
          ))}
        </div>
      </CrtScreen>
    </section>
  );
};
