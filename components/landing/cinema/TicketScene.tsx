"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";

import { toEventPriceText, useIsFirstPaymentEvent } from "@/libs/hooks/payment";

import { gsap, MOTION_QUERY, SplitText, useGSAP } from "./gsap";
import styles from "./TicketScene.module.css";
import { useLandingCta } from "../useLandingCta";

/** 본편(인생 운세 결제 후)에 실제로 담기는 결과 섹션 */
const SCENE_KEYS = ["spoiler", "chart", "categories", "ageScenario"] as const;

/**
 * 장면 6 — "예고편은 무료 / 본편은 990원"이 스크롤을 따라 차오르고,
 * 비스듬히 놓인 관람권이 바로 선 다음 절취선을 따라 찢어진다.
 * 첫 결제 이벤트 기간(ko)에는 금액이 이벤트가로 바뀐다.
 */
export const TicketScene = () => {
  const t = useTranslations("landing.cinema.ticket");
  const isEvent = useIsFirstPaymentEvent();
  const { isAuthenticated, handleCtaClick } = useLandingCta("ticket");
  const stageRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  const price = isEvent ? toEventPriceText(t("price")) : t("price");
  const originalPrice = isEvent ? t("price") : t("originalPrice");

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERY, () => {
        const split = SplitText.create(headlineRef.current, {
          type: "chars",
        });
        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: stageRef.current,
              start: "top top",
              end: "bottom bottom",
              scrub: true,
            },
          })
          .from(split.chars, { opacity: 0.16, stagger: 0.02, duration: 0.1 }, 0)
          .from(
            `.${styles.ticket}`,
            {
              rotateX: 58,
              rotateZ: -10,
              yPercent: 30,
              opacity: 0,
              duration: 0.35,
            },
            0.15
          )
          .to(
            `.${styles.stub}`,
            { y: 26, rotateZ: -3, transformOrigin: "100% 0%", duration: 0.2 },
            0.7
          )
          .set({}, {}, 1);
      });
    },
    { scope: stageRef, dependencies: [price], revertOnUpdate: true }
  );

  return (
    <section
      ref={stageRef}
      className={styles.stage}
      aria-labelledby="ticket-title"
    >
      <div className={styles.viewport}>
        <div className={styles.layout}>
          <h2 id="ticket-title" ref={headlineRef} className={styles.headline}>
            {/* SplitText가 줄바꿈 문자를 지우므로 줄을 요소로 나눈다 */}
            <span className={styles.headlineLine}>{t("headlineFree")}</span>
            <span className={styles.headlineLine}>
              {t("headlinePaid", { price })}
            </span>
          </h2>

          <div className={styles.scene3d}>
            <div className={styles.ticket}>
              <div className={styles.body}>
                <span className={styles.ticketTitle}>{t("ticketTitle")}</span>
                <ul className={styles.scenes}>
                  {SCENE_KEYS.map((key) => (
                    <li key={key} className={styles.sceneItem}>
                      <span className={styles.sceneName}>
                        {t(`scenes.${key}.name`)}
                      </span>
                      <span className={styles.sceneDescription}>
                        {t(`scenes.${key}.description`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles.perforation} aria-hidden="true" />
              <div className={styles.stub}>
                <div className={styles.priceRow}>
                  <span className={styles.originalPrice}>
                    <span className={styles.srOnly}>
                      {t("originalPriceLabel")}
                    </span>
                    {originalPrice}
                  </span>
                  <span className={styles.price}>
                    <span className={styles.srOnly}>{t("priceLabel")}</span>
                    {price}
                  </span>
                </div>
                <p className={styles.anchor}>
                  {isEvent ? t("eventNote") : t("anchor")}
                </p>
                <button
                  type="button"
                  className={styles.button}
                  onClick={handleCtaClick}
                  data-landing-cta
                >
                  {isAuthenticated ? t("buttonAuthenticated") : t("button")}
                </button>
                <p className={styles.note}>{t("freePreviewNote")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
