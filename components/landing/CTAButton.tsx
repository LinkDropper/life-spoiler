"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { useIsFirstPaymentEvent, toEventPriceText } from "@/libs/hooks/payment";

import styles from "./CTAButton.module.css";
import { useLandingCta } from "./useLandingCta";

interface StickyCtaState {
  /** 장면 안의 CTA가 화면에 보이면 하단 고정 CTA를 내려 두 버튼이 겹치지 않게 한다 */
  isSceneCtaVisible: boolean;
  /** 첫 화면을 지나면 말풍선을 접어 고정 장면이 쓸 세로 공간(약 45px)을 돌려준다 */
  isPastIntro: boolean;
}

const useStickyCtaState = (): StickyCtaState => {
  const [state, setState] = useState<StickyCtaState>({
    isSceneCtaVisible: false,
    isPastIntro: false,
  });

  useEffect(() => {
    let frameId = 0;
    const check = () => {
      frameId = 0;
      const { innerHeight, innerWidth } = window;
      // 가로로 감기는 필름 안의 CTA도 있어 세로·가로를 함께 본다
      const visible = Array.from(
        document.querySelectorAll("[data-landing-cta]")
      ).some((element) => {
        const rect = element.getBoundingClientRect();
        return (
          rect.width > 0 &&
          rect.bottom > 0 &&
          rect.top < innerHeight &&
          rect.right > 0 &&
          rect.left < innerWidth
        );
      });
      const isPastIntro = window.scrollY > innerHeight * 0.5;
      setState((current) =>
        current.isSceneCtaVisible === visible &&
        current.isPastIntro === isPastIntro
          ? current
          : { isSceneCtaVisible: visible, isPastIntro }
      );
    };
    const handleScroll = () => {
      if (!frameId) frameId = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return state;
};

export const CTAButton = () => {
  const t = useTranslations("landing.cta");
  const isEvent = useIsFirstPaymentEvent();
  const { isAuthenticated, handleCtaClick } = useLandingCta("sticky");
  const { isSceneCtaVisible: isHidden, isPastIntro } = useStickyCtaState();

  return (
    <div
      className={`${styles.wrapper} ${isHidden ? styles.wrapperHidden : ""}`}
      aria-hidden={isHidden || undefined}
      inert={isHidden || undefined}
    >
      <div className={styles.container}>
        {!isAuthenticated && !isPastIntro && (
          <p className={styles.tooltip}>
            {t("subtext", { default: "3분이면 충분해요" })}
          </p>
        )}
        <button
          type="button"
          className={styles.button}
          onClick={handleCtaClick}
        >
          {isAuthenticated ? (
            <>
              <span className={styles.text}>
                {t("buttonAuthenticated", {
                  default: "내 운세 결과 보기",
                })}
              </span>
              <Image
                src="/images/landing/arrow-right.svg"
                alt=""
                width={24}
                height={24}
              />
            </>
          ) : (
            <>
              <span className={styles.text}>
                {t("button", {
                  default: "내 전성기 확인하기",
                })}
              </span>
              <span className={styles.priceBadge}>
                {isEvent
                  ? toEventPriceText(t("priceBadge", { default: "990원" }))
                  : t("priceBadge", { default: "990원" })}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
