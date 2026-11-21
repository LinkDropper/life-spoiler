import { useTranslations } from "next-intl";

import type { PartnerProfile as PartnerProfileData } from "@/libs/services/ai/types";

import styles from "./CategoryExtras.module.css";

interface EvidenceLineProps {
  text: string;
}

/** 분야 헤드라인 아래 쉬운 말 근거 한 줄 */
export const EvidenceLine = ({ text }: EvidenceLineProps) => {
  const t = useTranslations("fortune.lifetime.categoryExtras");

  return (
    <div className={styles.evidence}>
      <span className={styles.chip}>{t("evidence")}</span>
      <p className={styles.evidenceText}>{text}</p>
    </div>
  );
};

interface CareerFieldsProps {
  fields: string[];
}

/** 직업운: 엔진 후보 안에서 고른 잘 맞는 분야 */
export const CareerFields = ({ fields }: CareerFieldsProps) => {
  const t = useTranslations("fortune.lifetime.categoryExtras");

  return (
    <div className={styles.extra}>
      <h4 className={styles.extraHeading}>{t("fieldsTitle")}</h4>
      <ul className={styles.chips}>
        {fields.map((field) => (
          <li key={field} className={styles.chip}>
            {field}
          </li>
        ))}
      </ul>
      <p className={styles.note}>{t("fieldsNote")}</p>
    </div>
  );
};

interface PartnerProfileProps {
  partner: PartnerProfileData;
}

/** 인연운: 만날 사람의 성향 · 역할 · 만나는 길 */
export const PartnerProfile = ({ partner }: PartnerProfileProps) => {
  const t = useTranslations("fortune.lifetime.categoryExtras");

  return (
    <div className={styles.extra}>
      <h4 className={styles.extraHeading}>{t("partnerTitle")}</h4>
      <div className={styles.partnerGroups}>
        <div className={styles.partnerGroup}>
          <h5 className={styles.partnerLabel}>{t("partnerTraits")}</h5>
          <ul className={styles.bullets}>
            {partner.traits.map((trait) => (
              <li key={trait}>{trait}</li>
            ))}
          </ul>
        </div>
        <div className={styles.partnerGroup}>
          <h5 className={styles.partnerLabel}>{t("partnerRole")}</h5>
          <p className={styles.body}>{partner.role}</p>
        </div>
        <div className={styles.partnerGroup}>
          <h5 className={styles.partnerLabel}>{t("partnerPaths")}</h5>
          <ul className={styles.bullets}>
            {partner.meetingPaths.map((path) => (
              <li key={path}>{path}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className={styles.noteSpaced}>{t("partnerNote")}</p>
    </div>
  );
};
