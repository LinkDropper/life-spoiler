"use client";

import { useTranslations } from "next-intl";

import styles from "./ProfileSummaryCard.module.css";

interface ProfileSummaryCardProps {
  name: string;
  birthDate: string;
  birthTime: string | null;
  birthTimeUnknown: boolean;
  calendarType: "solar" | "lunar";
  gender: "male" | "female";
}

const formatBirthDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-");
  return `${year}.${month}.${day}`;
};

export const ProfileSummaryCard = ({
  name,
  birthDate,
  birthTime,
  birthTimeUnknown,
  calendarType,
  gender,
}: ProfileSummaryCardProps) => {
  const t = useTranslations("profiles.card");

  const formatBirthTime = (timeString: string | null, isUnknown: boolean) => {
    if (isUnknown || !timeString) {
      return t("timeUnknown", { default: "시간 모름" });
    }
    const [hour, minute] = timeString.split(":");
    return `${hour} : ${minute}`;
  };

  const getCalendarLabel = (type: "solar" | "lunar") => {
    return type === "solar"
      ? t("solar", { default: "양력" })
      : t("lunar", { default: "음력" });
  };

  const getGenderLabel = (g: "male" | "female") => {
    return g === "male"
      ? t("male", { default: "남성" })
      : t("female", { default: "여성" });
  };

  return (
    <div className={styles.card}>
      <div className={styles.nameRow}>
        <span className={styles.name}>{name}</span>
      </div>
      <div className={styles.infoRow}>
        <div className={styles.dateTimeInfo}>
          <span className={styles.infoText}>{formatBirthDate(birthDate)}</span>
          <span className={styles.infoText}>
            {formatBirthTime(birthTime, birthTimeUnknown)}
          </span>
        </div>
        <div className={styles.tags}>
          <span className={styles.tag}>{getCalendarLabel(calendarType)}</span>
          <span className={styles.tag}>{getGenderLabel(gender)}</span>
        </div>
      </div>
    </div>
  );
};
