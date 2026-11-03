"use client";

import { useRef } from "react";
import { useLocale, useTranslations } from "next-intl";

import { REVIEW_KEYS } from "@/constants/reviews";

import { gsap, MOTION_QUERY, useGSAP } from "./gsap";
import styles from "./ProofScene.module.css";

interface ProofSceneProps {
  /** 지금까지 생성된 운세·궁합 건수. 조회 실패 시 null이면 카운터를 숨긴다 */
  totalCount: number | null;
}

/** 두 줄로 나눠 반대 방향으로 흐르게 한다 */
const ROWS = [REVIEW_KEYS.slice(0, 4), REVIEW_KEYS.slice(4)] as const;

/**
 * 장면 7 — 실시간 누적 건수 카운터와 흐르는 후기.
 * 후기는 마우스를 올리거나 포커스하면 멈추고, 움직임 줄이기 설정에선 손으로 넘긴다.
 */
export const ProofScene = ({ totalCount }: ProofSceneProps) => {
  const t = useTranslations("landing.cinema.proof");
  const tReviews = useTranslations("landing.reviews");
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (totalCount === null || !counterRef.current) return;
      const counter = counterRef.current;
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERY, () => {
        const value = { current: 0 };
        gsap.to(value, {
          current: totalCount,
          duration: 1.8,
          ease: "power3.out",
          scrollTrigger: { trigger: counter, start: "top 80%", once: true },
          onUpdate: () => {
            counter.textContent = Math.round(value.current).toLocaleString(
              locale
            );
          },
        });
      });
    },
    {
      scope: sectionRef,
      dependencies: [totalCount, locale],
      revertOnUpdate: true,
    }
  );

  const renderCard = (key: (typeof REVIEW_KEYS)[number]) => (
    <>
      {/* 후기 원문에 `<키워드 - ...>` 같은 꺾쇠가 있어 ICU 태그로 해석되지 않게 raw로 읽는다 */}
      <p className={styles.content}>
        {String(tReviews.raw(`items.${key}.content`))}
      </p>
      <span className={styles.name}>{tReviews(`items.${key}.name`)}</span>
    </>
  );

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      aria-labelledby="proof-title"
    >
      <div className={styles.header}>
        {totalCount !== null ? (
          <h2 id="proof-title" className={styles.counterLine}>
            <span ref={counterRef} className={styles.counter}>
              {totalCount.toLocaleString(locale)}
            </span>
            <span className={styles.counterLabel}>{t("counterLabel")}</span>
          </h2>
        ) : (
          <h2 id="proof-title" className={styles.counterLabel}>
            {t("fallbackTitle")}
          </h2>
        )}
      </div>

      <div className={styles.rows}>
        {ROWS.map((keys, rowIndex) => (
          <div
            key={keys.join("-")}
            className={`${styles.marquee} ${rowIndex === 1 ? styles.reverse : ""}`}
          >
            <ul
              className={styles.track}
              tabIndex={0}
              aria-label={t("listLabel")}
            >
              {keys.map((key) => (
                <li key={key} className={styles.card}>
                  {renderCard(key)}
                </li>
              ))}
              {/* 끊김 없이 흐르도록 한 벌 더 붙인다 (보조기기에는 숨김) */}
              {keys.map((key) => (
                <li
                  key={`${key}-clone`}
                  className={`${styles.card} ${styles.clone}`}
                  aria-hidden="true"
                >
                  {renderCard(key)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};
