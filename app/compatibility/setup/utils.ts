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
  return `${hour} : ${minute}`;
};
