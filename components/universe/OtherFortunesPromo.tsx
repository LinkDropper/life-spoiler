"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import styles from "./OtherFortunesPromo.module.css";

/**
 * 5번 영역 — 다른 운세 홍보.
 *
 * 기존 라우팅을 그대로 재사용한다(신규 라우팅 없음). 이 기능만 익명이고
 * 다른 상품은 기존대로 로그인이 필요하므로, 진입 시 기존 로그인 플로우가 자연히 개입한다.
 */
export const OtherFortunesPromo = () => {
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
      <ul className={styles.grid}>
        {/*
          이 우주를 링크로 받아 들어온 방문자가 "나도 만들어볼까"로 이어지는
          바이럴 루프의 핵심 진입점이다(PRD 목표 2). 그래서 나머지 4개(기존
          유료 상품 열람)와 같은 카드가 아니라, 공유 버튼과 동일한 흰색 필
          스타일로 시각적 우선순위를 주고 2열 그리드에서 단독으로 한 줄을 쓴다.
        */}
        <li className={styles.wide}>
          <Link href="/universe/create" className={styles.primaryCard}>
            <span>{t("promoMyUniverse")}</span>
            <span className={styles.freeTag}>{t("promoFree")}</span>
          </Link>
        </li>
        {/* 무료인 "내 우주 만들러 가기"만 튀지 않도록, 유료 상품에도 가격을 함께 보여줘 대비를 준다 */}
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={styles.card}>
              <span>{item.label}</span>
              <span className={styles.priceTag}>{t("promoPrice")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
