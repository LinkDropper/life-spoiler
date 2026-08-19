"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button, Checkbox, Input, RadioGroup } from "@/components/form";

import styles from "./GuestEntryForm.module.css";

export interface GuestFormValues {
  name: string;
  birthDate: string;
  birthTime: string;
  birthTimeUnknown: boolean;
  calendarType: "solar" | "lunar";
  isLeapMonth: boolean;
}

interface GuestEntryFormProps {
  isSubmitting: boolean;
  /** 참여 인원 하드캡 도달 시 제출 차단 */
  isFull: boolean;
  /** 서버가 돌려준 에러 메시지 (인라인 표시, 폼 값은 유지) */
  submitError: string | null;
  onSubmit: (values: GuestFormValues) => void;
}

const INITIAL_VALUES: GuestFormValues = {
  name: "",
  birthDate: "",
  birthTime: "",
  birthTimeUnknown: false,
  calendarType: "solar",
  isLeapMonth: false,
};

/**
 * 2번 영역 — 친구 입력 폼.
 *
 * 성별을 받지 않는다(컨셉 확정). 계산 엔진은 성별 의존 로직을 쓰지 않으므로 문제없다.
 *
 * owner 생성 폼과 달리 **"시간 모름"에 마찰 안내를 넣지 않는다.** 처음 보는 링크에
 * 생년월일을 넣는 이 순간이 바이럴 루프에서 가장 얇은 지점이라, 여기서 시간을 강요하면
 * 루프가 끊긴다 (CPO 결정).
 */
export const GuestEntryForm = ({
  isSubmitting,
  isFull,
  submitError,
  onSubmit,
}: GuestEntryFormProps) => {
  const t = useTranslations("universe.detail");
  const tCreate = useTranslations("universe.create");
  const [values, setValues] = useState<GuestFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<
    Partial<Record<keyof GuestFormValues, string>>
  >({});
  /*
    개인정보 동의는 계산에 쓰이는 명반 값이 아니라 제출 게이트일 뿐이라
    GuestFormValues(서버 전송 페이로드의 소스)에 넣지 않고 별도 로컬 상태로 둔다
    (useGuestSubmit이 필드를 하나씩 골라 보내므로 섞여도 무해하지만, 타입을
    "서버로 나가는 값"과 "제출 조건"으로 분리해두는 게 더 명확하다).
  */
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [privacyConsentError, setPrivacyConsentError] = useState<string | null>(
    null
  );

  const calendarOptions = [
    { value: "solar", label: tCreate("calendarSolar") },
    { value: "lunar", label: tCreate("calendarLunar") },
  ];

  const updateField = <K extends keyof GuestFormValues>(
    field: K,
    value: GuestFormValues[K]
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
    const calendarType = value as GuestFormValues["calendarType"];
    setValues((prev) => ({
      ...prev,
      calendarType,
      // 윤달은 음력에서만 성립하므로 양력으로 바꾸면 함께 해제한다
      isLeapMonth: calendarType === "lunar" ? prev.isLeapMonth : false,
    }));
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof GuestFormValues, string>> = {};

    if (!values.name.trim()) {
      nextErrors.name = t("namePlaceholder");
    }

    if (
      !/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(values.birthDate)
    ) {
      nextErrors.birthDate = tCreate("birthDatePlaceholder");
    }

    if (
      !values.birthTimeUnknown &&
      !/^([01]\d|2[0-3]):([0-5]\d)$/.test(values.birthTime)
    ) {
      nextErrors.birthTime = tCreate("birthTimePlaceholder");
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
    onSubmit(values);
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{t("formTitle")}</h2>

      <div className={styles.form}>
        <Input
          label={t("nameLabel")}
          name="guestName"
          value={values.name}
          onChange={(value) => updateField("name", value)}
          placeholder={t("namePlaceholder")}
          error={errors.name}
          maxLength={20}
        />

        <Input
          label={tCreate("birthDateLabel")}
          name="guestBirthDate"
          format="date"
          value={values.birthDate}
          onChange={(value) => updateField("birthDate", value)}
          placeholder={tCreate("birthDatePlaceholder")}
          error={errors.birthDate}
          maxLength={10}
        />

        <div className={styles.timeSection}>
          <Input
            label={tCreate("birthTimeLabel")}
            name="guestBirthTime"
            format="time"
            value={values.birthTime}
            onChange={(value) => updateField("birthTime", value)}
            placeholder={tCreate("birthTimePlaceholder")}
            error={errors.birthTime}
            disabled={values.birthTimeUnknown}
            maxLength={5}
          />
          <Checkbox
            label={tCreate("birthTimeUnknown")}
            checked={values.birthTimeUnknown}
            onChange={handleTimeUnknownChange}
          />
        </div>

        <RadioGroup
          label={tCreate("calendarLabel")}
          options={calendarOptions}
          value={values.calendarType}
          onChange={handleCalendarChange}
        />

        {values.calendarType === "lunar" && (
          <Checkbox
            label={tCreate("leapMonth")}
            checked={values.isLeapMonth}
            onChange={(checked) => updateField("isLeapMonth", checked)}
          />
        )}

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
          {/* 체크박스 버튼(고정 높이 52px, 라벨이 이미 한 줄 폭을 거의 다 씀)과
              겹치거나 폭을 다투지 않도록 아래 줄에 우측 정렬 칩으로 둔다. */}
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

        {isFull && <p className={styles.blocked}>{t("fullNotice")}</p>}

        {submitError && (
          <p className={styles.error} role="alert">
            {submitError}
          </p>
        )}

        <Button onClick={handleSubmit} disabled={isSubmitting || isFull}>
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </div>
    </section>
  );
};
