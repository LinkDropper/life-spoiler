"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { trackLandingEvent } from "@/libs/analytics";
import { consumeLandingBirthDraft } from "@/libs/landing/birth-draft";
import {
  HOME_REDIRECT,
  getProfileSetupRedirect,
} from "@/libs/profile/setup-redirect";
import {
  useProfileActions,
  useProfileLoadStatus,
  useProfiles,
} from "@/libs/stores/profile";
import { useAuthStatus } from "@/libs/stores/user";
import { HeaderClient } from "@/components/landing";

import { SceneHeader } from "./SceneHeader";
import { StepOne } from "./StepOne";
import { StepTwo } from "./StepTwo";
import styles from "./page.module.css";

import type {
  CalendarType,
  Gender,
  RelationshipStatus,
  OccupationStatus,
} from "@/libs/stores/user";
import { showToast } from "@/libs/toast";

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
  const profiles = useProfiles();
  const profileLoadStatus = useProfileLoadStatus();
  const t = useTranslations("profileSetup");

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [stepOneData, setStepOneData] =
    useState<StepOneData>(initialStepOneData);
  const [stepTwoData, setStepTwoData] =
    useState<StepTwoData>(initialStepTwoData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrefilledFromLanding, setIsPrefilledFromLanding] = useState(false);
  const hasCheckedDraftRef = useRef(false);

  // 프로필 목록을 받아야 "첫 프로필"인지 알 수 있다. 실패하면 이어 쓰기 없이 빈 폼으로 진행한다.
  const isProfilesSettled =
    profileLoadStatus === "loaded" || profileLoadStatus === "error";

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
    }
  }, [authStatus, router]);

  // 첫 프로필일 때만 랜딩 "내 명반 그려보기"에서 넣은 생년월일시를 채운다.
  // 두 번째 프로필부터는 가족·친구 정보를 넣는 경우라 남은 값이 있어도 쓰지 않고 버린다.
  // 목록 조회가 실패하면(error) 프로필이 0개로 보이므로 첫 프로필로 단정하지 않고 채우지 않는다.
  useEffect(() => {
    if (authStatus !== "authenticated" || profileLoadStatus !== "loaded")
      return;
    if (hasCheckedDraftRef.current) return;
    hasCheckedDraftRef.current = true;

    const draft = consumeLandingBirthDraft();
    if (!draft || profiles.length > 0) return;

    setStepOneData((current) => ({ ...current, ...draft }));
    setIsPrefilledFromLanding(true);
    trackLandingEvent("landing_draft_applied", {
      time_known: !draft.birthTimeUnknown,
    });
  }, [authStatus, profileLoadStatus, profiles.length]);

  if (
    authStatus === "loading" ||
    authStatus === "unauthenticated" ||
    !isProfilesSettled
  ) {
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

      router.push(
        getProfileSetupRedirect(redirectParam, typeParam, result.profileId)
      );
    } catch {
      showToast({
        kind: "error",
        message: t("saveError", {
          default: "프로필 저장에 실패했습니다. 다시 시도해주세요.",
        }),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFromHome = redirectParam === HOME_REDIRECT;

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={styles.main}>
        <SceneHeader
          step={currentStep}
          title={
            currentStep === 1
              ? t("stepOne.title")
              : t("stepTwo.title", { name: stepOneData.name })
          }
          description={
            currentStep === 1 ? t("stepOne.subtitle") : t("stepTwo.subtitle")
          }
        />
        {currentStep === 1 ? (
          // 이어 쓰기 값이 들어오면 StepOne이 그 값으로 다시 시작하도록 key를 바꾼다
          <StepOne
            key={isPrefilledFromLanding ? "landing-draft" : "empty"}
            initialData={stepOneData}
            onNext={handleStepOneNext}
            isPrefilledFromLanding={isPrefilledFromLanding}
          />
        ) : (
          <StepTwo
            stepOneData={stepOneData}
            initialData={stepTwoData}
            onBack={handleStepTwoBack}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            saveLabel={
              isFromHome ? t("stepTwo.saveAndWatch") : t("stepTwo.save")
            }
          />
        )}
      </main>
    </div>
  );
}
