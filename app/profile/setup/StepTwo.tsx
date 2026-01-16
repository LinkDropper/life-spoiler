"use client";

import { useState } from "react";

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

const RELATIONSHIP_OPTIONS = [
  { value: "solo", label: "솔로" },
  { value: "dating", label: "연애중" },
  { value: "married", label: "결혼함" },
  { value: "divorced", label: "이혼 / 사별" },
  { value: "custom", label: "직접 입력" },
];

const OCCUPATION_OPTIONS = [
  { value: "student", label: "학생" },
  { value: "job_seeker", label: "취준생" },
  { value: "homemaker", label: "주부" },
  { value: "employed", label: "직장인" },
  { value: "self_employed", label: "사업 / 프리랜서" },
  { value: "retired", label: "은퇴" },
  { value: "custom", label: "직접 입력" },
];

export const StepTwo = ({
  stepOneData,
  initialData,
  onBack,
  onSubmit,
  isSubmitting,
}: StepTwoProps) => {
  const [formData, setFormData] = useState<StepTwoData>(initialData);
  const [errors, setErrors] = useState<
    Partial<Record<keyof StepTwoData, string>>
  >({});

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
      newErrors.relationshipStatus = "연애 상태를 입력해주세요.";
    }

    if (
      formData.occupationStatus === "custom" &&
      !formData.occupationStatusCustom.trim()
    ) {
      newErrors.occupationStatus = "직업 상태를 입력해주세요.";
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
          label="연애 상태"
          options={RELATIONSHIP_OPTIONS}
          value={formData.relationshipStatus}
          customValue={formData.relationshipStatusCustom}
          onChange={handleRelationshipChange}
          columns={2}
          error={errors.relationshipStatus}
        />

        <SelectableChips
          label="직업 상태"
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
          {isSubmitting ? "저장 중..." : "저장하기"}
        </Button>
      </div>
    </div>
  );
};
