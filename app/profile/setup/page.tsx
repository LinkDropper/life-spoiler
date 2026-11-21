"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { useProfileActions } from "@/libs/stores/profile";
import { useAuthStatus } from "@/libs/stores/user";
import { HeaderClient } from "@/components/landing";

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
  const searchParams = useSearchParams();
  const authStatus = useAuthStatus();
  const typeParam = searchParams.get("type");
  const redirectParam = searchParams.get("redirect");
  const { addProfile } = useProfileActions();
  const t = useTranslations("profileSetup");

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [stepOneData, setStepOneData] =
    useState<StepOneData>(initialStepOneData);
  const [stepTwoData, setStepTwoData] =
    useState<StepTwoData>(initialStepTwoData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
    }
  }, [authStatus, router]);

  if (authStatus === "loading" || authStatus === "unauthenticated") {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          {t("loading", { default: "로딩 중..." })}
        </div>
      </div>
    );
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
        throw new Error("Failed to save profile");
      }

      const result = await response.json();

      const now = new Date().toISOString();
      addProfile({
        id: result.profileId,
        user_id: "",
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
        profile_free_access: [],
      });

      const redirectPath =
        redirectParam && redirectParam.startsWith("/")
          ? redirectParam
          : typeParam
            ? `/profiles?type=${typeParam}`
            : "/profiles";
      router.push(redirectPath);
    } catch {
      alert(
        t("saveError", {
          default: "프로필 저장에 실패했습니다. 다시 시도해주세요.",
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <HeaderClient />

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
