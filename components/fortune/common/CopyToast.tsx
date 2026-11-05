import { Check } from "lucide-react";

import styles from "./CopyToast.module.css";

interface CopyToastProps {
  message: string;
}

/** 복사·저장 같은 짧은 완료 알림. 스크린리더도 읽도록 status로 둔다 */
export const CopyToast = ({ message }: CopyToastProps) => (
  <div className={styles.copyToast} role="status" aria-live="polite">
    <span className={styles.check} aria-hidden="true">
      <Check size={12} strokeWidth={3} />
    </span>
    <b className={styles.message}>{message}</b>
    <span className={styles.code} aria-hidden="true">
      COPIED
    </span>
  </div>
);
