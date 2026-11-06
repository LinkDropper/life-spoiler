"use client";

import styles from "./ErrorPage.module.css";

interface IntermissionScreenProps {
  intermission: string;
  title: string;
  description: string;
  /** "오류 코드 a3f9c2" — Next가 준 digest가 있을 때만 */
  codeText?: string;
  retryLabel: string;
  homeLabel: string;
  onRetry: () => void;
}

/**
 * 앱 오류 = 상영 중단(INTERMISSION). 운세 화면 오류(ErrorState)와 같은 검은 스크린.
 * 번역 도구 없이도 그릴 수 있게 문구를 모두 props로 받는다(global-error는 Provider 밖).
 */
export const IntermissionScreen = ({
  intermission,
  title,
  description,
  codeText,
  retryLabel,
  homeLabel,
  onRetry,
}: IntermissionScreenProps) => (
  <main className={styles.main} role="alert">
    <div className={styles.intermission}>
      <span className={styles.intermissionCode}>INTERMISSION</span>
      <b className={styles.intermissionTitle}>{intermission}</b>
    </div>
    <h1 className={styles.heading}>{title}</h1>
    <p className={styles.desc}>{description}</p>
    {codeText && <span className={styles.digest}>{codeText}</span>}
    <div className={styles.actions}>
      <button type="button" className={styles.primary} onClick={onRetry}>
        {retryLabel}
      </button>
      {/* 오류 상태를 통째로 비우려고 클라이언트 이동 대신 새로 불러온다 */}
      <button
        type="button"
        className={styles.ghost}
        onClick={() => window.location.assign("/")}
      >
        {homeLabel}
      </button>
    </div>
  </main>
);
