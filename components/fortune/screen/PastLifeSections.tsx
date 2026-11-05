import { useTranslations } from "next-intl";

import type { PastLifeFortuneInterpretation } from "@/libs/services/ai/types";

import styles from "./screen.module.css";

type Interpretation = PastLifeFortuneInterpretation;

/** 전생 키 아트. 그림이 없으면 별빛 배경만 */
const KeyArt = ({
  imageUrl,
  alt,
  className,
  lockedText,
}: {
  imageUrl: string | null;
  alt: string;
  className?: string;
  /** 예고편: 그림을 흐리게 가리고 안내 문구 (결제 후 공개, 기존 규칙) */
  lockedText?: string;
}) => (
  <div className={`${styles.keyArt} ${className ?? ""}`}>
    {imageUrl ? (
      // eslint-disable-next-line @next/next/no-img-element -- 외부 생성 이미지, 최적화 대상 아님
      <img
        src={imageUrl}
        alt={lockedText ? "" : alt}
        className={`${styles.keyArtImage} ${
          lockedText ? styles.keyArtLocked : ""
        }`}
      />
    ) : (
      <span className={styles.posterStars} aria-hidden="true" />
    )}
    <span className={styles.keyArtVignette} aria-hidden="true" />
    {lockedText && imageUrl && (
      <span className={styles.keyArtLockText}>{lockedText}</span>
    )}
  </div>
);

interface PastPosterProps {
  name: string;
  imageUrl: string | null;
  headline: string;
  tagline?: string | null;
  world: Interpretation["world"];
}

/** 전생 예고편 포스터 = 전편(PREQUEL) 포스터: AI 키 아트 + 시대·장소 크레딧 */
export const PastPoster = ({
  name,
  imageUrl,
  headline,
  tagline,
  world,
}: PastPosterProps) => {
  const t = useTranslations("fortune.screen.pastLife.poster");

  return (
    <header className={styles.pastPoster}>
      <KeyArt
        imageUrl={imageUrl}
        alt={headline}
        lockedText={t("imageLocked")}
      />
      <p className={styles.pastPresents}>A LIFE SPOILER PREQUEL</p>
      <div className={styles.pastPosterBody}>
        <div className={styles.posterBadges}>
          <span className={`${styles.pill} ${styles.pillStatus}`}>
            {t("badgeTrailer")}
          </span>
          <span className={`${styles.pill} ${styles.pillMuted}`}>PREQUEL</span>
        </div>
        <span className={styles.posterStarring}>{t("starring", { name })}</span>
        <h1 className={styles.posterTitle}>{headline}</h1>
        {tagline && <p className={styles.posterTagline}>{tagline}</p>}
        <span className={styles.pastEra}>
          {world.era} · {world.location}
        </span>
        <dl className={styles.billing}>
          <div>
            <dt>STARRING</dt>
            <dd>{name}</dd>
          </div>
          <div>
            <dt>ROLE</dt>
            <dd>{world.socialRole}</dd>
          </div>
          <div>
            <dt>ERA</dt>
            <dd>{world.era}</dd>
          </div>
        </dl>
      </div>
    </header>
  );
};

/** 세계관 · 로케이션 */
export const WorldNotes = ({ world }: { world: Interpretation["world"] }) => {
  const t = useTranslations("fortune.screen.pastLife.world");
  const rows = [
    { code: "ERA", value: world.era },
    { code: "LOCATION", value: world.location },
    { code: "ROLE", value: world.socialRole },
    { code: "MOOD", value: world.atmosphere },
  ].filter((row) => row.value);

  return (
    <section className={styles.section}>
      <p className={styles.eyebrow}>LOCATION</p>
      <h2 className={styles.sectionTitle}>{t("title")}</h2>
      <p className={styles.sectionDesc}>{t("desc")}</p>
      <dl className={styles.pastWorld}>
        {rows.map((row) => (
          <div key={row.code}>
            <dt>{row.code}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      {world.description && <p className={styles.prose}>{world.description}</p>}
    </section>
  );
};

/** 배역 노트: 능력치 5개를 게임 스탯 대신 감독 메모처럼 */
export const CharacterNote = ({
  stats,
}: {
  stats: Interpretation["stats"];
}) => {
  const t = useTranslations("fortune.screen.pastLife.note");
  const top = stats.stats.reduce(
    (best, item) => (item.score > best.score ? item : best),
    stats.stats[0]
  );

  return (
    <section className={styles.section}>
      <p className={styles.eyebrow}>CHARACTER NOTE</p>
      <h2 className={styles.sectionTitle}>
        {t("title", { title: stats.title })}
      </h2>
      <p className={styles.sectionDesc}>{t("desc")}</p>
      <dl className={styles.pastStats}>
        {stats.stats.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd className={item === top ? styles.pastStatTop : undefined}>
              {item.score}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

/** ACT 2 · 전생 연대기 (시기 · 사건) */
export const Chronicle = ({
  events,
}: {
  events: Interpretation["journey"]["events"];
}) => (
  <div className={styles.chronicle}>
    <span className={styles.chronicleLabel}>CHRONICLE</span>
    <ol className={styles.chronicleList}>
      {events.map((item, index) => (
        <li key={`${item.period}-${index}`} className={styles.chronicleItem}>
          <span className={styles.chroniclePeriod}>{item.period}</span>
          <span className={styles.chronicleEvent}>{item.event}</span>
        </li>
      ))}
    </ol>
  </div>
);

/** ACT 3 · 마지막 대사를 스틸 위 자막으로 */
export const LastWords = ({
  text,
  imageUrl,
}: {
  text: string;
  imageUrl: string | null;
}) => {
  const t = useTranslations("fortune.screen.pastLife.end");
  return (
    <figure className={styles.lastWords}>
      <KeyArt imageUrl={imageUrl} alt="" className={styles.lastWordsArt} />
      <figcaption className={styles.stillCaption}>
        <span className={styles.stillLabel}>{t("lastWords")}</span>
        <span className={styles.stillText}>“{text}”</span>
      </figcaption>
    </figure>
  );
};

/** 전편 vs 본편: 전생과 지금을 나란히 */
export const PrequelContrast = ({
  contrasts,
}: {
  contrasts: Interpretation["contrast"]["contrasts"];
}) => {
  const t = useTranslations("fortune.screen.pastLife.contrast");
  return (
    <section className={styles.section}>
      <p className={styles.eyebrow}>PREQUEL × FEATURE</p>
      <h2 className={styles.sectionTitle}>{t("title")}</h2>
      <p className={styles.sectionDesc}>{t("desc")}</p>
      <div className={styles.contrastHead} aria-hidden="true">
        <span>{t("past")}</span>
        <span>{t("present")}</span>
      </div>
      <dl className={styles.contrastList}>
        {contrasts.map((item, index) => (
          <div key={`${item.aspect}-${index}`} className={styles.contrastRow}>
            <dt>{item.aspect}</dt>
            <dd className={styles.contrastPast}>
              <span className={styles.srOnly}>{t("past")}: </span>
              {item.pastLife}
            </dd>
            <dd className={styles.contrastPresent}>
              <span className={styles.srOnly}>{t("present")}: </span>
              {item.presentLife}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

/** 본편에 남은 복선: 지금의 흔적 ↳ 전편의 장면 */
export const Foreshadow = ({
  traces,
}: {
  traces: Interpretation["traces"]["traces"];
}) => {
  const t = useTranslations("fortune.screen.pastLife.traces");
  return (
    <section className={styles.section}>
      <p className={styles.eyebrow}>FORESHADOWING</p>
      <h2 className={styles.sectionTitle}>{t("title")}</h2>
      <p className={styles.sectionDesc}>{t("desc")}</p>
      {traces.map((item, index) => (
        <article key={`${item.category}-${index}`} className={styles.trace}>
          <span className={styles.traceLabel}>
            {t("label", {
              index: String(index + 1).padStart(2, "0"),
              category: item.category,
            })}
          </span>
          <b className={styles.traceText}>{item.trace}</b>
          <span className={styles.traceOrigin}>
            ↳ {t("origin")} <span>{item.origin}</span>
          </span>
        </article>
      ))}
    </section>
  );
};

/** 에필로그: 전편이 남긴 교훈 */
export const Epilogue = ({
  lessons,
}: {
  lessons: Interpretation["lessons"]["lessons"];
}) => {
  const t = useTranslations("fortune.screen.pastLife.epilogue");
  return (
    <section className={styles.section}>
      <p className={styles.eyebrow}>EPILOGUE</p>
      <h2 className={styles.sectionTitle}>{t("title")}</h2>
      <ol className={styles.epilogueList}>
        {lessons.map((lesson, index) => (
          <li
            key={`${lesson.headline}-${index}`}
            className={styles.epilogueItem}
          >
            <b>{lesson.headline}</b>
            {lesson.bullets && lesson.bullets.length > 0 ? (
              <ul className={styles.ageBullets}>
                {lesson.bullets.map((bullet, bulletIndex) => (
                  <li key={bulletIndex}>{bullet}</li>
                ))}
              </ul>
            ) : (
              lesson.content && (
                <span className={styles.prose}>{lesson.content}</span>
              )
            )}
            {lesson.oneLiner && (
              <span className={styles.categoryLine}>{lesson.oneLiner}</span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
};
