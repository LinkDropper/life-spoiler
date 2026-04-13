"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import styles from "./AnalysisLoading.module.css";

const LOTTIE_SRC = "/lottie/face-loading.lottie";

const MESSAGE_CHANGE_INTERVAL_MS = 2500;

export const AnalysisLoading = () => {
  const t = useTranslations("faceSpoiler.loading");

  const messages = useMemo(
    () => [
      t("analyzing", { default: "얼굴을 분석하고 있어요..." }),
      t("readingFeatures", { default: "인상 특징을 읽고 있어요..." }),
      t("interpreting", { default: "성향을 해석하고 있어요..." }),
      t("writing", { default: "리포트를 작성하고 있어요..." }),
    ],
    [t]
  );

  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, MESSAGE_CHANGE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.lottieWrapper}>
          <DotLottieReact
            src={LOTTIE_SRC}
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
