import { useTranslations } from "next-intl";

import type { PartnerProfile as PartnerProfileData } from "@/libs/services/ai/types";

import extras from "./LifetimeExtras.module.css";
import styles from "./screen.module.css";

/** 분야 카드 헤드라인 아래 쉬운 말 근거 한 줄 */
export const EvidenceLine = ({ text }: { text: string }) => {
  const t = useTranslations("fortune.screen.categoryExtras");
  return (
    <p className={extras.evidence}>
      <b>{t("evidence")}</b>
      {text}
    </p>
  );
};

/** 직업 카드: 엔진 후보 안에서 고른 분야 */
export const CareerFields = ({ fields }: { fields: string[] }) => {
  const t = useTranslations("fortune.screen.categoryExtras");
  return (
    <div className={extras.block}>
      <h5 className={extras.blockTitle}>{t("fieldsTitle")}</h5>
      <ul className={styles.keywords}>
        {fields.map((field) => (
          <li key={field} className={styles.keyword}>
            {field}
          </li>
        ))}
      </ul>
      <p className={extras.note}>{t("fieldsNote")}</p>
    </div>
  );
};

/** 인연 카드: 만날 사람의 성향 · 역할 · 만나는 길 */
export const PartnerProfile = ({
  partner,
}: {
  partner: PartnerProfileData;
}) => {
  const t = useTranslations("fortune.screen.categoryExtras");
  return (
    <div className={extras.block}>
      <h5 className={extras.blockTitle}>{t("partnerTitle")}</h5>
      <dl className={extras.partnerList}>
        <div>
          <dt>{t("partnerTraits")}</dt>
          <dd>
            <ul className={extras.plainList}>
              {partner.traits.map((trait) => (
                <li key={trait}>{trait}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt>{t("partnerRole")}</dt>
          <dd>{partner.role}</dd>
        </div>
        <div>
          <dt>{t("partnerPaths")}</dt>
          <dd>
            <ul className={extras.plainList}>
              {partner.meetingPaths.map((path) => (
                <li key={path}>{path}</li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
      <p className={extras.note}>{t("partnerNote")}</p>
    </div>
  );
};
