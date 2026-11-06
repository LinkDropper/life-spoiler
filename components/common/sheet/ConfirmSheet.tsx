"use client";

import { useId } from "react";

import { Sheet } from "./Sheet";
import styles from "./ConfirmSheet.module.css";
import { SheetButton } from "./SheetButton";

interface ConfirmSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** 제목 위 영문 장식 라벨 (DELETE · WITHDRAW) */
  eyebrow: string;
  title: string;
  description: string;
  /** 대상 줄 이름표 (예: "삭제할 프로필"). targetValue와 함께 쓴다 */
  targetLabel?: string;
  /** 대상 줄 값 (예: 프로필 이름) */
  targetValue?: string;
  cancelLabel: string;
  confirmLabel: string;
  /** 처리 중 확인 버튼 문구 */
  busyLabel: string;
  /** 처리 중: 두 버튼·Esc·바깥 누르기가 잠기고 상태가 스크린리더에 읽힌다 */
  isBusy?: boolean;
  /** 실패 문구. 있으면 시트 안에 role="alert"로 보여 준다 */
  errorMessage?: string | null;
}

/**
 * 파괴적 행동(삭제·탈퇴) 확인 시트. alertdialog로 읽히고 취소 버튼이 초기 포커스를 받는다.
 * 취소가 연핑크 기본, 파괴 버튼은 테두리 버튼이라 색으로 겁주지 않는다.
 */
export const ConfirmSheet = ({
  isOpen,
  onClose,
  onConfirm,
  eyebrow,
  title,
  description,
  targetLabel,
  targetValue,
  cancelLabel,
  confirmLabel,
  busyLabel,
  isBusy = false,
  errorMessage,
}: ConfirmSheetProps) => {
  const descriptionId = useId();
  const errorId = useId();

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      eyebrow={eyebrow}
      title={title}
      role="alertdialog"
      describedBy={errorMessage ? `${descriptionId} ${errorId}` : descriptionId}
      isBusy={isBusy}
      hasCloseButton={false}
    >
      <p id={descriptionId} className={styles.description}>
        {description}
      </p>

      {targetLabel && targetValue && (
        <dl className={styles.target}>
          <dt className={styles.targetLabel}>{targetLabel}</dt>
          <dd className={styles.targetValue}>{targetValue}</dd>
        </dl>
      )}

      {errorMessage && (
        <div id={errorId} className={styles.error} role="alert">
          <span className={styles.errorTag} aria-hidden="true">
            ERROR
          </span>
          <b className={styles.errorMessage}>{errorMessage}</b>
        </div>
      )}

      <div className={styles.buttons}>
        <SheetButton onClick={onClose} disabled={isBusy} isInitialFocus>
          {cancelLabel}
        </SheetButton>
        <SheetButton variant="ghost" onClick={onConfirm} disabled={isBusy}>
          {isBusy ? busyLabel : confirmLabel}
        </SheetButton>
      </div>

      {isBusy && (
        <p className={styles.srOnly} role="status">
          {busyLabel}
        </p>
      )}
    </Sheet>
  );
};
