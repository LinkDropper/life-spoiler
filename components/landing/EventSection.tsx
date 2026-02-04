"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import styles from "./EventSection.module.css";

const DEADLINE = new Date("2026-02-05T12:00:00+09:00");

const INSTART_URL =
  "https://www.instagram.com/life.spoiler_?igsh=MTluajNqeTVhZjFrNQ%3D%3D&utm_source=qr";

const calculateTimeLeft = () => {
  const now = new Date();
  const diff = DEADLINE.getTime() - now.getTime();

  if (diff <= 0) {
    return { hours: 0, minutes: 0, isExpired: true };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes, isExpired: false };
};

const EventSection = ({ isResultPage }: { isResultPage?: boolean }) => {
  const t = useTranslations("landing.event");
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000 * 60);

    return () => clearInterval(timer);
  }, []);

  if (timeLeft.isExpired) {
    return null;
  }

  return (
    <section
      className={`${styles.container} ${isResultPage ? styles.resultPage : ""}`}
    >
      <div className={styles.content}>
        <div className={styles.titleWrapper}>
          <div className={styles.titleRow}>
            <span className={styles.mainTitle}>
              {t("title", { default: "인생스포" })}
            </span>
            <div className={styles.badge}>
              <span className={styles.badgeText}>
                {t("badge", { default: "+2000" })}
              </span>
            </div>
          </div>
          <h2 className={styles.subTitle}>
            {t("subTitle", { default: "회원가입 이벤트" })}
          </h2>
          <div className={styles.underline} />
        </div>

        <div className={styles.timerBox}>
          <div className={styles.timerText}>
            {t("timerPrefix", { default: "⏳ 할인 혜택 마감까지" })}{" "}
            <span className={styles.timerTextHighlight}>
              {t("timerTime", {
                hours: timeLeft.hours,
                minutes: timeLeft.minutes,
                default: `${timeLeft.hours}시간 ${timeLeft.minutes}분`,
              })}
            </span>
            {t("timerSuffix", { default: "남았어요!" })}
          </div>
        </div>
      </div>

      <div className={styles.instructionBox}>
        <p className={styles.instructionText}>
          {t("instruction1", {
            default: "1. 결과 화면을 인스타 스토리에 공유해주세요.",
          })}
          <br />
          {t("instruction2Prefix", { default: "2." })}{" "}
          <Link
            href={INSTART_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.instargramLink}
          >
            @life.spoiler_
          </Link>{" "}
          <span className={styles.instructionTextHighlight}>
            {t("instruction2Suffix", { default: "태그 필수!" })}
          </span>
          <br />
          {t("instruction3Prefix", { default: "3. 저에게 DM으로" })}{" "}
          <span className={styles.instructionTextHighlight}>
            {t("instruction3Keyword", { default: "'참여완료'" })}
          </span>
          {t("instruction3Suffix", { default: "라고 보내주세요." })}
        </p>
      </div>
    </section>
  );
};

export default EventSection;
