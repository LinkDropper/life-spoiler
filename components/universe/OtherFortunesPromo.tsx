"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import styles from "./OtherFortunesPromo.module.css";

interface OtherFortunesPromoProps {
  /** 입장을 마친 방문자에게는 이 버튼이 화면의 주 버튼이 된다(채움), 아니면 외곽선 */
  isPrimary: boolean;
}

/**
 * 5번 영역 — "이번엔 내 시사회 열기" + 다른 운세 상영 시간표.
 *
 * 링크를 받아 들어온 방문자가 "나도 열어볼까"로 이어지는 바이럴 루프의 핵심 진입점이다
 * (PRD 목표 2). 기존 라우팅을 그대로 재사용한다(신규 라우팅 없음). 이 기능만 익명이고
 * 다른 상품은 기존대로 로그인이 필요하므로, 진입 시 기존 로그인 플로우가 자연히 개입한다.
 */
export const OtherFortunesPromo = ({ isPrimary }: OtherFortunesPromoProps) => {
  const t = useTranslations("universe.detail");

  const items = [
    { href: "/profiles?type=lifetime", label: t("promoLifetime") },
    { href: "/profiles?type=yearly", label: t("promoYearly") },
    { href: "/profiles?type=yearly_2027", label: t("promoNextYear") },
    { href: "/compatibility", label: t("promoCompatibility") },
  ];

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{t("promoTitle")}</h2>

      <Link
        href="/universe/create"
        className={`${styles.cta} ${isPrimary ? styles.ctaPrimary : styles.ctaGhost}`}
      >
        {t("promoMyUniverse")}
        <small className={styles.free}>{t("promoFree")}</small>
      </Link>

      <ul className={styles.timetable}>
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={styles.row}>
              <b>{item.label}</b>
              <span>{t("promoPrice")}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
