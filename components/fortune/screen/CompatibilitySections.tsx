"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { MarkdownContent } from "@/components/fortune";
import type { ConstellationStar } from "@/libs/fortune/lifetime-screen";
import type { CompatibilityGenre } from "@/libs/fortune/compatibility-screen";
import type {
  CompatibilityInsightItem,
  CompatibilityScenario,
} from "@/libs/hooks/compatibility/types";
import { getStarImagePath } from "@/libs/utils";
import type { ZiweiChart } from "@/libs/zi-wei-dou-shu/types";

import { ChartConstellation } from "./ChartConstellation";
import { NumberedSections } from "./NumberedSections";
import { SubtitleStill } from "./SubtitleStill";
import styles from "./screen.module.css";

/** 한 사람의 배역 정보 (A = 핑크, B = 하늘색) */
export interface CompatibilityLead {
  side: "a" | "b";
  name: string;
  /** 명궁 주성 한글 이름 (그림 경로용) */
  starKey: string | null;
  /** 출연진 줄의 "명궁 천부" */
  leadStar: string;
  wuxingJu: string;
  summary?: string;
  chart: ZiweiChart | null;
  stars: ConstellationStar[];
}

const sideClass = (side: CompatibilityLead["side"]): string =>
  side === "a" ? styles.duoA : styles.duoB;

interface CoStarPosterProps {
  leadA: CompatibilityLead;
  leadB: CompatibilityLead;
  genre: CompatibilityGenre;
  relationLabel: string | null;
  score: number;
  headline: string;
  tagline?: string;
}

/** 궁합 예고편 포스터 = 공동 주연 포스터: 두 이름을 나란히, 가운데 케미 점수, 관계 유형 = 장르 */
export const CoStarPoster = ({
  leadA,
  leadB,
  genre,
  relationLabel,
  score,
  headline,
  tagline,
}: CoStarPosterProps) => {
  const t = useTranslations("fortune.screen.compatibility");
  const genreLabel = t(`genre.${genre}`);

  return (
    <header className={styles.coPoster}>
      <p className={styles.coPresents}>LIFE SPOILER · CO-STARRING</p>
      <div className={styles.coLeads}>
        {[leadA, leadB].map((lead) => (
          <div
            key={lead.side}
            className={`${styles.coLead} ${sideClass(lead.side)}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- 주성 그림(정적 PNG) */}
            <img
              src={getStarImagePath(lead.starKey ?? "")}
              alt=""
              width={150}
              height={82}
              className={styles.coLeadArt}
            />
            <span className={styles.coLeadStar}>{lead.leadStar}</span>
            <b className={styles.coLeadName}>{lead.name}</b>
          </div>
        ))}
        <span className={styles.coTimes} aria-hidden="true">
          ×
        </span>
      </div>
      <div className={styles.coBody}>
        <p className={styles.coScore}>
          <span>CHEMISTRY</span>
          <b aria-label={t("poster.scoreAria", { score })}>{score}</b>
        </p>
        <div className={styles.posterBadges}>
          <span className={`${styles.pill} ${styles.pillStatus}`}>
            {t("poster.badgeTrailer")}
          </span>
          <span className={`${styles.pill} ${styles.pillMuted}`}>
            {relationLabel ? `${genreLabel} · ${relationLabel}` : genreLabel}
          </span>
        </div>
        <h1 className={styles.coTitle}>{headline}</h1>
        {tagline && <p className={styles.posterTagline}>{tagline}</p>}
        <dl className={styles.billing}>
          <div>
            <dt>STARRING</dt>
            <dd>
              {leadA.name} · {leadB.name}
            </dd>
          </div>
          <div>
            <dt>GENRE</dt>
            <dd>{genreLabel}</dd>
          </div>
          <div>
            <dt>CHEMISTRY</dt>
            <dd>{t("poster.scoreUnit", { score })}</dd>
          </div>
        </dl>
      </div>
    </header>
  );
};

/** 배역 소개: 두 사람을 나란히 (명궁 주성 · 오행국 · 한 줄 소개) */
export const CastIntro = ({
  leadA,
  leadB,
}: {
  leadA: CompatibilityLead;
  leadB: CompatibilityLead;
}) => {
  const t = useTranslations("fortune.screen.compatibility.cast");

  return (
    <section className={styles.section}>
      <p className={styles.eyebrow}>CAST</p>
      <h2 className={styles.sectionTitle}>{t("title")}</h2>
      <p className={styles.sectionDesc}>
        {t("desc", { a: leadA.name, b: leadB.name })}
      </p>
      <div className={styles.castGrid}>
        {[leadA, leadB].map((lead) => (
          <article
            key={lead.side}
            className={`${styles.castCard} ${sideClass(lead.side)}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- 주성 그림(정적 PNG) */}
            <img
              src={getStarImagePath(lead.starKey ?? "")}
              alt=""
              width={120}
              height={66}
              className={styles.castArt}
            />
            <span className={styles.castStar}>
              {lead.leadStar} · {lead.wuxingJu}
            </span>
            <b className={styles.castName}>{lead.name}</b>
            {lead.summary && (
              <span className={styles.castSummary}>{lead.summary}</span>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

interface CastingNotesProps {
  zodiac: CompatibilityInsightItem;
  fiveElement: CompatibilityInsightItem;
  chemistry: CompatibilityInsightItem;
}

/** 캐스팅 노트: 띠 · 오행 · 케미 키워드 */
export const CastingNotes = ({
  zodiac,
  fiveElement,
  chemistry,
}: CastingNotesProps) => {
  const t = useTranslations("fortune.screen.compatibility.notes");
  const rows = [
    { code: "ZODIAC", key: "zodiac", item: zodiac },
    { code: "ELEMENT", key: "fiveElement", item: fiveElement },
    { code: "CHEMISTRY", key: "chemistry", item: chemistry },
  ].filter(({ item }) => item?.label);

  if (rows.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      <p className={styles.eyebrow}>CASTING NOTE</p>
      <h2 className={styles.sectionTitle}>{t("title")}</h2>
      <p className={styles.sectionDesc}>{t("desc")}</p>
      <dl className={styles.castingNotes}>
        {rows.map(({ code, key, item }) => (
          <div key={key}>
            <dt>
              <span>{code}</span>
              {t(`labels.${key}`)}
            </dt>
            <dd>
              <b>{item.label}</b>
              {item.headline && <span>{item.headline}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

interface ChartPairProps {
  leadA: CompatibilityLead;
  leadB: CompatibilityLead;
  desc: string;
  interactive?: boolean;
}

/** 원작 · 두 사람의 명반: 탭으로 번갈아 (다른 운세와 같은 명반 스타일) */
export const ChartPair = ({
  leadA,
  leadB,
  desc,
  interactive = true,
}: ChartPairProps) => {
  const t = useTranslations("fortune.screen.compatibility.chart");
  const [side, setSide] = useState<CompatibilityLead["side"]>("a");
  const leads = [leadA, leadB].filter((lead) => lead.chart);
  const active = leads.find((lead) => lead.side === side) ?? leads[0];

  if (!active?.chart) {
    return null;
  }

  return (
    <section className={styles.section}>
      <p className={styles.eyebrow}>ORIGINAL</p>
      <h2 className={styles.sectionTitle}>{t("title")}</h2>
      <p className={styles.sectionDesc}>{desc}</p>
      {leads.length > 1 && (
        <div
          className={styles.chartTabs}
          role="tablist"
          aria-label={t("tabsAria")}
        >
          {leads.map((lead) => (
            <button
              key={lead.side}
              type="button"
              role="tab"
              id={`chart-tab-${lead.side}`}
              aria-selected={lead.side === active.side}
              aria-controls="chart-pair-panel"
              className={`${styles.chartTab} ${sideClass(lead.side)}`}
              onClick={() => setSide(lead.side)}
            >
              {t("tab", { name: lead.name })}
            </button>
          ))}
        </div>
      )}
      <div
        id="chart-pair-panel"
        role="tabpanel"
        aria-labelledby={`chart-tab-${active.side}`}
      >
        <ChartConstellation
          key={active.side}
          chart={active.chart}
          profileName={active.name}
          wuxingJu={active.wuxingJu}
          stars={active.stars}
          interactive={interactive}
        />
      </div>
    </section>
  );
};

/** ACT 2 · 두 사람의 장면 한 컷 (coreScenarios 하나) */
export const DuoScene = ({
  index,
  names,
  scenario,
  oneLinerLabel,
}: {
  index: number;
  names: string;
  scenario: CompatibilityScenario;
  oneLinerLabel: string;
}) => (
  <article className={styles.duoScene}>
    <div className={styles.duoSceneStill}>
      <span className={styles.cutNo}>
        SCENE {String(index + 1).padStart(2, "0")} · {names}
      </span>
      <h3 className={styles.cutHeading}>
        <span>{scenario.title}</span>
      </h3>
    </div>
    <div className={styles.duoSceneBody}>
      {scenario.subSections && scenario.subSections.length > 0 ? (
        <NumberedSections items={scenario.subSections} />
      ) : (
        scenario.content && (
          <MarkdownContent className={styles.prose}>
            {scenario.content}
          </MarkdownContent>
        )
      )}
      {scenario.oneLiner && (
        <SubtitleStill label={oneLinerLabel} text={scenario.oneLiner} />
      )}
    </div>
  </article>
);
