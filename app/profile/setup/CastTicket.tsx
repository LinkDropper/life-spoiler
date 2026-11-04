"use client";

import { useTranslations } from "next-intl";

import type { StepOneData } from "./page";
import styles from "./CastTicket.module.css";

interface CastTicketProps {
  data: StepOneData;
  /** 꼬리표 "고치기" — 1단계로 돌아간다 */
  onEdit: () => void;
}

const formatBirthDate = (value: string) => value.replaceAll("-", ".");

/**
 * 2단계 맨 위 "주인공 관람권". 1단계에서 넣은 정보를 메뉴 관람권과 같은 실물 티켓에 찍는다.
 */
export const CastTicket = ({ data, onEdit }: CastTicketProps) => {
  const t = useTranslations("profileSetup.stepTwo.ticket");
  const tCard = useTranslations("profiles.card");

  const calendar =
    data.calendarType === "solar" ? tCard("solar") : tCard("lunar");
  const time =
    data.birthTimeUnknown || !data.birthTime
      ? tCard("timeUnknown")
      : data.birthTime;
  const gender = data.gender === "male" ? tCard("male") : tCard("female");

  const fields = [
    {
      label: t("birth"),
      value: `${formatBirthDate(data.birthDate)} ${calendar}`,
    },
    { label: t("time"), value: time },
    { label: t("gender"), value: gender },
  ];

  return (
    <div className={styles.ticket}>
      <div className={styles.body}>
        <span className={styles.kind}>
          {t("kind")}
          <span className={styles.count}>{t("count")}</span>
        </span>
        <strong className={styles.name}>{data.name}</strong>
        <dl className={styles.fields}>
          {fields.map((field) => (
            <div key={field.label} className={styles.field}>
              <dt className={styles.fieldLabel}>{field.label}</dt>
              <dd className={styles.fieldValue}>{field.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <button
        type="button"
        className={styles.stub}
        onClick={onEdit}
        aria-label={t("editAriaLabel")}
      >
        <span className={styles.barcode} aria-hidden="true" />
        <span className={styles.edit}>{t("edit")}</span>
      </button>
    </div>
  );
};
