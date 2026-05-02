import Image from "next/image";

import {
  FACE_SPOILER_DOWNLOAD_SLOT_ID,
  FACE_SPOILER_HERO_CAPTURE_ID,
} from "./face-report-actions-constants";

import styles from "./PreviewProfileCard.module.css";

interface PreviewProfileCardProps {
  /** 종합 캐릭터 타이틀 (finalCharacterTitle). */
  characterTitle: string;
  /** 종합 점수 — 0~100 정수. UI 에선 N.N / 10 으로 환산. */
  totalScore: number;
  /** section 1 본문에서 분리된 lead paragraph. */
  leadParagraph: string;
  /**
   * 결제 완료 후 결과 페이지 — 실제 생성된 캐릭터 이미지 URL.
   * 값이 있으면 placeholder/caption/animalShortName 대신 이 이미지를 표시한다.
   */
  characterImageUrl?: string;
  /** 결과 모드 이미지의 alt 텍스트. */
  characterImageAlt?: string;
  /** preview 모드 — 동물상 짧은 이름(예: "여우상"). characterImageUrl 가 있으면 무시. */
  animalShortName?: string | null;
  /** preview 모드 — placeholder 위 안내 문구. characterImageUrl 가 있으면 무시. */
  placeholderCaption?: string;
  /**
   * 결과 페이지에서만 공유 아이콘 슬롯 노출.
   * 미리보기(/face-spoiler/preview/[shareId]) 페이지는 결제 전이므로 공유 대상이 없어 노출하지 않는다.
   */
  showShareSlot?: boolean;
}

/**
 * Figma 디자인 기준 — boundary line 2 + dashed divider 3 = 4 segments.
 * 양 끝(0%, 100%) 은 점수바 양 끝선이 자연스럽게 boundary 역할,
 * 가운데 25/50/75% 위치에만 점선 divider 를 그린다.
 */
const DASHED_DIVIDER_PERCENTS = [25, 50, 75] as const;

const getScoreOutOfTen = (totalScore: number): string => {
  const clamped = Math.max(0, Math.min(100, totalScore));
  return (clamped / 10).toFixed(1);
};

const splitVertically = (name: string): string[] => Array.from(name);

export const PreviewProfileCard = ({
  characterTitle,
  totalScore,
  leadParagraph,
  characterImageUrl,
  characterImageAlt,
  animalShortName,
  placeholderCaption,
  showShareSlot = false,
}: PreviewProfileCardProps) => {
  const scoreText = getScoreOutOfTen(totalScore);
  const filledRatio = Math.max(0, Math.min(1, totalScore / 100));
  const isResultMode = Boolean(characterImageUrl);
  const animalChars = animalShortName ? splitVertically(animalShortName) : [];

  return (
    <article id={FACE_SPOILER_HERO_CAPTURE_ID} className={styles.card}>
      {showShareSlot && (
        /*
         * 헤더는 absolute 로 띄워 layout 흐름에서 분리한다.
         * flex 자식으로 두면 캡처 시 data-capture-exclude 로 노드는 빠져도
         * html-to-image 가 부모(.card)의 layout 을 freeze 해 24px 만큼 빈 공간이 남는다.
         * absolute 라 처음부터 공간을 차지하지 않으므로 캡처/온스크린 모두 깔끔.
         */
        <div className={styles.header} data-capture-exclude="true">
          <div
            id={FACE_SPOILER_DOWNLOAD_SLOT_ID}
            className={styles.shareSlot}
          />
        </div>
      )}
      <div
        className={
          isResultMode
            ? `${styles.imageBlock} ${styles.imageBlockResult}`
            : styles.imageBlock
        }
      >
        {isResultMode ? (
          /* 결과 모드 — 실제 생성된 캐릭터 이미지 (외부 URL, 동적). */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={styles.resultImage}
            src={characterImageUrl}
            alt={characterImageAlt ?? ""}
          />
        ) : (
          <>
            <Image
              className={styles.placeholderImage}
              src="/images/face-spoiler/preview/icon-character-placeholder.svg"
              alt=""
              width={303}
              height={303}
              aria-hidden
              priority
            />
            {placeholderCaption && (
              <p className={styles.placeholderCaption}>{placeholderCaption}</p>
            )}
          </>
        )}
        {animalChars.length > 0 && (
          <span
            className={
              isResultMode
                ? `${styles.animalVertical} ${styles.animalVerticalResult}`
                : styles.animalVertical
            }
            aria-label={animalShortName ?? undefined}
          >
            {animalChars.map((ch, idx) => (
              <span key={idx} className={styles.animalChar}>
                {ch}
              </span>
            ))}
          </span>
        )}
      </div>

      <div className={styles.scoreBlock}>
        <div className={styles.scoreRow}>
          <span className={styles.scoreLabel}>종합 점수</span>
          <span className={styles.scoreValue}>
            <span className={styles.scoreNumber}>{scoreText}</span>
            <span className={styles.scoreOutOf}> / 10</span>
          </span>
        </div>
        <div
          className={styles.scoreBar}
          role="progressbar"
          aria-label="종합 점수"
          aria-valuemin={0}
          aria-valuemax={10}
          aria-valuenow={Number(scoreText)}
        >
          <span
            className={styles.scoreFill}
            style={{ width: `${(filledRatio * 100).toFixed(1)}%` }}
          />
          {DASHED_DIVIDER_PERCENTS.map((percent) => (
            <span
              key={percent}
              className={styles.scoreDivider}
              style={{ left: `${percent}%` }}
            />
          ))}
        </div>
      </div>

      <div className={styles.titleBlock}>
        <h1 className={styles.title}>{characterTitle}</h1>
        {leadParagraph.length > 0 && (
          <p className={styles.lead}>{leadParagraph}</p>
        )}
      </div>
    </article>
  );
};
