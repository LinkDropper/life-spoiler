"use client";

import { useTranslations } from "next-intl";

import type { YearlyInsights } from "@/libs/zi-wei-dou-shu/calculators";

import styles from "./YearlyInsightsCard.module.css";

interface YearlyInsightsCardProps {
  insights: YearlyInsights;
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
}: YearlyInsightsCardProps) {
  const t = useTranslations("fortune.yearly.insights");

  // 최고의 달 (1순위)
  const bestMonth = insights.bestMonths[0]?.month;

  // 조심할 달 (1순위)
  const cautionMonth = insights.cautionMonths[0]?.month;

  // 재물 공략 (추천 분야 중 첫 번째)
  const wealthArea = insights.wealthStrategy.recommendedAreas[0] || "";

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

  const insightItems = [
    {
      icon: <MoonIcon />,
      label: t("bestMonth"),
      value: t("monthFormat", { month: bestMonth }),
    },
    {
      icon: <GhostIcon />,
      label: t("cautionMonth"),
      value: t("monthFormat", { month: cautionMonth }),
    },
    {
      icon: <DiamondIcon />,
      label: t("wealth"),
      value: wealthArea,
    },
    {
      icon: <HeartIcon />,
      label: t("romance"),
      value: romanceMode,
    },
    {
      icon: <MapPinIcon />,
      label: t("luckyPlace"),
      value: placeText,
    },
    {
      icon: <SmileIcon />,
      label: t("nobleHelper"),
      value: nobleText,
    },
    {
      icon: <HealthIcon />,
      label: t("health"),
      value: healthText,
    },
    {
      icon: <CircleIcon color={insights.luckyColor.primary} />,
      label: t("luckyColor"),
      value: luckyColorText,
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

// 아이콘 컴포넌트들
const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M10 2.5C5.858 2.5 2.5 5.858 2.5 10C2.5 14.142 5.858 17.5 10 17.5C13.158 17.5 15.833 15.483 16.892 12.667C16.975 12.442 16.883 12.192 16.683 12.058C16.483 11.925 16.217 11.942 16.042 12.1C15.167 12.858 14.033 13.333 12.792 13.333C10.033 13.333 7.792 11.092 7.792 8.333C7.792 6.025 9.308 4.075 11.392 3.408C11.617 3.333 11.758 3.117 11.733 2.883C11.708 2.65 11.525 2.467 11.292 2.442C10.867 2.458 10.433 2.5 10 2.5Z"
      fill="white"
    />
  </svg>
);

const GhostIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M10 1.667C6.317 1.667 3.333 4.65 3.333 8.333V16.667C3.333 17.108 3.608 17.5 4.017 17.65C4.425 17.8 4.883 17.675 5.158 17.342L6.667 15.417L8.175 17.342C8.5 17.733 9.083 17.833 9.533 17.583C9.675 17.5 9.833 17.5 9.975 17.583C10.425 17.833 11.008 17.733 11.333 17.342L12.842 15.417L14.35 17.342C14.625 17.675 15.083 17.8 15.492 17.65C15.9 17.5 16.175 17.108 16.175 16.667V8.333C16.667 4.65 13.683 1.667 10 1.667ZM7.5 9.167C6.808 9.167 6.25 8.608 6.25 7.917C6.25 7.225 6.808 6.667 7.5 6.667C8.192 6.667 8.75 7.225 8.75 7.917C8.75 8.608 8.192 9.167 7.5 9.167ZM12.5 9.167C11.808 9.167 11.25 8.608 11.25 7.917C11.25 7.225 11.808 6.667 12.5 6.667C13.192 6.667 13.75 7.225 13.75 7.917C13.75 8.608 13.192 9.167 12.5 9.167Z"
      fill="white"
    />
  </svg>
);

const DiamondIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M16.667 7.5L10 17.5L3.333 7.5L6.667 2.5H13.333L16.667 7.5Z"
      fill="white"
    />
  </svg>
);

const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M10 17.5L8.792 16.408C4.5 12.517 1.667 9.958 1.667 6.833C1.667 4.275 3.683 2.25 6.25 2.25C7.7 2.25 9.092 2.925 10 3.992C10.908 2.925 12.3 2.25 13.75 2.25C16.317 2.25 18.333 4.275 18.333 6.833C18.333 9.958 15.5 12.517 11.208 16.417L10 17.5Z"
      fill="white"
    />
  </svg>
);

const MapPinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M10 1.667C6.783 1.667 4.167 4.283 4.167 7.5C4.167 11.875 10 18.333 10 18.333C10 18.333 15.833 11.875 15.833 7.5C15.833 4.283 13.217 1.667 10 1.667ZM10 9.583C8.85 9.583 7.917 8.65 7.917 7.5C7.917 6.35 8.85 5.417 10 5.417C11.15 5.417 12.083 6.35 12.083 7.5C12.083 8.65 11.15 9.583 10 9.583Z"
      fill="white"
    />
  </svg>
);

const SmileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M10 1.667C5.4 1.667 1.667 5.4 1.667 10C1.667 14.6 5.4 18.333 10 18.333C14.6 18.333 18.333 14.6 18.333 10C18.333 5.4 14.6 1.667 10 1.667ZM7.5 7.5C8.192 7.5 8.75 8.058 8.75 8.75C8.75 9.442 8.192 10 7.5 10C6.808 10 6.25 9.442 6.25 8.75C6.25 8.058 6.808 7.5 7.5 7.5ZM13.333 13.333C12.108 14.558 10.467 15 10 15C9.533 15 7.892 14.558 6.667 13.333C6.342 13.008 6.342 12.492 6.667 12.167C6.992 11.842 7.508 11.842 7.833 12.167C8.617 12.95 9.617 13.333 10 13.333C10.383 13.333 11.383 12.95 12.167 12.167C12.492 11.842 13.008 11.842 13.333 12.167C13.658 12.492 13.658 13.008 13.333 13.333ZM12.5 10C11.808 10 11.25 9.442 11.25 8.75C11.25 8.058 11.808 7.5 12.5 7.5C13.192 7.5 13.75 8.058 13.75 8.75C13.75 9.442 13.192 10 12.5 10Z"
      fill="white"
    />
  </svg>
);

const HealthIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M10 3.333C10.917 3.333 11.667 4.083 11.667 5V6.667H13.333C14.25 6.667 15 7.417 15 8.333C15 9.25 14.25 10 13.333 10H11.667V15C11.667 15.917 10.917 16.667 10 16.667C9.083 16.667 8.333 15.917 8.333 15V10H6.667C5.75 10 5 9.25 5 8.333C5 7.417 5.75 6.667 6.667 6.667H8.333V5C8.333 4.083 9.083 3.333 10 3.333Z"
      fill="white"
    />
  </svg>
);

const CircleIcon = ({ color }: { color: string }) => {
  // 색상명을 실제 색상 코드로 변환
  const colorMap: Record<string, string> = {
    초록색: "#22C55E",
    청색: "#3B82F6",
    빨간색: "#EF4444",
    주황색: "#F97316",
    노란색: "#EAB308",
    갈색: "#A16207",
    흰색: "#FFFFFF",
    금색: "#FFD700",
    검은색: "#18181B",
    파란색: "#3B82F6",
    보라색: "#A855F7",
    Green: "#22C55E",
    "Blue-green": "#3B82F6",
    Red: "#EF4444",
    Orange: "#F97316",
    Yellow: "#EAB308",
    Brown: "#A16207",
    White: "#FFFFFF",
    Gold: "#FFD700",
    Black: "#18181B",
    Blue: "#3B82F6",
  };

  const fillColor = colorMap[color] || "#FFFFFF";

  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" fill={fillColor} />
    </svg>
  );
};
