"use client";

import { useTranslations } from "next-intl";

import styles from "./ProfileInfo.module.css";

interface ProfileInfoProps {
  /** 프로필 이름 */
  name: string;
  /** 제목 타입: "lifetime" | "yearly" */
  fortuneType: "lifetime" | "yearly";
  /** 연도 (yearly 타입일 때만 사용) */
  year?: number;
  /** 생년월일 (YYYY-MM-DD 형식) */
  birthDate: string;
  /** 태어난 시간 (HH:MM 형식 또는 null) */
  birthTime: string | null;
  /** 시간 모름 여부 */
  birthTimeUnknown: boolean;
  /** 달력 유형 */
  calendarType: "solar" | "lunar";
  /** 성별 */
  gender: "male" | "female";
}

export const ProfileInfo = ({
  name,
  fortuneType,
  year,
  birthDate,
  birthTime,
  birthTimeUnknown,
  calendarType,
  gender,
}: ProfileInfoProps) => {
  const t = useTranslations("fortune");
  const tProfiles = useTranslations("profiles.card");

  // 제목 생성
  const title =
    fortuneType === "yearly" && year
      ? t("yearly.title", { name, year })
      : t("lifetime.title", { name });

  // 생년월일 포맷팅 (YYYY-MM-DD → YYYY.MM.DD)
  const formattedDate = birthDate.replace(/-/g, ".");

  // 시간 포맷팅
  const formattedTime = birthTimeUnknown
    ? tProfiles("timeUnknown")
    : birthTime?.slice(0, 5).replace(":", " : ") || tProfiles("timeUnknown");

  // 달력 유형 레이블
  const calendarLabel =
    calendarType === "solar" ? tProfiles("solar") : tProfiles("lunar");

  // 성별 레이블
  const genderLabel =
    gender === "male" ? tProfiles("male") : tProfiles("female");

  return (
    <div className={styles.container}>
      <div className={styles.title}>{title}</div>
      <div className={styles.details}>
        <div className={styles.dateTime}>
          <span className={styles.date}>{formattedDate}</span>
          <span className={styles.time}>{formattedTime}</span>
        </div>
        <div className={styles.tags}>
          <span className={styles.tag}>{calendarLabel}</span>
          <span className={styles.tag}>{genderLabel}</span>
        </div>
      </div>
    </div>
  );
};
