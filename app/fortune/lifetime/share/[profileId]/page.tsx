"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { useReferral } from "@/libs/hooks/useReferral";

import { HeaderClient } from "@/components/landing";
import { Loading } from "@/components/loading";
import {
  ProfileInfo,
  ZiweiChartGrid,
  SectionHeader,
  CategoryItem,
  ScenarioItem,
  ScenarioList,
  MarkdownContent,
  SubSectionList,
  OneLinerAlert,
  ErrorState,
  type CategoryKey,
} from "@/components/fortune";
import { type InstagramStoryCardLabels } from "@/components/fortune/InstagramStoryCard";
import LifetimeProfileCard from "@/components/fortune/LifetimeProfileCard";
import NewProfileCard from "@/components/fortune/NewProfileCard";
import { useLifetimeShare } from "@/libs/hooks/fortune";
import type {
  FortuneInterpretation,
  ProfileTraitsResponse,
} from "@/libs/services/ai/types";

import styles from "../../[profileId]/page.module.css";

/**
 * profileTraits 존재 여부 타입 가드
 */
const hasProfileTraits = (
  interpretation: FortuneInterpretation
): interpretation is FortuneInterpretation & {
  profileTraits: ProfileTraitsResponse;
} => {
  return !!interpretation.profileTraits?.spectrums;
};

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

export default function LifetimeFortuneSharePage() {
  const searchParams = useSearchParams();
  const { saveReferrer } = useReferral();
  const t = useTranslations("fortune.lifetime");
  const tCommon = useTranslations("fortune.common");
  const tPreview = useTranslations("fortune.preview");
  const tStory = useTranslations("fortune.instagramStory");

  // ref 파라미터 캡처
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      saveReferrer(ref);
    }
  }, [searchParams, saveReferrer]);

  const { isLoading, error, result, profile, handleCheckMyFortune } =
    useLifetimeShare({
      onFortuneNotFound: () =>
        tCommon("fortuneNotFound", {
          default: "운세 데이터를 찾을 수 없습니다.",
        }),
      onUnknownError: () =>
        tCommon("unknownError", {
          default: "알 수 없는 오류가 발생했습니다.",
        }),
    });

  const [chartExpanded, setChartExpanded] = useState(true);
  const [spoilerExpanded, setSpoilerExpanded] = useState(true);
  const [coreExpanded, setCoreExpanded] = useState(true);
  const [detailExpanded, setDetailExpanded] = useState(true);
  const [ageExpanded, setAgeExpanded] = useState(true);

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
            buttonText={tCommon("checkMyFortune", {
              default: "내 운세도 확인해보기",
            })}
            onButtonClick={handleCheckMyFortune}
          />
        </main>
      </div>
    );
  }

  if (!result || !profile) {
    return null;
  }

  const { interpretation, rawChart } = result;

  // 명궁의 주성 이름 목록 (원본 - 이미지 경로용)
  const mingGongPalace = rawChart.palaces.find((p) => p.name === "명궁");
  const mainStarNames = mingGongPalace?.mainStars.map((s) => s.name) || [];

  // 프로필 카드용 점수
  const storyScores = {
    wealth: interpretation.categories.wealth.score ?? 0,
    career: interpretation.categories.career.score ?? 0,
    relationship: interpretation.categories.relationship.score ?? 0,
    health: interpretation.categories.health.score ?? 0,
  };

  // 한 줄 정리 alert 라벨 (i18n)
  const oneLinerLabel = tCommon("oneLinerLabel", { default: "한 줄 정리" });

  // 프로필 카드용 레이블
  const storyLabels: InstagramStoryCardLabels = {
    mainStar: tStory("mainStar"),
    categories: {
      wealth: tStory("categories.wealth"),
      career: tStory("categories.career"),
      relationship: tStory("categories.relationship"),
      health: tStory("categories.health"),
    },
  };

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={styles.main}>
        {/* 프로필 정보 */}
        <ProfileInfo
          name={profile.name}
          fortuneType="lifetime"
          birthDate={profile.birth_date}
          birthTime={profile.birth_time}
          birthTimeUnknown={profile.birth_time_unknown}
          calendarType={profile.calendar_type}
          gender={profile.gender}
        />

        <div className={styles.spacer} />

        {hasProfileTraits(interpretation) ? (
          <NewProfileCard
            mainStars={mainStarNames}
            headline={interpretation.lifeSpoiler.headline}
            profileTraits={interpretation.profileTraits}
            isImage={false}
            shouldShowShareButton={false}
          />
        ) : (
          <LifetimeProfileCard
            mainStars={mainStarNames}
            headline={interpretation.lifeSpoiler.headline}
            description={interpretation.lifeSpoiler.description}
            scores={storyScores}
            labels={storyLabels}
            isImage={false}
            shouldShowShareButton={false}
          />
        )}

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
              interactive={false}
            />
          </section>
        )}

        {/* 인생 스포일러 섹션 */}
        <SectionHeader
          title={tPreview("spoilerTitle", { default: "인생 스포일러" })}
          expanded={spoilerExpanded}
          onToggle={() => setSpoilerExpanded(!spoilerExpanded)}
        />

        {spoilerExpanded && (
          <section className={styles.overviewSection}>
            <h2 className={styles.overviewHeadline}>
              {interpretation.lifeSpoiler.headline}
            </h2>
            {interpretation.lifeSpoiler.subSections &&
            interpretation.lifeSpoiler.subSections.length > 0 ? (
              <>
                <SubSectionList
                  items={interpretation.lifeSpoiler.subSections}
                />
                {interpretation.lifeSpoiler.oneLiner && (
                  <OneLinerAlert
                    text={interpretation.lifeSpoiler.oneLiner}
                    label={oneLinerLabel}
                  />
                )}
              </>
            ) : (
              interpretation.lifeSpoiler.summary && (
                <MarkdownContent className={styles.overviewSummary}>
                  {interpretation.lifeSpoiler.summary}
                </MarkdownContent>
              )
            )}
          </section>
        )}

        {/* 핵심 시나리오 섹션 */}
        <SectionHeader
          title={t("coreScenario.title", { default: "핵심 시나리오" })}
          expanded={coreExpanded}
          onToggle={() => setCoreExpanded(!coreExpanded)}
        />

        {coreExpanded &&
          (interpretation.coreScenario.subSections?.length ||
            interpretation.coreScenario.content) && (
            <section className={styles.section}>
              <div className={styles.coreScenario}>
                {interpretation.coreScenario.headline && (
                  <h3 className={styles.coreHeadline}>
                    {interpretation.coreScenario.headline}
                  </h3>
                )}
                {interpretation.coreScenario.subSections &&
                interpretation.coreScenario.subSections.length > 0 ? (
                  <>
                    <SubSectionList
                      items={interpretation.coreScenario.subSections}
                    />
                    {interpretation.coreScenario.oneLiner && (
                      <OneLinerAlert
                        text={interpretation.coreScenario.oneLiner}
                        label={oneLinerLabel}
                      />
                    )}
                  </>
                ) : (
                  interpretation.coreScenario.content && (
                    <MarkdownContent>
                      {interpretation.coreScenario.content}
                    </MarkdownContent>
                  )
                )}
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
                  subSections={interpretation.categories[key].subSections}
                  oneLiner={interpretation.categories[key].oneLiner}
                  oneLinerLabel={oneLinerLabel}
                  tags={interpretation.categories[key].tags}
                  showHashtag={false}
                />
              ))}
            </div>
          </section>
        )}

        {/* 나이대별 시나리오 섹션 */}
        <SectionHeader
          title={t("ageScenario.title", { default: "나이대별 시나리오" })}
          expanded={ageExpanded}
          onToggle={() => setAgeExpanded(!ageExpanded)}
        />

        {ageExpanded && interpretation.ageScenarios.length > 0 && (
          <section className={styles.section}>
            <ScenarioList>
              {interpretation.ageScenarios.map((scenario, idx) => (
                <ScenarioItem
                  key={idx}
                  label={scenario.period}
                  headline={scenario.headline}
                  content={scenario.content}
                  bullets={scenario.bullets}
                  oneLiner={scenario.oneLiner}
                  oneLinerLabel={oneLinerLabel}
                />
              ))}
            </ScenarioList>
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
