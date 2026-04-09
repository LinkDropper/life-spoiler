"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

import { DeleteFaceProfileModal } from "@/components/face-spoiler/DeleteFaceProfileModal";
import { FaceProfileCard } from "@/components/face-spoiler/FaceProfileCard";
import { NewFaceProfileCard } from "@/components/face-spoiler/NewFaceProfileCard";

import styles from "../page.module.css";

import type { FaceProfileWithReport } from "../page";

interface FaceProfileListClientProps {
  initialProfiles: FaceProfileWithReport[];
}

export const FaceProfileListClient = ({
  initialProfiles,
}: FaceProfileListClientProps) => {
  const router = useRouter();
  const t = useTranslations("faceSpoiler.profiles");
  const [profiles, setProfiles] =
    useState<FaceProfileWithReport[]>(initialProfiles);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null
  );
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteTargetProfile = useMemo(
    () => profiles.find((profile) => profile.id === deleteTargetId) ?? null,
    [profiles, deleteTargetId]
  );

  const handleSelect = useCallback((id: string) => {
    setSelectedProfileId(id);
  }, []);

  const handleNewProfile = useCallback(() => {
    router.push("/face-spoiler/profiles/new");
  }, [router]);

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteTargetId(id);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    if (isDeleting) {
      return;
    }
    setDeleteTargetId(null);
  }, [isDeleting]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTargetId) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/face-spoiler/profile/${deleteTargetId}`,
        { method: "DELETE" }
      );
      const result: { success: boolean; error?: string } = await response
        .json()
        .catch(() => ({ success: false }));

      if (!response.ok || !result.success) {
        console.error("Failed to delete face profile:", result.error);
        setIsDeleting(false);
        return;
      }

      setProfiles((prev) =>
        prev.filter((profile) => profile.id !== deleteTargetId)
      );
      if (selectedProfileId === deleteTargetId) {
        setSelectedProfileId(null);
      }
      setDeleteTargetId(null);
      setIsDeleting(false);
    } catch (error) {
      console.error("Error deleting face profile:", error);
      setIsDeleting(false);
    }
  }, [deleteTargetId, selectedProfileId]);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId]
  );

  const ctaLabel = useMemo(() => {
    if (!selectedProfile?.latestReport) {
      return t("ctaNoReport", { default: "관상 보러 가기" });
    }
    return selectedProfile.latestReport.paidAt
      ? t("ctaPaid", { default: "관상 결과 보기" })
      : t("ctaUnpaid", { default: "결제하고 결과 보기" });
  }, [selectedProfile, t]);

  const handleGoToUpload = useCallback(() => {
    if (!selectedProfile) {
      return;
    }

    const latest = selectedProfile.latestReport;
    if (latest) {
      const targetPath = latest.paidAt
        ? `/face-spoiler/r/${latest.shareId}`
        : `/face-spoiler/preview/${latest.shareId}`;
      router.push(targetPath);
      return;
    }

    router.push(`/face-spoiler/upload?profileId=${selectedProfile.id}`);
  }, [router, selectedProfile]);

  return (
    <>
      <div className={styles.list}>
        {profiles.map((profile) => (
          <FaceProfileCard
            key={profile.id}
            profile={{
              id: profile.id,
              name: profile.name,
              gender: profile.gender,
            }}
            isSelected={profile.id === selectedProfileId}
            hasReport={profile.latestReport !== null}
            onSelect={handleSelect}
            onDeleteClick={handleDeleteClick}
          />
        ))}
        <NewFaceProfileCard onClick={handleNewProfile} />
      </div>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={handleGoToUpload}
          disabled={!selectedProfileId}
        >
          {ctaLabel}
        </button>
      </footer>

      <DeleteFaceProfileModal
        isOpen={deleteTargetId !== null}
        profileName={deleteTargetProfile?.name ?? ""}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};
