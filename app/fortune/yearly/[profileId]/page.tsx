"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { HeaderClient } from "@/components/landing";
import { Loading } from "@/components/loading";
import {
  ProfileInfo,
  ZiweiChartGrid,
  SectionHeader,
  CategoryItem,
  ScenarioItem,
  ScenarioList,
  CopyToast,
  ErrorState,
  type CategoryKey,
} from "@/components/fortune";
import { useYearlyFortune } from "@/libs/hooks/fortune";

import styles from "./page.module.css";

const CATEGORY_KEYS: CategoryKey[] = [
  "wealth",
  "career",
  "relationship",
  "health",
];

const DEFAULT_LABELS: Record<CategoryKey, string> = {
  wealth: "재물운",
  career: "직업운",
  relationship: "인연운",
  health: "건강운",
};

export default function YearlyFortunePage() {
  const router = useRouter();
  const t = useTranslations("fortune.yearly");
  const tCommon = useTranslations("fortune.common");
  const tPreview = useTranslations("fortune.preview");

  const {
    isLoading,
    error,
    result,
    profile,
    currentYear,
    showCopyToast,
    handleShare,
  } = useYearlyFortune({
    onProfileNotFound: () =>
      tCommon("profileNotFound", { default: "프로필을 찾을 수 없습니다." }),
    onFetchError: () =>
      t("fetchError", { default: "올해 운세 조회에 실패했습니다." }),
    onUnknownError: () =>
      tCommon("unknownError", {
        default: "알 수 없는 오류가 발생했습니다.",
      }),
  });

  const [chartExpanded, setChartExpanded] = useState(true);
  const [spoilerExpanded, setSpoilerExpanded] = useState(true);
  const [coreExpanded, setCoreExpanded] = useState(true);
  const [detailExpanded, setDetailExpanded] = useState(true);
  const [monthlyExpanded, setMonthlyExpanded] = useState(true);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className={styles.page}>
        <HeaderClient />
        <main className={styles.main}>
          <ErrorState
            message={error}
            buttonText={tCommon("backToProfiles", {
              default: "프로필 목록으로 돌아가기",
            })}
            onButtonClick={() => router.push("/profiles")}
          />
        </main>
      </div>
    );
  }

  if (!result || !profile) {
    return null;
  }

  const { interpretation, rawChart, yearlySihua } = result;
  const monthUnit = t("monthly.monthUnit", { default: "월" });

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
        <SectionHeader
          title={tPreview("chartTitle", { default: "자미두수 명반" })}
          expanded={chartExpanded}
          onToggle={() => setChartExpanded(!chartExpanded)}
        />

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
        <SectionHeader
          title={tPreview("yearlySpoilerTitle", { default: "올해 스포일러" })}
          expanded={spoilerExpanded}
          onToggle={() => setSpoilerExpanded(!spoilerExpanded)}
        />

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
        <SectionHeader
          title={t("coreScenario.title", { default: "핵심 시나리오" })}
          expanded={coreExpanded}
          onToggle={() => setCoreExpanded(!coreExpanded)}
        />

        {coreExpanded && interpretation.coreScenario.content && (
          <section className={styles.section}>
            <div className={styles.coreScenario}>
              {interpretation.coreScenario.headline && (
                <h3 className={styles.coreHeadline}>
                  {interpretation.coreScenario.headline}
                </h3>
              )}
              <p>{interpretation.coreScenario.content}</p>
            </div>
          </section>
        )}

        {/* 상세 시나리오 섹션 */}
        <SectionHeader
          title={t("detailScenario.title", { default: "상세 시나리오" })}
          expanded={detailExpanded}
          onToggle={() => setDetailExpanded(!detailExpanded)}
        />

        {detailExpanded && (
          <section className={styles.section}>
            <div className={styles.categoriesContainer}>
              {CATEGORY_KEYS.map((key) => (
                <CategoryItem
                  key={key}
                  categoryKey={key}
                  label={t(`categories.${key}`, {
                    default: DEFAULT_LABELS[key],
                  })}
                  headline={interpretation.categories[key].headline}
                  content={interpretation.categories[key].content}
                  tags={interpretation.categories[key].tags}
                  showHashtag={true}
                />
              ))}
            </div>
          </section>
        )}

        {/* 월별 시나리오 섹션 */}
        <SectionHeader
          title={t("monthly.detailTitle", { default: "월별 시나리오" })}
          expanded={monthlyExpanded}
          onToggle={() => setMonthlyExpanded(!monthlyExpanded)}
        />

        {monthlyExpanded && (
          <section className={styles.section}>
            <ScenarioList>
              {interpretation.monthlyFortunes.map((fortune) => (
                <ScenarioItem
                  key={fortune.month}
                  label={`${fortune.month}${monthUnit}`}
                  headline={fortune.headline}
                  content={fortune.content}
                />
              ))}
            </ScenarioList>
          </section>
        )}
      </main>

      {/* 하단 공유하기 버튼 */}
      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.shareButton}
          onClick={handleShare}
        >
          {t("shareButton", { default: "공유하기" })}
        </button>
      </footer>

      {/* 복사 완료 토스트 */}
      {showCopyToast && <CopyToast message={tCommon("copySuccess")} />}
    </div>
  );
}
