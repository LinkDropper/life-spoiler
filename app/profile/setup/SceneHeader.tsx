"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import styles from "./SceneHeader.module.css";

interface SceneHeaderProps {
  step: 1 | 2;
  title: string;
  description: string;
}

const TOTAL_STEPS = 2;

/**
 * 프로필 만들기 단계 머리. 상영관 컨셉에 맞춰 단계를 "장면"으로 부른다
 * (1: 주인공, 2: 지금 장면). 진행 막대는 장식이라 스크린리더에는 숫자로 읽힌다.
 */
export const SceneHeader = ({ step, title, description }: SceneHeaderProps) => {
  const t = useTranslations("profileSetup.scene");
  const titleRef = useRef<HTMLHeadingElement>(null);
  const previousStepRef = useRef(step);

  // 단계가 바뀌면 새 제목으로 포커스를 옮겨 스크린리더가 다음 장면을 읽게 한다(첫 화면은 그대로)
  useEffect(() => {
    if (previousStepRef.current === step) {
      return;
    }
    previousStepRef.current = step;
    titleRef.current?.focus();
  }, [step]);

  return (
    <div className={styles.header}>
      <p className={styles.scene}>
        <span>{step === 1 ? t("one") : t("two")}</span>
        <span
          className={styles.bars}
          role="img"
          aria-label={t("progress", { current: step, total: TOTAL_STEPS })}
        >
          {Array.from({ length: TOTAL_STEPS }, (_, index) => (
            <span
              key={index}
              className={`${styles.bar} ${index < step ? styles.barDone : ""}`}
            />
          ))}
        </span>
      </p>
      <h1 ref={titleRef} className={styles.title} tabIndex={-1}>
        {title}
      </h1>
      <p className={styles.description}>{description}</p>
    </div>
  );
};
