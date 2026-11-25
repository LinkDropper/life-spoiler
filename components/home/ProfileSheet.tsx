"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { DeleteConfirmModal } from "@/components/profile";
import { hasPaidFortuneOf } from "@/libs/fortune/entitlement";
import { useProfileActions } from "@/libs/stores/profile";
import type { ProfileWithFortunes } from "@/libs/stores/profile";

import { formatBirthDate } from "./format";
import { HomeSheet, HomeSheetTextButton } from "./HomeSheet";
import styles from "./ProfileSheet.module.css";

const PAID_FORTUNE_TYPES = [
  "lifetime",
  "yearly",
  "yearly_2027",
  "past_life",
] as const;

const countPaidFortunes = (profile: ProfileWithFortunes): number =>
  PAID_FORTUNE_TYPES.filter((type) => hasPaidFortuneOf(profile, type)).length;

interface ProfileSheetProps {
  isOpen: boolean;
  profiles: ProfileWithFortunes[];
  selectedProfileId: string | undefined;
  /** 프로필 추가·삭제를 막는 계정이면 전환만 할 수 있다 */
  canEdit: boolean;
  onSelect: (profileId: string) => void;
  onClose: () => void;
}

/**
 * 홈 프로필 전환 바텀시트. 목록 맨 끝에 "프로필 추가"를 두고,
 * 헤더의 "편집"을 누르면 각 행에 삭제 버튼이 나온다.
 * 선택 중인 프로필을 지우면 홈은 가장 먼저 만든 프로필로 돌아간다
 * (resolveSelectedProfile이 처리), 마지막 1개를 지우면 0개 상태가 된다.
 */
export const ProfileSheet = ({
  isOpen,
  profiles,
  selectedProfileId,
  canEdit,
  onSelect,
  onClose,
}: ProfileSheetProps) => {
  const t = useTranslations("home.sheet");
  const tProfiles = useTranslations("profiles");
  const { deleteProfile } = useProfileActions();

  const [isEditing, setIsEditing] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 만든 순서대로: 기본값(가장 먼저 만든 프로필)이 맨 위에 온다
  const orderedProfiles = useMemo(
    () =>
      [...profiles].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [profiles]
  );

  const handleClose = useCallback(() => {
    setIsEditing(false);
    onClose();
  }, [onClose]);

  const handleSelect = (profileId: string) => {
    onSelect(profileId);
    handleClose();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/profile/${deleteTargetId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        alert(tProfiles("deleteError"));
        return;
      }

      deleteProfile(deleteTargetId);
      setDeleteTargetId(null);
      if (profiles.length <= 1) handleClose();
    } catch {
      // 네트워크 단절 등 요청 자체가 실패한 경우
      alert(tProfiles("deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <HomeSheet
        eyebrow={isEditing ? "EDIT" : "NOW SHOWING"}
        title={isEditing ? t("editTitle") : t("title")}
        showClose={!isEditing}
        closeOnEscape={!deleteTargetId}
        onClose={handleClose}
        actions={
          isEditing ? (
            <HomeSheetTextButton onClick={() => setIsEditing(false)}>
              {t("done")}
            </HomeSheetTextButton>
          ) : (
            canEdit && (
              <HomeSheetTextButton onClick={() => setIsEditing(true)}>
                {t("edit")}
              </HomeSheetTextButton>
            )
          )
        }
      >
        <ul className={styles.list}>
          {orderedProfiles.map((profile) => {
            const paidCount = countPaidFortunes(profile);
            const isSelected = profile.id === selectedProfileId;
            const meta = (
              <span className={styles.label}>
                <span className={styles.name}>{profile.name}</span>
                <span className={styles.meta}>
                  {formatBirthDate(profile.birth_date)}
                  {paidCount > 0 &&
                    ` · ${t("paidCount", { count: paidCount })}`}
                </span>
              </span>
            );

            return (
              <li key={profile.id}>
                {isEditing ? (
                  <div className={styles.row}>
                    {meta}
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => setDeleteTargetId(profile.id)}
                      aria-label={t("deleteLabel", { name: profile.name })}
                    >
                      {t("delete")}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.row}
                    aria-pressed={isSelected}
                    onClick={() => handleSelect(profile.id)}
                  >
                    {meta}
                    {isSelected && (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#ff8fb1"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        className={styles.check}
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        {!isEditing && canEdit && (
          <Link href="/profile/setup" className={styles.addRow}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            {t("add")}
          </Link>
        )}
      </HomeSheet>

      <DeleteConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </>
  );
};
