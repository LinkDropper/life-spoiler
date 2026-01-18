"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { HeaderClient } from "@/components/landing";
import { Loading } from "@/components/loading";
import { ProfileInfo, ZiweiChartGrid } from "@/components/fortune";

import type { YearlyFortuneInterpretation } from "@/libs/services/ai";
import type {
  YearlyPalaceInfo,
  YearlyPeachBlossomInfo,
  YearlySihua,
} from "@/libs/zi-wei-dou-shu/calculators";
import type { ZiweiChart } from "@/libs/zi-wei-dou-shu/types";

import styles from "../../[profileId]/page.module.css";

interface ProfileData {
  name: string;
  birth_date: string;
  birth_time: string | null;
  birth_time_unknown: boolean;
  calendar_type: "solar" | "lunar";
  gender: "male" | "female";
}

interface YearlyFortuneResult {
  year: number;
  chart: {
    wuxingJu: string;
    mingGong: string;
  };
  rawChart: ZiweiChart;
  yearlySihua: YearlySihua;
  yearlyPalaces: YearlyPalaceInfo;
  peachBlossom: YearlyPeachBlossomInfo;
  currentDayun: {
    period: string;
    palaceName: string;
    mainStars: string[];
  } | null;
  interpretation: YearlyFortuneInterpretation;
}

type CategoryKey = "wealth" | "career" | "relationship" | "health";

const CategoryItem = ({
  categoryKey,
  category,
  t,
}: {
  categoryKey: CategoryKey;
  category: { content: string; tags: string[] };
  t: ReturnType<typeof useTranslations>;
}) => {
  const [expanded, setExpanded] = useState(true);

  const defaultLabels: Record<CategoryKey, string> = {
    wealth: "재물운",
    career: "직업운",
    relationship: "인연운",
    health: "건강운",
  };

  const label = t(`categories.${categoryKey}`, {
    default: defaultLabels[categoryKey],
  });

  return (
    <div className={styles.categoryCard}>
      <button
        type="button"
        className={styles.categoryHeader}
        onClick={() => setExpanded(!expanded)}
      >
        <span className={styles.categoryLabel}>{label}</span>
        <svg
          className={`${styles.chevronSmall} ${expanded ? styles.expanded : ""}`}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M5 12.5L10 7.5L15 12.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {expanded && (
        <>
          <p className={styles.categoryContent}>{category.content}</p>
          {category.tags && category.tags.length > 0 && (
            <div className={styles.categoryTags}>
              {category.tags.map((tag, idx) => (
                <span key={idx} className={styles.tag}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const MonthlyScenarioItem = ({
  fortune,
  monthUnit,
}: {
  fortune: YearlyFortuneInterpretation["monthlyFortunes"][number];
  monthUnit: string;
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={styles.scenarioItem}>
      <button
        type="button"
        className={styles.scenarioHeader}
        onClick={() => setExpanded(!expanded)}
      >
        <div className={styles.scenarioHeaderLeft}>
          <div className={styles.scenarioMonth}>
            {fortune.month}
            {monthUnit}
          </div>
          <div className={styles.scenarioHeadline}>{fortune.headline}</div>
        </div>
        <svg
          className={`${styles.chevronSmall} ${expanded ? styles.expanded : ""}`}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M5 12.5L10 7.5L15 12.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {expanded && (
        <div className={styles.scenarioContent}>{fortune.content}</div>
      )}
    </div>
  );
};

const MonthlyScenarioList = ({
  monthlyFortunes,
  t,
}: {
  monthlyFortunes: YearlyFortuneInterpretation["monthlyFortunes"];
  t: ReturnType<typeof useTranslations>;
}) => {
  const monthUnit = t("monthly.monthUnit", { default: "월" });

  return (
    <div className={styles.monthlyScenario}>
      <div className={styles.scenarioList}>
        {monthlyFortunes.map((fortune) => (
          <MonthlyScenarioItem
            key={fortune.month}
            fortune={fortune}
            monthUnit={monthUnit}
          />
        ))}
      </div>
    </div>
  );
};

export default function YearlyFortuneSharePage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.profileId as string;
  const t = useTranslations("fortune.yearly");
  const tCommon = useTranslations("fortune.common");
  const tPreview = useTranslations("fortune.preview");

  const currentYear = new Date().getFullYear();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<YearlyFortuneResult | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [chartExpanded, setChartExpanded] = useState(true);
  const [spoilerExpanded, setSpoilerExpanded] = useState(true);
  const [coreExpanded, setCoreExpanded] = useState(true);
  const [detailExpanded, setDetailExpanded] = useState(true);
  const [monthlyExpanded, setMonthlyExpanded] = useState(true);

  useEffect(() => {
    const fetchYearlyFortune = async () => {
      try {
        const response = await fetch(
          `/api/fortune/${profileId}?type=yearly&year=${currentYear}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              tCommon("fortuneNotFound", {
                default: "운세 데이터를 찾을 수 없습니다.",
              })
          );
        }

        const data = await response.json();
        setProfile(data.data.profile);
        setResult(data.data.fortune);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : tCommon("unknownError", {
                default: "알 수 없는 오류가 발생했습니다.",
              })
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchYearlyFortune();
  }, [profileId, currentYear, tCommon]);

  const handleCheckMyFortune = () => {
    router.push("/");
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className={styles.page}>
        <HeaderClient />
        <main className={styles.main}>
          <div className={styles.error}>
            <p>{error}</p>
            <button
              type="button"
              className={styles.backButton}
              onClick={handleCheckMyFortune}
            >
              {tCommon("checkMyFortune", {
                default: "내 운세도 확인해보기",
              })}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!result || !profile) {
    return null;
  }

  const { interpretation, rawChart, yearlySihua } = result;

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={styles.main}>
        {/* 프로필 정보 */}
        <ProfileInfo
          name={profile.name}
          fortuneType="yearly"
          year={currentYear}
          birthDate={profile.birth_date}
          birthTime={profile.birth_time}
          birthTimeUnknown={profile.birth_time_unknown}
          calendarType={profile.calendar_type}
          gender={profile.gender}
        />

        {/* 자미두수 명반 섹션 */}
        <button
          type="button"
          className={styles.sectionHeader}
          onClick={() => setChartExpanded(!chartExpanded)}
        >
          <h3 className={styles.sectionTitle}>
            {tPreview("chartTitle", { default: "자미두수 명반" })}
          </h3>
          <svg
            className={`${styles.chevron} ${chartExpanded ? styles.expanded : ""}`}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M5 12.5L10 7.5L15 12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {chartExpanded && rawChart && (
          <section className={styles.chartSection}>
            <ZiweiChartGrid
              chart={rawChart}
              profileName={profile.name}
              wuxingJu={result.chart.wuxingJu}
              yearlySihua={yearlySihua}
            />
          </section>
        )}

        {/* 올해 스포일러 섹션 */}
        <button
          type="button"
          className={styles.sectionHeader}
          onClick={() => setSpoilerExpanded(!spoilerExpanded)}
        >
          <h3 className={styles.sectionTitle}>
            {tPreview("yearlySpoilerTitle", { default: "올해 스포일러" })}
          </h3>
          <svg
            className={`${styles.chevron} ${spoilerExpanded ? styles.expanded : ""}`}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M5 12.5L10 7.5L15 12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {spoilerExpanded && (
          <section className={styles.overviewSection}>
            <h2 className={styles.overviewHeadline}>
              {interpretation.overview.headline}
            </h2>
            <p className={styles.overviewSummary}>
              {interpretation.overview.summary}
            </p>
          </section>
        )}

        {/* 핵심 시나리오 섹션 */}
        <button
          type="button"
          className={styles.sectionHeader}
          onClick={() => setCoreExpanded(!coreExpanded)}
        >
          <h3 className={styles.sectionTitle}>
            {t("coreScenario.title", { default: "핵심 시나리오" })}
          </h3>
          <svg
            className={`${styles.chevron} ${coreExpanded ? styles.expanded : ""}`}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M5 12.5L10 7.5L15 12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {coreExpanded && (
          <section className={styles.section}>
            <div className={styles.coreScenario}>
              <p>{interpretation.coreScenario.content}</p>
            </div>
          </section>
        )}

        {/* 상세 시나리오 섹션 */}
        <button
          type="button"
          className={styles.sectionHeader}
          onClick={() => setDetailExpanded(!detailExpanded)}
        >
          <h3 className={styles.sectionTitle}>
            {t("detailScenario.title", { default: "상세 시나리오" })}
          </h3>
          <svg
            className={`${styles.chevron} ${detailExpanded ? styles.expanded : ""}`}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M5 12.5L10 7.5L15 12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {detailExpanded && (
          <section className={styles.section}>
            <div className={styles.categoriesContainer}>
              {(["wealth", "career", "relationship", "health"] as const).map(
                (key) => (
                  <CategoryItem
                    key={key}
                    categoryKey={key}
                    category={interpretation.categories[key]}
                    t={t}
                  />
                )
              )}
            </div>
          </section>
        )}

        {/* 월별 시나리오 섹션 */}
        <button
          type="button"
          className={styles.sectionHeader}
          onClick={() => setMonthlyExpanded(!monthlyExpanded)}
        >
          <h3 className={styles.sectionTitle}>
            {t("monthly.detailTitle", { default: "월별 시나리오" })}
          </h3>
          <svg
            className={`${styles.chevron} ${monthlyExpanded ? styles.expanded : ""}`}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M5 12.5L10 7.5L15 12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {monthlyExpanded && (
          <section className={styles.section}>
            <MonthlyScenarioList
              monthlyFortunes={interpretation.monthlyFortunes}
              t={t}
            />
          </section>
        )}
      </main>

      {/* 하단 CTA 버튼 */}
      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.shareButton}
          onClick={handleCheckMyFortune}
        >
          {tCommon("checkMyFortune", { default: "내 운세도 확인해보기" })}
        </button>
      </footer>
    </div>
  );
}
