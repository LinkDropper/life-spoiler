"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useProfileActions } from "@/libs/stores/profile";
import { useAuthStatus } from "@/libs/stores/user";
import { Header } from "@/components/landing";

import { StepOne } from "./StepOne";
import { StepTwo } from "./StepTwo";
import styles from "./page.module.css";

import type {
  CalendarType,
  Gender,
  RelationshipStatus,
  OccupationStatus,
} from "@/libs/stores/user";

export interface StepOneData {
  name: string;
  birthDate: string;
  birthTime: string;
  birthTimeUnknown: boolean;
  calendarType: CalendarType;
  gender: Gender;
}

export interface StepTwoData {
  relationshipStatus: RelationshipStatus;
  relationshipStatusCustom: string;
  occupationStatus: OccupationStatus;
  occupationStatusCustom: string;
}

const initialStepOneData: StepOneData = {
  name: "",
  birthDate: "",
  birthTime: "",
  birthTimeUnknown: false,
  calendarType: "solar",
  gender: "female",
};

const initialStepTwoData: StepTwoData = {
  relationshipStatus: "solo",
  relationshipStatusCustom: "",
  occupationStatus: "student",
  occupationStatusCustom: "",
};

export default function ProfileSetupPage() {
  const router = useRouter();
  const authStatus = useAuthStatus();
  const { addProfile } = useProfileActions();

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [stepOneData, setStepOneData] =
    useState<StepOneData>(initialStepOneData);
  const [stepTwoData, setStepTwoData] =
    useState<StepTwoData>(initialStepTwoData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (authStatus === "loading") {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  const handleStepOneNext = (data: StepOneData) => {
    setStepOneData(data);
    setCurrentStep(2);
  };

  const handleStepTwoBack = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (data: StepTwoData) => {
    setStepTwoData(data);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...stepOneData,
          ...data,
        }),
      });

      if (!response.ok) {
        throw new Error("프로필 저장에 실패했습니다.");
      }

      const result = await response.json();

      // 전역 상태에 새 프로필 추가
      const now = new Date().toISOString();
      addProfile({
        id: result.profileId,
        user_id: "", // 서버에서 설정됨
        name: stepOneData.name,
        birth_date: stepOneData.birthDate,
        birth_time: stepOneData.birthTimeUnknown ? null : stepOneData.birthTime,
        birth_time_unknown: stepOneData.birthTimeUnknown,
        calendar_type: stepOneData.calendarType,
        gender: stepOneData.gender,
        relationship_status: data.relationshipStatus || null,
        relationship_status_custom:
          data.relationshipStatus === "custom"
            ? data.relationshipStatusCustom
            : null,
        occupation_status: data.occupationStatus || null,
        occupation_status_custom:
          data.occupationStatus === "custom"
            ? data.occupationStatusCustom
            : null,
        relationship_to_user: null,
        created_at: now,
        updated_at: now,
        fortunes: [],
      });

      router.push("/profiles");
    } catch {
      alert("프로필 저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        {currentStep === 1 ? (
          <StepOne initialData={stepOneData} onNext={handleStepOneNext} />
        ) : (
          <StepTwo
            stepOneData={stepOneData}
            initialData={stepTwoData}
            onBack={handleStepTwoBack}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </main>
    </div>
  );
}
