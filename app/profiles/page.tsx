"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Header } from "@/components/landing";
import {
  ProfileCard,
  NewProfileCard,
  DeleteConfirmModal,
} from "@/components/profile";
import { useAuthStatus } from "@/libs/stores/user";

import type { ProfileWithFortunes } from "@/app/api/profile/route";
import type { FortuneType } from "@/libs/stores/user";

import styles from "./page.module.css";

export default function ProfilesPage() {
  const router = useRouter();
  const authStatus = useAuthStatus();

  const [profiles, setProfiles] = useState<ProfileWithFortunes[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await fetch("/api/profile");
        if (!response.ok) {
          throw new Error("프로필 목록을 가져오는데 실패했습니다.");
        }
        const data = await response.json();
        setProfiles(data.profiles);
        if (data.profiles.length > 0) {
          setSelectedProfileId(data.profiles[0].id);
        }
      } catch {
        console.error("프로필 목록을 가져오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    if (authStatus === "authenticated") {
      fetchProfiles();
    }
  }, [authStatus]);

  if (authStatus === "loading" || isLoading) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.loading}>로딩 중...</div>
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
        throw new Error("프로필 삭제에 실패했습니다.");
      }

      setProfiles((prev) => prev.filter((p) => p.id !== deleteTargetId));
      if (selectedProfileId === deleteTargetId) {
        const remaining = profiles.filter((p) => p.id !== deleteTargetId);
        setSelectedProfileId(remaining.length > 0 ? remaining[0].id : null);
      }
      setDeleteTargetId(null);
    } catch {
      alert("프로필 삭제에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNewProfile = () => {
    router.push("/profile/setup");
  };

  const getCompletedFortunes = (
    fortunes: ProfileWithFortunes["fortunes"]
  ): FortuneType[] => {
    const types: FortuneType[] = [];
    if (fortunes.some((f) => f.fortune_type === "lifetime")) {
      types.push("lifetime");
    }
    if (fortunes.some((f) => f.fortune_type === "yearly")) {
      types.push("yearly");
    }
    return types;
  };

  const handleLifetimeFortune = () => {
    if (!selectedProfileId) {
      alert("프로필을 선택해주세요.");
      return;
    }
    // TODO: 인생 운세 페이지로 이동
    console.log("인생 운세 보기", selectedProfileId);
  };

  const handleYearlyFortune = () => {
    if (!selectedProfileId) {
      alert("프로필을 선택해주세요.");
      return;
    }
    // TODO: 올해 운세 페이지로 이동
    console.log("올해 운세 보기", selectedProfileId);
  };

  return (
    <div className={styles.page}>
      <Header />

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
          인생 운세 보기
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleYearlyFortune}
          disabled={!selectedProfileId}
        >
          올해 운세 보기
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
