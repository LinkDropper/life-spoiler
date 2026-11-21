"use client";

import { useTranslations } from "next-intl";

import { formatBirthDate, formatBirthTime } from "./utils";
import styles from "./page.module.css";

import type { ProfileRow } from "@/libs/supabase/types";

const MAX_SELECTED = 2;

interface ProfileSelectModalProps {
  profiles: ProfileRow[];
  tempSelectedIds: string[];
  onToggleProfile: (id: string) => void;
  onNewProfile: () => void;
  onConfirm: () => void;
  onClose: () => void;
}

export const ProfileSelectModal = ({
  profiles,
  tempSelectedIds,
  onToggleProfile,
  onNewProfile,
  onConfirm,
  onClose,
}: ProfileSelectModalProps) => {
  const t = useTranslations("compatibility.setup");
  const tProfile = useTranslations("profiles.card");

  const timeUnknownLabel = tProfile("timeUnknown", {
    default: "시간 모름",
  });

  const getCalendarLabel = (type: "solar" | "lunar") => {
    return type === "solar"
      ? tProfile("solar", { default: "양력" })
      : tProfile("lunar", { default: "음력" });
  };

  const getGenderLabel = (g: "male" | "female") => {
    return g === "male"
      ? tProfile("male", { default: "남성" })
      : tProfile("female", { default: "여성" });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isFull = tempSelectedIds.length >= MAX_SELECTED;

  return (
    <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <span className={styles.modalTitle}>
            {t("modalTitle", {
              default: "프로필 2개를 선택해 주세요",
            })}
          </span>

          <button
            type="button"
            className={styles.modalNewProfileCard}
            onClick={onNewProfile}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 3.75V14.25"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3.75 9H14.25"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className={styles.modalNewProfileLabel}>
              {t("newProfile", {
                default: "새 프로필 만들기",
              })}
            </span>
          </button>

          {profiles.map((profile) => {
            const isSelected = tempSelectedIds.includes(profile.id);

            return (
              <button
                key={profile.id}
                type="button"
                className={[
                  styles.modalProfileCard,
                  isSelected ? styles.modalProfileSelected : "",
                ].join(" ")}
                onClick={() => onToggleProfile(profile.id)}
                disabled={!isSelected && isFull}
              >
                <div className={styles.profileCardNameRow}>
                  <span className={styles.profileCardName}>{profile.name}</span>
                </div>
                <div className={styles.profileCardInfoRow}>
                  <div className={styles.profileCardDateTime}>
                    <span className={styles.profileCardInfoText}>
                      {formatBirthDate(profile.birth_date)}
                    </span>
                    <span className={styles.profileCardInfoText}>
                      {formatBirthTime(
                        profile.birth_time,
                        profile.birth_time_unknown,
                        timeUnknownLabel
                      )}
                    </span>
                  </div>
                  <div className={styles.profileCardTags}>
                    <span className={styles.profileCardTag}>
                      {getCalendarLabel(profile.calendar_type)}
                    </span>
                    <span className={styles.profileCardTag}>
                      {getGenderLabel(profile.gender)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className={styles.modalButtons}>
          <button
            type="button"
            className={styles.modalCancelButton}
            onClick={onClose}
          >
            {t("cancel", { default: "취소" })}
          </button>
          <button
            type="button"
            className={styles.modalConfirmButton}
            onClick={onConfirm}
            disabled={tempSelectedIds.length !== MAX_SELECTED}
          >
            {t("confirm", { default: "확인" })}
          </button>
        </div>
      </div>
    </div>
  );
};
