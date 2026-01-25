"use client";

import { useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { HeaderClient } from "@/components/landing";
import {
  ProfileCard,
  NewProfileCard,
  DeleteConfirmModal,
} from "@/components/profile";
import {
  useProfiles,
  useIsProfilesLoading,
  useProfileActions,
} from "@/libs/stores/profile";
import { useAuthStatus, useUser } from "@/libs/stores/user";

// 임시: 특정 유저는 프로필 추가/삭제 버튼 숨김
const RESTRICTED_USER_ID = "97f9d7a9-23f2-4fd8-98cf-ac52aa4fe059";

import {
  useProfileSelection,
  useProfileDelete,
  useFortuneNavigation,
} from "./hooks";
import styles from "./page.module.css";

export default function ProfilesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authStatus = useAuthStatus();
  const user = useUser();
  const t = useTranslations("profiles");

  // 임시: 특정 유저는 프로필 추가/삭제 버튼 숨김
  const isRestrictedUser = user?.id === RESTRICTED_USER_ID;

  const typeParam = searchParams.get("type");
  const fortuneType: "lifetime" | "yearly" | null =
    typeParam === "lifetime" || typeParam === "yearly" ? typeParam : null;

  const profiles = useProfiles();
  const isProfilesLoading = useIsProfilesLoading();
  const { fetchProfiles } = useProfileActions();

  // 커스텀 훅 사용
  const {
    selectedProfileId,
    selectedProfile,
    handleProfileSelect,
    getCompletedFortunes,
  } = useProfileSelection({ profiles });

  const {
    deleteTargetId,
    isDeleting,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
  } = useProfileDelete();

  const { navigateToFortune } = useFortuneNavigation({ selectedProfile });

  // 페이지 접근 시 프로필 정보를 다시 가져옴
  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchProfiles(true);
    }
  }, [authStatus, fetchProfiles]);

  // 인증되지 않은 사용자 리다이렉트
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
    }
  }, [authStatus, router]);

  const handleNewProfile = useCallback(() => {
    router.push("/profile/setup");
  }, [router]);

  const handleLifetimeFortune = useCallback(() => {
    if (!selectedProfileId) {
      alert(t("selectProfile", { default: "프로필을 선택해주세요." }));
      return;
    }
    navigateToFortune("lifetime");
  }, [selectedProfileId, navigateToFortune, t]);

  const handleYearlyFortune = useCallback(() => {
    if (!selectedProfileId) {
      alert(t("selectProfile", { default: "프로필을 선택해주세요." }));
      return;
    }
    navigateToFortune("yearly");
  }, [selectedProfileId, navigateToFortune, t]);

  const onDeleteConfirm = useCallback(async () => {
    const success = await handleDeleteConfirm();
    if (!success) {
      alert(
        t("deleteError", {
          default: "프로필 삭제에 실패했습니다. 다시 시도해주세요.",
        })
      );
    }
  }, [handleDeleteConfirm, t]);

  // 로딩 상태
  if (
    authStatus === "loading" ||
    isProfilesLoading ||
    authStatus === "unauthenticated"
  ) {
    return (
      <div className={styles.page}>
        <HeaderClient />
        <div className={styles.loading}>
          {t("loading", { default: "로딩 중..." })}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={styles.main}>
        <div className={styles.profileList}>
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              name={profile.name}
              birthDate={profile.birth_date}
              birthTime={profile.birth_time}
              birthTimeUnknown={profile.birth_time_unknown}
              calendarType={profile.calendar_type}
              gender={profile.gender}
              isSelected={profile.id === selectedProfileId}
              completedFortunes={getCompletedFortunes(profile)}
              onSelect={() => handleProfileSelect(profile.id)}
              onDelete={
                isRestrictedUser
                  ? undefined
                  : () => handleDeleteClick(profile.id)
              }
            />
          ))}
          {!isRestrictedUser && <NewProfileCard onClick={handleNewProfile} />}
        </div>
      </main>

      <footer className={styles.footer}>
        {(!fortuneType || fortuneType === "lifetime") && (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleLifetimeFortune}
            disabled={!selectedProfileId}
          >
            {t("lifetimeFortune", { default: "인생 운세 보기" })}
          </button>
        )}
        {(!fortuneType || fortuneType === "yearly") && (
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleYearlyFortune}
            disabled={!selectedProfileId}
          >
            {t("yearlyFortune", { default: "올해 운세 보기" })}
          </button>
        )}
      </footer>

      <DeleteConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={handleDeleteCancel}
        onConfirm={onDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
