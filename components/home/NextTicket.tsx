"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  SCREENING_MANUAL_ATTRIBUTE,
  preloadTheater,
  useScreening,
} from "@/components/screening";
import { isPlainLeftClick } from "@/libs/screening/screening-policy";

import {
  YEARLY_AFTER_LIFETIME_PER_100,
  getFortuneHref,
} from "@/libs/home/home-profile";

import styles from "./NextTicket.module.css";

import type { CSSProperties, MouseEvent } from "react";
import type { HomeFortuneKey } from "@/libs/home/home-profile";
import type { ProfileWithFortunes } from "@/libs/stores/profile/types";

interface NextTicketProps {
  profile: ProfileWithFortunes;
  fortuneKey: HomeFortuneKey;
  onClick: () => void;
}

/**
 * 다음 상영작 — 랜딩 "본편 관람권"과 같은 가로형 실물 티켓(본문 + 세로 절취선 + 꼬리표).
 * 인생 운세 소장자에게만 보인다(paywalls: 가치를 경험한 뒤에 권한다).
 * 주 버튼은 히어로 하나만 두려고 관람권 버튼은 외곽선으로 낮춘다.
 *
 * 누르면 꼬리표가 랜딩 관람권 장면과 같은 움직임으로 세로 절취선에서 벌어지고,
 * 그 움직임이 끝난 뒤에 상영관 입장 전환으로 이어진다
 * (docs/home-redesign-2026-11.md §8). 기다리는 동안 목적지를 미리 받아 둔다.
 */

/**
 * 찢김 연출 길이 — CSS 변수(--tear-ms)로 넘겨 애니메이션과 맞춘다.
 * 랜딩 관람권과 같은 짧은 움직임이라 0.6초면 충분하다(2026-11-04: 1초 낙하 연출은 과하다는 피드백).
 */
const TEAR_MS = 600;
export const NextTicket = ({
  profile,
  fortuneKey,
  onClick,
}: NextTicketProps) => {
  const t = useTranslations("home");
  const tFortune = useTranslations("fortune");
  const tScreening = useTranslations("screening");
  const isYearly = fortuneKey === "yearly";
  const href = getFortuneHref(profile, fortuneKey);
  const router = useRouter();
  const { startScreening } = useScreening();
  const [tearState, setTearState] = useState<"idle" | "tearing" | "torn">(
    "idle"
  );
  const tearTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(tearTimerRef.current), []);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (tearState !== "idle") {
      // 찢는 중에 다시 누르면 아무것도 하지 않는다(이동은 이미 진행 중)
      event.preventDefault();
      return;
    }
    onClick();
    if (!isPlainLeftClick(event)) {
      return;
    }
    event.preventDefault();
    const trigger = event.currentTarget;
    const options = {
      href,
      title: tScreening("trailer", { title: t(`${fortuneKey}.title`) }),
      entry: "ticket" as const,
      trigger,
    };
    // 모션 줄이기: 찢김 없이 바로 넘긴다(전환 정책도 즉시 이동)
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      startScreening(options);
      return;
    }
    setTearState("tearing");
    router.prefetch(href);
    // 찢기는 동안 3D 상영관을 받는다(홈에서 이미 받았으면 바로 끝난다)
    preloadTheater();
    // 안드로이드: 종이가 찢기는 짧은 진동 (iOS는 지원하지 않음)
    navigator.vibrate?.(12);
    tearTimerRef.current = setTimeout(() => {
      setTearState("torn");
      startScreening(options);
    }, TEAR_MS);
  };

  return (
    <section className={styles.section} aria-labelledby="home-next-title">
      <h2 id="home-next-title" className={styles.heading}>
        {t("next.title")}
      </h2>
      {isYearly && (
        <>
          <strong className={styles.stat}>
            {t("next.stat", { count: YEARLY_AFTER_LIFETIME_PER_100 })}
          </strong>
          <p className={styles.proof}>{t("next.statCaption")}</p>
        </>
      )}

      <Link
        href={href}
        // 찢김을 보여 준 뒤 직접 상영을 시작하므로 전역 링크 가로채기에서 뺀다
        {...{ [SCREENING_MANUAL_ATTRIBUTE]: "" }}
        className={[
          styles.ticket,
          tearState === "tearing" ? styles.tearing : "",
          tearState !== "idle" ? styles.torn : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ "--tear-ms": `${TEAR_MS}ms` } as CSSProperties}
        aria-disabled={tearState !== "idle" || undefined}
        onClick={handleClick}
      >
        <span className={styles.body}>
          <span className={styles.kind}>
            {t("next.ticketTitle", { title: t(`${fortuneKey}.title`) })}
            <span className={styles.count}>{t("next.admit")}</span>
          </span>
          {isYearly ? (
            <span className={styles.scenes}>
              <span className={styles.scene}>
                <b>{tFortune("preview.yearlySpoilerTitle")}</b>
                <span>{t("next.yearlySpoiler")}</span>
              </span>
              <span className={styles.scene}>
                <b>{tFortune("yearly.monthly.title")}</b>
                <span>{t("next.yearlyMonthly")}</span>
              </span>
            </span>
          ) : (
            <span className={styles.scenes}>
              <span className={styles.scene}>
                <b>{t(`${fortuneKey}.title`)}</b>
                <span>{t(`${fortuneKey}.subtitle`)}</span>
              </span>
            </span>
          )}
          <span className={styles.free}>{t("next.free")}</span>
        </span>
        {/* 찢겨 나가는 꼬리표: 세로 절취선 오른쪽 */}
        <span className={styles.tearOff}>
          <span className={styles.barcode} aria-hidden="true" />
          <span className={styles.action}>
            {t("next.cta")}
            <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M6 3l5 5-5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>
      </Link>
    </section>
  );
};
