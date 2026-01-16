"use client";

import { useEffect } from "react";

import styles from "./DeleteConfirmModal.module.css";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.titleRow}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M17 3.34001C18.5083 4.21087 19.7629 5.46054 20.6398 6.96531C21.5167 8.47009 21.9854 10.1778 21.9994 11.9194C22.0135 13.6609 21.5725 15.376 20.72 16.8947C19.8676 18.4135 18.6332 19.6832 17.1392 20.5783C15.6452 21.4734 13.9434 21.9628 12.2021 21.9981C10.4608 22.0333 8.74055 21.6132 7.21155 20.7793C5.68256 19.9453 4.39787 18.7265 3.48467 17.2435C2.57146 15.7605 2.06141 14.0647 2.005 12.324L2 12L2.005 11.676C2.061 9.94901 2.56355 8.26598 3.46364 6.79101C4.36373 5.31604 5.63065 4.09947 7.14089 3.2599C8.65113 2.42033 10.3531 1.98641 12.081 2.00045C13.8089 2.01449 15.5036 2.47601 17 3.34001ZM12.01 15L11.883 15.007C11.64 15.0359 11.4159 15.153 11.2534 15.336C11.0909 15.519 11.0011 15.7553 11.0011 16C11.0011 16.2448 11.0909 16.481 11.2534 16.6641C11.4159 16.8471 11.64 16.9641 11.883 16.993L12 17L12.127 16.993C12.37 16.9641 12.5941 16.8471 12.7566 16.6641C12.9191 16.481 13.0089 16.2448 13.0089 16C13.0089 15.7553 12.9191 15.519 12.7566 15.336C12.5941 15.153 12.37 15.0359 12.127 15.007L12.01 15ZM12 7.00001C11.7551 7.00005 11.5187 7.08997 11.3356 7.25273C11.1526 7.41549 11.0357 7.63976 11.007 7.88301L11 8.00001V12L11.007 12.117C11.0359 12.3601 11.153 12.5841 11.336 12.7466C11.519 12.9091 11.7552 12.9989 12 12.9989C12.2448 12.9989 12.481 12.9091 12.664 12.7466C12.847 12.5841 12.9641 12.3601 12.993 12.117L13 12V8.00001L12.993 7.88301C12.9643 7.63976 12.8474 7.41549 12.6644 7.25273C12.4813 7.08997 12.2449 7.00005 12 7.00001Z"
                  fill="#FA5252"
                />
              </svg>
              <span className={styles.title}>정말 삭제하시겠어요?</span>
            </div>
            <p className={styles.description}>
              삭제 후에는 복구가 불가능 합니다. 선택한 프로필의 운세 기록도 모두
              삭제됩니다.
            </p>
          </div>
          ㄹ
          <div className={styles.buttons}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isDeleting}
            >
              취소
            </button>
            <button
              type="button"
              className={styles.deleteButton}
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "삭제 중..." : "삭제하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
