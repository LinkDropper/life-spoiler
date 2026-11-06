import type { ProfileRow } from "@/libs/supabase/types";

export const formatBirthDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-");
  return `${year}.${month}.${day}`;
};

export const formatBirthTime = (
  timeString: string | null,
  isUnknown: boolean,
  unknownLabel: string
) => {
  if (isUnknown || !timeString) return unknownLabel;
  const [hour, minute] = timeString.split(":");
  return `${hour}:${minute}`;
};

interface ProfileLineLabels {
  solar: string;
  lunar: string;
  male: string;
  female: string;
  timeUnknown: string;
}

/** 배우 한 줄: 1998.03.14 12:00 · 양력 · 여성 */
export const formatProfileLine = (
  profile: Pick<
    ProfileRow,
    | "birth_date"
    | "birth_time"
    | "birth_time_unknown"
    | "calendar_type"
    | "gender"
  >,
  labels: ProfileLineLabels
): string =>
  [
    `${formatBirthDate(profile.birth_date)} ${formatBirthTime(
      profile.birth_time,
      profile.birth_time_unknown,
      labels.timeUnknown
    )}`,
    profile.calendar_type === "solar" ? labels.solar : labels.lunar,
    profile.gender === "male" ? labels.male : labels.female,
  ].join(" · ");
