"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { useAuthStatus } from "@/libs/stores/user";

import type { ProfileWithFortunes } from "@/libs/stores/profile";
import type { FortuneType } from "@/libs/stores/user";

import styles from "./page.module.css";

export default function ProfilesPage() {
  const router = useRouter();
  const authStatus = useAuthStatus();
  const t = useTranslations("profiles");

  const profiles = useProfiles();
  const isProfilesLoading = useIsProfilesLoading();
  const { deleteProfile: deleteProfileFromStore } = useProfileActions();

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null
  );
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (profiles.length > 0 && !selectedProfileId) {
      setSelectedProfileId(profiles[0].id);
    }
  }, [profiles, selectedProfileId]);

  if (authStatus === "loading" || isProfilesLoading) {
    return (
      <div className={styles.page}>
        <HeaderClient />
        <div className={styles.loading}>
          {t("loading", { default: "로딩 중..." })}
        </div>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  const handleProfileSelect = (profileId: string) => {
    setSelectedProfileId(profileId);
  };

  const handleDeleteClick = (profileId: string) => {
    setDeleteTargetId(profileId);
  };

  const handleDeleteCancel = () => {
    setDeleteTargetId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/profile/${deleteTargetId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete profile");
      }

      deleteProfileFromStore(deleteTargetId);

      if (selectedProfileId === deleteTargetId) {
        const remaining = profiles.filter((p) => p.id !== deleteTargetId);
        setSelectedProfileId(remaining.length > 0 ? remaining[0].id : null);
      }
      setDeleteTargetId(null);
    } catch {
      alert(
        t("deleteError", {
          default: "프로필 삭제에 실패했습니다. 다시 시도해주세요.",
        })
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNewProfile = () => {
    router.push("/profile/setup");
  };

  const getCompletedFortunes = (
    fortunes: ProfileWithFortunes["fortunes"] | undefined
  ): FortuneType[] => {
    if (!fortunes) return [];
    const types: FortuneType[] = [];
    if (fortunes.some((f) => f.fortune_type === "lifetime" && f.paid_at)) {
      types.push("lifetime");
    }
    if (fortunes.some((f) => f.fortune_type === "yearly" && f.paid_at)) {
      types.push("yearly");
    }
    return types;
  };

  // const hasPaidFortune = (fortuneType: "lifetime" | "yearly"): boolean => {
  //   if (!selectedProfileId) return false;
  //   const selectedProfile = profiles.find((p) => p.id === selectedProfileId);
  //   if (!selectedProfile?.fortunes) return false;
  //   // paid_at이 있는지 확인
  //   return selectedProfile.fortunes.some(
  //     (f) => f.fortune_type === fortuneType && f.paid_at !== null
  //   );
  // };

  const handleLifetimeFortune = () => {
    if (!selectedProfileId) {
      alert(t("selectProfile", { default: "프로필을 선택해주세요." }));
      return;
    }
    // TODO: 결제 기능 추가 후 수정
    // if (hasPaidFortune("lifetime")) {
    //   router.push(`/fortune/lifetime/${selectedProfileId}`);
    // } else {
    //   router.push(`/fortune/lifetime/preview/${selectedProfileId}`);
    // }
    router.push(`/fortune/lifetime/${selectedProfileId}`);
  };

  const handleYearlyFortune = () => {
    if (!selectedProfileId) {
      alert(t("selectProfile", { default: "프로필을 선택해주세요." }));
      return;
    }
    // TODO: 결제 기능 추가 후 수정
    // if (hasPaidFortune("yearly")) {
    //   router.push(`/fortune/yearly/${selectedProfileId}`);
    // } else {
    //   router.push(`/fortune/yearly/preview/${selectedProfileId}`);
    // }
    router.push(`/fortune/yearly/${selectedProfileId}`);
  };

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
              completedFortunes={getCompletedFortunes(profile.fortunes)}
              onSelect={() => handleProfileSelect(profile.id)}
              onDelete={() => handleDeleteClick(profile.id)}
            />
          ))}
          <NewProfileCard onClick={handleNewProfile} />
        </div>
      </main>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={handleLifetimeFortune}
          disabled={!selectedProfileId}
        >
          {t("lifetimeFortune", { default: "인생 운세 보기" })}
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleYearlyFortune}
          disabled={!selectedProfileId}
        >
          {t("yearlyFortune", { default: "올해 운세 보기" })}
        </button>
      </footer>

      <DeleteConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
