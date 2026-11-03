"use client";

import { useTranslations } from "next-intl";

import { toEventPriceText, useIsFirstPaymentEvent } from "@/libs/hooks/payment";

import styles from "./DawnScene.module.css";
import { useLandingCta } from "../useLandingCta";

/** 영화 상영 안내처럼 보여줄 항목 */
const INFO_KEYS = ["runtime", "screen", "fee", "rating"] as const;

/**
 * 장면 8 — 마지막 상영 안내와 CTA.
 * 장식 그라디언트 없이 기존 랜딩 문법(밤색 바탕, 분홍 1px 선, 분홍 주 버튼)으로 마무리한다.
 */
export const DawnScene = () => {
  const t = useTranslations("landing.cinema.dawn");
  const tCta = useTranslations("landing.cta");
  const isEvent = useIsFirstPaymentEvent();
  const { isAuthenticated, handleCtaClick } = useLandingCta("dawn");

  const price = isEvent
    ? toEventPriceText(tCta("priceBadge"))
    : tCta("priceBadge");

  return (
    <section className={styles.section} aria-labelledby="dawn-title">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <h2 id="dawn-title" className={styles.title}>
            {t("title")}
          </h2>
          <p className={styles.description}>{t("description")}</p>
          <button
            type="button"
            className={styles.button}
            onClick={handleCtaClick}
            data-landing-cta
          >
            <span>
              {isAuthenticated ? t("buttonAuthenticated") : t("button")}
            </span>
            {!isAuthenticated && (
              <span className={styles.priceBadge}>{price}</span>
            )}
          </button>
        </div>

        <dl className={styles.info}>
          {INFO_KEYS.map((key) => (
            <div key={key} className={styles.infoRow}>
              <dt className={styles.infoLabel}>{t(`info.${key}.label`)}</dt>
              <dd className={styles.infoValue}>
                {t(`info.${key}.value`, { price })}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};
