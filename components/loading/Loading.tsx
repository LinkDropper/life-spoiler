"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { useLocale } from "next-intl";

import loadingAnimation from "./loading.json";

import styles from "./Loading.module.css";

const MESSAGE_CHANGE_INTERVAL_MS = 3000;

const LOADING_MESSAGES: Record<string, string[]> = {
  ko: [
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
  ],
  en: [
    "Connecting with your guardian star...",
    "Calculating cosmic energy from your birth moment",
    "The Emperor Star 'Zi Wei' is watching you",
    "Downloading your 2026 destiny spoilers...",
    "Arranging the stars into your birth chart",
    "Finding the perfect timing for your fortune",
    "Decoding signals from the future",
    "Scanning for life-changing opportunities",
    "Searching for lucky stars to guide your path",
    "Ready for goosebumps? Results coming soon!",
  ],
  ja: [
    "あなたの守護星と交信中です...",
    "生まれたその瞬間、宇宙のエネルギーを計算中",
    "皇帝の星「紫微星」があなたを見つめています",
    "2026年運命のネタバレをダウンロード中...",
    "夜空の星々をあなたの命盤に配置中",
    "無数の星の中から幸運の時期を探索中",
    "未来からのシグナルを解読しています",
    "人生の決定的なチャンスをスキャン中",
    "運命を切り開く「吉星」を探しています",
    "鳥肌の準備はできましたか？結果まもなく！",
  ],
};

export const Loading = () => {
  const locale = useLocale();
  const [messageIndex, setMessageIndex] = useState(0);

  const messages = LOADING_MESSAGES[locale] || LOADING_MESSAGES.ko;

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, MESSAGE_CHANGE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [messages.length]);

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
        <p className={styles.message}>{messages[messageIndex]}</p>
      </div>
    </div>
  );
};
