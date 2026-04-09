"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import styles from "./DeleteFaceProfileModal.module.css";

interface DeleteFaceProfileModalProps {
  isOpen: boolean;
  profileName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteFaceProfileModal = ({
  isOpen,
  profileName,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteFaceProfileModalProps) => {
  const t = useTranslations("faceSpoiler.profiles.deleteModal");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onCancel();
    }
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <h2 className={styles.title}>
          {t("title", { default: "프로필을 삭제하시겠습니까?" })}
        </h2>
        <p className={styles.description}>
          {t("description", {
            name: profileName,
            default: `'${profileName}'을(를) 삭제하면 관련된 모든 리포트도 함께 삭제됩니다. 되돌릴 수 없습니다.`,
          })}
        </p>
        <div className={styles.buttons}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={isDeleting}
          >
            {t("cancel", { default: "취소" })}
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting
              ? t("deleting", { default: "삭제 중..." })
              : t("confirm", { default: "삭제" })}
          </button>
        </div>
      </div>
    </div>
  );
};
