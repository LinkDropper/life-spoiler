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

const formatBirthTime = (timeString: string | null, isUnknown: boolean) => {
  if (isUnknown || !timeString) {
    return "시간 모름";
  }
  const [hour, minute] = timeString.split(":");
  return `${hour} : ${minute}`;
};

const getCalendarLabel = (type: "solar" | "lunar") => {
  return type === "solar" ? "양력" : "음력";
};

const getGenderLabel = (gender: "male" | "female") => {
  return gender === "male" ? "남성" : "여성";
};

export const ProfileSummaryCard = ({
  name,
  birthDate,
  birthTime,
  birthTimeUnknown,
  calendarType,
  gender,
}: ProfileSummaryCardProps) => {
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
