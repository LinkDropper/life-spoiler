import { getTranslations } from "next-intl/server";

import styles from "./ShareableQuoteCard.module.css";

interface ShareableQuoteCardProps {
  quote: string;
}

export const ShareableQuoteCard = async ({
  quote,
}: ShareableQuoteCardProps) => {
  const t = await getTranslations("faceSpoiler.report.relationshipLabels");

  return (
    <aside className={styles.card}>
      <p className={styles.label}>{t("shareableQuote")}</p>
      <blockquote className={styles.quote}>{quote}</blockquote>
    </aside>
  );
};
