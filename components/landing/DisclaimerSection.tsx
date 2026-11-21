import { getTranslations } from "next-intl/server";

import styles from "./DisclaimerSection.module.css";

export const DisclaimerSection = async () => {
  const t = await getTranslations("landing.disclaimer");

  return (
    <section className={styles.container}>
      <div className={styles.warningBadge}>
        <span className={styles.warningText}>
          {t("badge", { default: "FBI WARNING" })}
        </span>
      </div>
      <p className={styles.disclaimerText}>
        {t("text", {
          default:
            "본 서비스는 100% 천문 데이터를 기반으로 분석되었습니다.\n운세 결과가 너무 잘 맞아서 생기는 '소름'과 '과호흡'에 대해\n인생스포 측은 책임지지 않습니다.",
        })
          .split("\n")
          .map((line, index, array) => (
            <span key={index}>
              {line}
              {index < array.length - 1 && <br />}
            </span>
          ))}
      </p>
    </section>
  );
};
