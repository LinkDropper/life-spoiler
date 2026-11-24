/** "1995-03-14" → "1995.03.14" */
export const formatBirthDate = (dateString: string): string =>
  dateString.split("-").join(".");
