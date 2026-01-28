"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Input, RadioGroup, Checkbox, Button } from "@/components/form";

import type { StepOneData } from "./page";
import styles from "./StepOne.module.css";

interface StepOneProps {
  initialData: StepOneData;
  onNext: (data: StepOneData) => void;
}

export const StepOne = ({ initialData, onNext }: StepOneProps) => {
  const t = useTranslations("profileSetup.stepOne");
  const [formData, setFormData] = useState<StepOneData>(initialData);
  const [errors, setErrors] = useState<
    Partial<Record<keyof StepOneData, string>>
  >({});

  const CALENDAR_OPTIONS = [
    { value: "solar", label: t("calendar.solar", { default: "양력" }) },
    { value: "lunar", label: t("calendar.lunar", { default: "음력" }) },
  ];

  const GENDER_OPTIONS = [
    { value: "female", label: t("gender.female", { default: "여자" }) },
    { value: "male", label: t("gender.male", { default: "남자" }) },
  ];

  const updateField = <K extends keyof StepOneData>(
    field: K,
    value: StepOneData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleTimeUnknownChange = (checked: boolean) => {
    updateField("birthTimeUnknown", checked);
    if (checked) {
      updateField("birthTime", "");
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof StepOneData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = t("name.errorRequired", {
        default: "이름을 입력해주세요.",
      });
    } else if (formData.name.length > 20) {
      newErrors.name = t("name.errorLength", {
        default: "이름은 20자 이내로 입력해주세요.",
      });
    }

    if (!formData.birthDate) {
      newErrors.birthDate = t("birthDate.errorRequired", {
        default: "생년월일을 입력해주세요.",
      });
    } else if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(formData.birthDate)) {
      newErrors.birthDate = t("birthDate.errorFormat", {
        default: "생년월일 형식이 올바르지 않습니다. (예: 1990-01-15)",
      });
    }

    if (!formData.birthTimeUnknown) {
      if (!formData.birthTime) {
        newErrors.birthTime = t("birthTime.errorRequired", {
          default: "태어난 시간을 입력하거나 '시간 모름'을 선택해주세요.",
        });
      } else if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(formData.birthTime)) {
        newErrors.birthTime = t("birthTime.errorFormat", {
          default: "시간 형식이 올바르지 않습니다. (예: 16:40)",
        });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext(formData);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.form}>
        <Input
          label={t("name.label", { default: "이름" })}
          name="name"
          value={formData.name}
          onChange={(value) => updateField("name", value)}
          placeholder={t("name.placeholder", {
            default: "이름을 입력해주세요",
          })}
          error={errors.name}
          maxLength={20}
        />

        <Input
          label={t("birthDate.label", { default: "생년월일" })}
          name="birthDate"
          type="text"
          format="date"
          value={formData.birthDate}
          onChange={(value) => updateField("birthDate", value)}
          placeholder={t("birthDate.placeholder", { default: "YYYY-MM-DD" })}
          error={errors.birthDate}
          maxLength={10}
        />

        <div className={styles.timeSection}>
          <Input
            label={t("birthTime.label", { default: "태어난 시간" })}
            name="birthTime"
            type="text"
            format="time"
            value={formData.birthTime}
            onChange={(value) => updateField("birthTime", value)}
            placeholder={t("birthTime.placeholder", { default: "HH:MM" })}
            error={errors.birthTime}
            disabled={formData.birthTimeUnknown}
            maxLength={5}
          />
          <Checkbox
            label={t("birthTime.unknown", { default: "시간 모름" })}
            checked={formData.birthTimeUnknown}
            onChange={handleTimeUnknownChange}
          />
          <p className={styles.timeHint}>
            {t("birthTime.hint", {
              default: "정확한 운세 확인을 위해 시간을 꼭 입력해주세요.",
            })}
          </p>
        </div>

        <RadioGroup
          label={t("calendar.label", { default: "달력" })}
          options={CALENDAR_OPTIONS}
          value={formData.calendarType}
          onChange={(value) =>
            updateField("calendarType", value as StepOneData["calendarType"])
          }
        />

        <RadioGroup
          label={t("gender.label", { default: "성별" })}
          options={GENDER_OPTIONS}
          value={formData.gender}
          onChange={(value) =>
            updateField("gender", value as StepOneData["gender"])
          }
        />
      </div>

      <div className={styles.footer}>
        <Button onClick={handleNext}>{t("next", { default: "다음" })}</Button>
      </div>
    </div>
  );
};
