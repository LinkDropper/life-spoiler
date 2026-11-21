"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button, Checkbox, Input, RadioGroup } from "@/components/form";
import { HeaderClient } from "@/components/landing";
import { useUniverseCreate } from "@/libs/hooks/universe";

import styles from "./page.module.css";

import type { UniverseCreateValues } from "@/libs/hooks/universe";

const INITIAL_VALUES: UniverseCreateValues = {
  ownerName: "",
  birthDate: "",
  birthTime: "",
  birthTimeUnknown: false,
  calendarType: "solar",
  isLeapMonth: false,
  gender: "female",
};

/**
 * owner 우주 생성 폼.
 *
 * guest 폼과 달리 **"시간 모름"에 안내 마찰을 넣는다.** owner가 시간을 모르면
 * 모든 쌍에 owner가 포함되므로 그 우주의 결과 전체가 `estimated`가 되고 아무도
 * 최고 등급을 받지 못한다. owner는 한 번만 입력하면 되고 진입 동기가 이미 강하므로
 * 약간의 마찰이 결과 품질 이득으로 상쇄된다 (CPO 결정). 차단하지는 않는다.
 */
export default function UniverseCreatePage() {
  const t = useTranslations("universe.create");
  const { isSubmitting, submitError, create } = useUniverseCreate();
  const [values, setValues] = useState<UniverseCreateValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<
    Partial<Record<keyof UniverseCreateValues, string>>
  >({});
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [privacyConsentError, setPrivacyConsentError] = useState<string | null>(
    null
  );

  const calendarOptions = [
    { value: "solar", label: t("calendarSolar") },
    { value: "lunar", label: t("calendarLunar") },
  ];

  const genderOptions = [
    { value: "female", label: t("genderFemale") },
    { value: "male", label: t("genderMale") },
  ];

  const updateField = <K extends keyof UniverseCreateValues>(
    field: K,
    value: UniverseCreateValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleTimeUnknownChange = (checked: boolean) => {
    setValues((prev) => ({
      ...prev,
      birthTimeUnknown: checked,
      birthTime: checked ? "" : prev.birthTime,
    }));
    setErrors((prev) => ({ ...prev, birthTime: undefined }));
  };

  const handleCalendarChange = (value: string) => {
    const calendarType = value as UniverseCreateValues["calendarType"];
    setValues((prev) => ({
      ...prev,
      calendarType,
      isLeapMonth: calendarType === "lunar" ? prev.isLeapMonth : false,
    }));
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof UniverseCreateValues, string>> = {};

    if (
      !/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(values.birthDate)
    ) {
      nextErrors.birthDate = t("birthDatePlaceholder");
    }

    if (
      !values.birthTimeUnknown &&
      !/^([01]\d|2[0-3]):([0-5]\d)$/.test(values.birthTime)
    ) {
      nextErrors.birthTime = t("birthTimePlaceholder");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    const isValid = validate();

    if (!privacyConsent) {
      setPrivacyConsentError(t("privacyConsentError"));
    }

    if (!isValid || !privacyConsent) {
      return;
    }
    void create(values);
  };

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t("title")}</h1>
          <p className={styles.description}>{t("description")}</p>
        </header>

        <div className={styles.form}>
          <Input
            label={t("ownerNameLabel")}
            name="ownerName"
            value={values.ownerName}
            onChange={(value) => updateField("ownerName", value)}
            placeholder={t("ownerNamePlaceholder")}
            maxLength={20}
          />

          <Input
            label={t("birthDateLabel")}
            name="birthDate"
            format="date"
            value={values.birthDate}
            onChange={(value) => updateField("birthDate", value)}
            placeholder={t("birthDatePlaceholder")}
            error={errors.birthDate}
            maxLength={10}
          />

          <div className={styles.timeSection}>
            <Input
              label={t("birthTimeLabel")}
              name="birthTime"
              format="time"
              value={values.birthTime}
              onChange={(value) => updateField("birthTime", value)}
              placeholder={t("birthTimePlaceholder")}
              error={errors.birthTime}
              disabled={values.birthTimeUnknown}
              maxLength={5}
            />
            {/* owner 전용 마찰 안내 — "시간 모름" 선택 전에 먼저 보이도록 위에 둔다 */}
            <p className={styles.timeHint}>{t("birthTimeOwnerHint")}</p>
            <Checkbox
              label={t("birthTimeUnknown")}
              checked={values.birthTimeUnknown}
              onChange={handleTimeUnknownChange}
            />
          </div>

          <RadioGroup
            label={t("calendarLabel")}
            options={calendarOptions}
            value={values.calendarType}
            onChange={handleCalendarChange}
          />

          {values.calendarType === "lunar" && (
            <Checkbox
              label={t("leapMonth")}
              checked={values.isLeapMonth}
              onChange={(checked) => updateField("isLeapMonth", checked)}
            />
          )}

          <RadioGroup
            label={t("genderLabel")}
            options={genderOptions}
            value={values.gender}
            onChange={(value) =>
              updateField("gender", value as UniverseCreateValues["gender"])
            }
          />

          <p className={styles.warning}>{t("linkWarning")}</p>

          <div className={styles.consentSection}>
            <Checkbox
              label={t("privacyConsentLabel")}
              checked={privacyConsent}
              onChange={(checked) => {
                setPrivacyConsent(checked);
                if (checked) {
                  setPrivacyConsentError(null);
                }
              }}
            />
            <Link
              href="/policy/privacy"
              target="_blank"
              className={styles.privacyLink}
            >
              {t("privacyConsentLink")}
            </Link>
            {privacyConsentError && (
              <p className={styles.error} role="alert">
                {privacyConsentError}
              </p>
            )}
          </div>

          {submitError && (
            <p className={styles.error} role="alert">
              {submitError}
            </p>
          )}

          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </div>
      </main>
    </div>
  );
}
