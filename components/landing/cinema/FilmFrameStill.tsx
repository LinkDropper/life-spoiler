import { NightSkyArt } from "./NightSkyArt";
import styles from "./FilmFrameStill.module.css";

/** 블러 아래 자리 표시 문구. 읽히면 안 되므로 번역하지 않는다 */
const LOCKED_PLACEHOLDER = "이 10년의 줄거리는 본편에서 공개됩니다";

interface FilmFrameStillProps {
  /** 같은 명반이면 같은 하늘이 나오게 하는 시드 (궁 이름-시작 나이) */
  seedKey: string;
  tint: string;
  starNames: string[];
  /** 스크린리더용 하늘 설명 */
  skyLabel: string;
  /** 타임코드 (예: "25~34세") */
  ages: string;
  /** 지금 나이의 칸이면 표시 문구 (예: "지금 상영 중") */
  nowLabel?: string;
  /** 줄거리. 없으면 블러로 잠근다 */
  subtitle?: string | null;
  /** 잠긴 줄거리를 스크린리더에 알리는 문구 */
  lockedLabel: string;
  className?: string;
}

/**
 * 인생 필름 한 칸 — 그 10년의 밤하늘 위에 타임코드·상영 표시·줄거리 자막.
 * 홈 첫 화면(FilmHero)과 랜딩 인생 필름 장면(FilmScene)이 함께 쓴다.
 * 칸 안 글자 크기는 칸 폭(컨테이너 쿼리)을 따라가 어느 크기에서도 비율이 같다.
 */
export const FilmFrameStill = ({
  seedKey,
  tint,
  starNames,
  skyLabel,
  ages,
  nowLabel,
  subtitle,
  lockedLabel,
  className,
}: FilmFrameStillProps) => (
  <div className={[styles.still, className].filter(Boolean).join(" ")}>
    <NightSkyArt
      seedKey={seedKey}
      tint={tint}
      starNames={starNames}
      label={skyLabel}
    />
    <span className={styles.timecode}>{ages}</span>
    {nowLabel && (
      <span className={styles.onAir}>
        <i aria-hidden="true" />
        {nowLabel}
      </span>
    )}
    {subtitle ? (
      <p className={styles.subtitle}>{subtitle}</p>
    ) : (
      <p className={`${styles.subtitle} ${styles.locked}`}>
        <span aria-hidden="true">{LOCKED_PLACEHOLDER}</span>
        <span className={styles.srOnly}>{lockedLabel}</span>
      </p>
    )}
  </div>
);
