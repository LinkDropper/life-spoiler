"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import type { YearlyInsights } from "@/libs/zi-wei-dou-shu/calculators";

import styles from "./YearlyInsightsCard.module.css";

const PREVIEW_PLACEHOLDER = "???";

interface YearlyInsightsCardProps {
  insights: YearlyInsights;
  /** 미리보기 모드 - 하단 3개 항목 값 마스킹 */
  preview?: boolean;
}

/**
 * 연간 인사이트 카드 컴포넌트
 *
 * @description
 * - 최고의 달, 조심할 달, 재물, 연애, 행운의 장소, 귀인, 건강, 행운의 색상 표시
 * - 각 항목은 아이콘 + 라벨 + 점선 + 값 형태
 */
export default function YearlyInsightsCard({
  insights,
  preview = false,
}: YearlyInsightsCardProps) {
  const t = useTranslations("fortune.yearly.insights");

  // 최고의 달 (1순위)
  const bestMonth = insights.bestMonths[0]?.month;

  // 조심할 달 (1순위)
  const cautionMonth = insights.cautionMonths[0]?.month;

  // 재물 공략 (추천 분야 우선, 없으면 핵심 전략)
  const wealthArea =
    insights.wealthStrategy.recommendedAreas[0] ||
    insights.wealthStrategy.mainStrategy;

  // 연애 모드
  const romanceMode = insights.romanceMode.mode;

  // 행운의 장소 (방위 + 장소)
  const [luckyPlace] = insights.luckyPlaces;
  const placeText = luckyPlace
    ? `${luckyPlace.direction}/${luckyPlace.placeTypes[0] || ""}`
    : "";

  // 귀인 (삼합 동물들)
  const nobleAnimals = insights.nobleHelper.samhap.animals.slice(0, 2);
  const nobleText = nobleAnimals.map((a) => `${a}띠`).join("/");

  // 건강 (주의사항 중 상위 2개)
  const healthConcerns = insights.healthWarning.concerns.slice(0, 2);
  const healthText = healthConcerns.join("/");

  // 행운의 색상
  const luckyColorText = insights.luckyColor.primary;

  const icon = (name: string) => (
    <Image src={`/icons/insights/${name}.svg`} alt="" width={20} height={20} />
  );

  const insightItems = [
    {
      icon: icon("moon-filled"),
      label: t("bestMonth"),
      value: t("monthFormat", { month: bestMonth }),
    },
    {
      icon: icon("ghost-filled"),
      label: t("cautionMonth"),
      value: t("monthFormat", { month: cautionMonth }),
    },
    {
      icon: icon("diamond-filled"),
      label: t("wealth"),
      value: wealthArea,
    },
    {
      icon: icon("heart-filled"),
      label: t("romance"),
      value: romanceMode,
    },
    {
      icon: icon("map-pin-filled"),
      label: t("luckyPlace"),
      value: placeText,
    },
    {
      icon: icon("mood-happy-filled"),
      label: t("nobleHelper"),
      value: preview ? PREVIEW_PLACEHOLDER : nobleText,
    },
    {
      icon: icon("health-filled"),
      label: t("health"),
      value: preview ? PREVIEW_PLACEHOLDER : healthText,
    },
    {
      icon: icon("circle-filled"),
      label: t("luckyColor"),
      value: preview ? PREVIEW_PLACEHOLDER : luckyColorText,
    },
  ];

  return (
    <div className={styles.card}>
      {insightItems.map((item, index) => (
        <div key={index} className={styles.row}>
          <div className={styles.labelGroup}>
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </div>
          <div className={styles.divider} />
          <span className={styles.value}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}
