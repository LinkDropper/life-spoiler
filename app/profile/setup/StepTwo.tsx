"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/form";

import { CastTicket } from "./CastTicket";
import { ChoiceGroup } from "./ChoiceGroup";
import type { StepOneData, StepTwoData } from "./page";
import styles from "./StepTwo.module.css";

interface StepTwoProps {
  stepOneData: StepOneData;
  initialData: StepTwoData;
  onBack: () => void;
  onSubmit: (data: StepTwoData) => void;
  isSubmitting: boolean;
  /** 홈에서 추가하러 왔으면 "저장하고 상영하기", 아니면 "저장하기" */
  saveLabel: string;
}

const CUSTOM_MAX_LENGTH = 50;

export const StepTwo = ({
  stepOneData,
  initialData,
  onBack,
  onSubmit,
  isSubmitting,
  saveLabel,
}: StepTwoProps) => {
  const t = useTranslations("profileSetup.stepTwo");
  const [formData, setFormData] = useState<StepTwoData>(initialData);
  const [errors, setErrors] = useState<
    Partial<Record<keyof StepTwoData, string>>
  >({});

  const RELATIONSHIP_OPTIONS: {
    value: StepTwoData["relationshipStatus"];
    label: string;
  }[] = [
    { value: "solo", label: t("relationship.solo") },
    { value: "dating", label: t("relationship.dating") },
    { value: "married", label: t("relationship.married") },
    { value: "divorced", label: t("relationship.divorced") },
    { value: "custom", label: t("relationship.custom") },
  ];

  const OCCUPATION_OPTIONS: {
    value: StepTwoData["occupationStatus"];
    label: string;
  }[] = [
    { value: "student", label: t("occupation.student") },
    { value: "job_seeker", label: t("occupation.jobSeeker") },
    { value: "homemaker", label: t("occupation.homemaker") },
    { value: "employed", label: t("occupation.employed") },
    { value: "self_employed", label: t("occupation.selfEmployed") },
    { value: "retired", label: t("occupation.retired") },
    { value: "custom", label: t("occupation.custom") },
  ];

  const updateField = <K extends keyof StepTwoData>(
    field: K,
    value: StepTwoData[K],
    errorKey: keyof StepTwoData
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof StepTwoData, string>> = {};

    if (
      formData.relationshipStatus === "custom" &&
      !formData.relationshipStatusCustom.trim()
    ) {
      newErrors.relationshipStatus = t("relationship.error");
    }

    if (
      formData.occupationStatus === "custom" &&
      !formData.occupationStatusCustom.trim()
    ) {
      newErrors.occupationStatus = t("occupation.error");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <CastTicket data={stepOneData} onEdit={onBack} />

        <div className={styles.group}>
          <ChoiceGroup
            variant="pill"
            label={t("relationship.label")}
            options={RELATIONSHIP_OPTIONS}
            value={formData.relationshipStatus}
            onChange={(value) => {
              updateField("relationshipStatus", value, "relationshipStatus");
              // 직접 입력에서 벗어나면 써 둔 값은 보내지 않는다(이전 동작과 같다)
              if (value !== "custom") {
                updateField(
                  "relationshipStatusCustom",
                  "",
                  "relationshipStatus"
                );
              }
            }}
            error={errors.relationshipStatus}
          />
          {formData.relationshipStatus === "custom" && (
            <input
              type="text"
              className={styles.customInput}
              aria-label={t("relationship.customAriaLabel")}
              placeholder={t("customPlaceholder")}
              value={formData.relationshipStatusCustom}
              maxLength={CUSTOM_MAX_LENGTH}
              onChange={(event) =>
                updateField(
                  "relationshipStatusCustom",
                  event.target.value,
                  "relationshipStatus"
                )
              }
            />
          )}
        </div>

        <div className={styles.group}>
          <ChoiceGroup
            variant="pill"
            label={t("occupation.label")}
            options={OCCUPATION_OPTIONS}
            value={formData.occupationStatus}
            onChange={(value) => {
              updateField("occupationStatus", value, "occupationStatus");
              if (value !== "custom") {
                updateField("occupationStatusCustom", "", "occupationStatus");
              }
            }}
            error={errors.occupationStatus}
          />
          {formData.occupationStatus === "custom" && (
            <input
              type="text"
              className={styles.customInput}
              aria-label={t("occupation.customAriaLabel")}
              placeholder={t("customPlaceholder")}
              value={formData.occupationStatusCustom}
              maxLength={CUSTOM_MAX_LENGTH}
              onChange={(event) =>
                updateField(
                  "occupationStatusCustom",
                  event.target.value,
                  "occupationStatus"
                )
              }
            />
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.backButton}
          onClick={onBack}
          disabled={isSubmitting}
          aria-label={t("back")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M15 18L9 12L15 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? t("saving") : saveLabel}
        </Button>
      </div>
    </div>
  );
};
