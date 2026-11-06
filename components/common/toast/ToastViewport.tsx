"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";

import {
  dismissToast,
  getServerToastState,
  getToastState,
  subscribeToasts,
} from "@/libs/toast";
import type { ToastItem } from "@/libs/toast";

import styles from "./ToastViewport.module.css";

interface ToastCardProps {
  toast: ToastItem;
  closeLabel: string;
}

const ToastCard = ({ toast, closeLabel }: ToastCardProps) => {
  const isError = toast.kind === "error";

  return (
    <div
      className={`${styles.toast} ${isError ? "" : styles.toastNotice}`}
      data-testid={`toast-${toast.kind}`}
    >
      <div className={styles.text}>
        <span className={styles.tag} aria-hidden="true">
          {isError ? "ERROR" : "NOTICE"}
        </span>
        <b className={styles.message}>{toast.message}</b>
      </div>
      {isError && (
        <button
          type="button"
          className={styles.close}
          onClick={() => dismissToast("error")}
          aria-label={closeLabel}
        >
          <X size={20} strokeWidth={2} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

/**
 * 앱 안 알림이 뜨는 자리. 루트 레이아웃에 한 번만 둔다.
 * 스크린리더가 새 알림을 읽도록 live 영역(오류 alert · 안내 status)은 항상 마운트해 두고
 * 안의 내용만 바꾼다. 시트(z-index 10000)보다 위에 뜬다.
 */
export const ToastViewport = () => {
  const t = useTranslations("common.toast");
  const { error, notice } = useSyncExternalStore(
    subscribeToasts,
    getToastState,
    getServerToastState
  );

  return (
    <div className={styles.viewport}>
      <div role="alert" className={styles.slot}>
        {error && (
          <ToastCard key={error.id} toast={error} closeLabel={t("close")} />
        )}
      </div>
      <div role="status" className={styles.slot}>
        {notice && (
          <ToastCard key={notice.id} toast={notice} closeLabel={t("close")} />
        )}
      </div>
    </div>
  );
};
