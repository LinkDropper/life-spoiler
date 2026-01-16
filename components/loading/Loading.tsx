"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

import loadingAnimation from "./loading.json";

import styles from "./Loading.module.css";

const MESSAGE_CHANGE_INTERVAL_MS = 3000;

const LOADING_MESSAGES = [
  "당신의 수호성과 교신 중입니다...",
  "태어난 그 시각, 우주의 기운을 계산합니다",
  "제왕의 별, '자미성'이 당신을 주목하고 있습니다",
  "2026년 운명의 스포일러를 다운로드 중...",
  "밤하늘의 별들을 당신의 명반으로 배치하는 중",
  "수많은 별들 중 '돈복' 터지는 시기를 찾는 중",
  "미래에서 온 시그널을 해독하고 있습니다",
  "이번 생의 결정적 기회를 스캔 중입니다",
  "꽉 막힌 운명을 뚫어줄 '길성(吉星)'을 찾는 중",
  "소름 돋을 준비 되셨나요? 결과 생성 임박!",
];

export const Loading = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, MESSAGE_CHANGE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.lottieWrapper}>
          <Lottie
            animationData={loadingAnimation}
            loop
            autoplay
            className={styles.lottie}
          />
        </div>
        <p className={styles.message}>{LOADING_MESSAGES[messageIndex]}</p>
      </div>
    </div>
  );
};
