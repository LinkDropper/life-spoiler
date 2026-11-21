"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button, SelectableChips } from "@/components/form";
import { ProfileSummaryCard } from "@/components/profile";

import type { StepOneData, StepTwoData } from "./page";
import styles from "./StepTwo.module.css";

interface StepTwoProps {
  stepOneData: StepOneData;
  initialData: StepTwoData;
  onBack: () => void;
  onSubmit: (data: StepTwoData) => void;
  isSubmitting: boolean;
}

export const StepTwo = ({
  stepOneData,
  initialData,
  onBack,
  onSubmit,
  isSubmitting,
}: StepTwoProps) => {
  const t = useTranslations("profileSetup.stepTwo");
  const [formData, setFormData] = useState<StepTwoData>(initialData);
  const [errors, setErrors] = useState<
    Partial<Record<keyof StepTwoData, string>>
  >({});

  const RELATIONSHIP_OPTIONS = [
    { value: "solo", label: t("relationship.solo", { default: "솔로" }) },
    { value: "dating", label: t("relationship.dating", { default: "연애중" }) },
    {
      value: "married",
      label: t("relationship.married", { default: "결혼함" }),
    },
    {
      value: "divorced",
      label: t("relationship.divorced", { default: "이혼 / 사별" }),
    },
    {
      value: "custom",
      label: t("relationship.custom", { default: "직접 입력" }),
    },
  ];

  const OCCUPATION_OPTIONS = [
    { value: "student", label: t("occupation.student", { default: "학생" }) },
    {
      value: "job_seeker",
      label: t("occupation.jobSeeker", { default: "취준생" }),
    },
    {
      value: "homemaker",
      label: t("occupation.homemaker", { default: "주부" }),
    },
    {
      value: "employed",
      label: t("occupation.employed", { default: "직장인" }),
    },
    {
      value: "self_employed",
      label: t("occupation.selfEmployed", { default: "사업 / 프리랜서" }),
    },
    { value: "retired", label: t("occupation.retired", { default: "은퇴" }) },
    {
      value: "custom",
      label: t("occupation.custom", { default: "직접 입력" }),
    },
  ];

  const handleRelationshipChange = (value: string, customValue?: string) => {
    setFormData((prev) => ({
      ...prev,
      relationshipStatus: value as StepTwoData["relationshipStatus"],
      relationshipStatusCustom: customValue ?? "",
    }));
    if (errors.relationshipStatus) {
      setErrors((prev) => ({ ...prev, relationshipStatus: undefined }));
    }
  };

  const handleOccupationChange = (value: string, customValue?: string) => {
    setFormData((prev) => ({
      ...prev,
      occupationStatus: value as StepTwoData["occupationStatus"],
      occupationStatusCustom: customValue ?? "",
    }));
    if (errors.occupationStatus) {
      setErrors((prev) => ({ ...prev, occupationStatus: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof StepTwoData, string>> = {};

    if (
      formData.relationshipStatus === "custom" &&
      !formData.relationshipStatusCustom.trim()
    ) {
      newErrors.relationshipStatus = t("relationship.error", {
        default: "연애 상태를 입력해주세요.",
      });
    }

    if (
      formData.occupationStatus === "custom" &&
      !formData.occupationStatusCustom.trim()
    ) {
      newErrors.occupationStatus = t("occupation.error", {
        default: "직업 상태를 입력해주세요.",
      });
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
        <ProfileSummaryCard
          name={stepOneData.name}
          birthDate={stepOneData.birthDate}
          birthTime={stepOneData.birthTime}
          birthTimeUnknown={stepOneData.birthTimeUnknown}
          calendarType={stepOneData.calendarType}
          gender={stepOneData.gender}
        />

        <SelectableChips
          label={t("relationship.label", { default: "연애 상태" })}
          options={RELATIONSHIP_OPTIONS}
          value={formData.relationshipStatus}
          customValue={formData.relationshipStatusCustom}
          onChange={handleRelationshipChange}
          columns={2}
          error={errors.relationshipStatus}
        />

        <SelectableChips
          label={t("occupation.label", { default: "직업 상태" })}
          options={OCCUPATION_OPTIONS}
          value={formData.occupationStatus}
          customValue={formData.occupationStatusCustom}
          onChange={handleOccupationChange}
          columns={2}
          error={errors.occupationStatus}
        />
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.backButton}
          onClick={onBack}
          disabled={isSubmitting}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting
            ? t("saving", { default: "저장 중..." })
            : t("save", { default: "저장하기" })}
        </Button>
      </div>
    </div>
  );
};
