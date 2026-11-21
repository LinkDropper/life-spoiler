"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { useReferral } from "@/libs/hooks/useReferral";

import { HeaderClient } from "@/components/landing";
import { Loading } from "@/components/loading";
import {
  ZiweiChartGrid,
  SectionHeader,
  ErrorState,
  ScenarioItem,
  ScenarioList,
  MarkdownContent,
  SubSectionList,
  OneLinerAlert,
  ChevronIcon,
} from "@/components/fortune";
import { CompatibilityProfileCard } from "@/components/fortune/CompatibilityProfileCard";
import { CompatibilityCard } from "@/components/compatibility";
import { useCompatibilityShare } from "@/libs/hooks/compatibility";

import styles from "../result/page.module.css";

// ============================================================
// 인사이트 아이콘 매핑
// ============================================================

const INSIGHT_ITEMS = [
  { key: "overall", icon: "/images/compatibility/stars-filled.svg" },
  { key: "zodiac", icon: "/images/compatibility/paw-filled.svg" },
  { key: "fiveElement", icon: "/images/compatibility/pentagon-filled.svg" },
  { key: "chemistry", icon: "/images/compatibility/puzzle-filled.svg" },
  {
    key: "communication",
    icon: "/images/compatibility/message-circle-filled.svg",
  },
  {
    key: "growthSynergy",
    icon: "/images/compatibility/arrow-big-up-filled.svg",
  },
  { key: "trustIndex", icon: "/images/compatibility/heart-filled.svg" },
  {
    key: "crisisResilience",
    icon: "/images/compatibility/shield-filled.svg",
  },
] as const;

const KEYWORD_INSIGHT_KEYS: ReadonlySet<string> = new Set([
  "zodiac",
  "fiveElement",
  "chemistry",
]);

type CompatibilityCategoryKey =
  | "communication"
  | "growth"
  | "emotion"
  | "crisis";

const CATEGORY_KEYS: CompatibilityCategoryKey[] = [
  "communication",
  "growth",
  "emotion",
  "crisis",
];

// ============================================================
// 페이지 컴포넌트
// ============================================================

export default function CompatibilitySharePage() {
  const searchParams = useSearchParams();
  const { saveReferrer } = useReferral();
  const tCard = useTranslations("compatibility.card");
  const tFortune = useTranslations("compatibility.fortune");
  const tResult = useTranslations("compatibility.fortune.result");
  const tCommon = useTranslations("fortune.common");

  // ref 파라미터 캡처
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      saveReferrer(ref);
    }
  }, [searchParams, saveReferrer]);

  const { isLoading, error, result, relationshipType, handleCheckMyFortune } =
    useCompatibilityShare();

  const [chartAExpanded, setChartAExpanded] = useState(true);
  const [chartBExpanded, setChartBExpanded] = useState(true);
  const [insightsExpanded, setInsightsExpanded] = useState(true);
  const [spoilerExpanded, setSpoilerExpanded] = useState(true);
  const [coreExpanded, setCoreExpanded] = useState(true);
  const [detailExpanded, setDetailExpanded] = useState(true);
  const [adviceExpanded, setAdviceExpanded] = useState(true);

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

  if (!result) {
    return null;
  }

  const { interpretation, charts, subScores } = result;
  const nameA = charts.profileA.name;
  const nameB = charts.profileB.name;
  const oneLinerLabel = tCommon("oneLinerLabel", { default: "한 줄 정리" });

  const scoreBadgeText = `${tFortune("score")} ${result.score}${tCard("scoreUnit")}`;
  const profileCardLabels = {
    communication: tFortune("insights.communication"),
    growthSynergy: tFortune("insights.growthSynergy"),
    trustIndex: tFortune("insights.trustIndex"),
    crisisResilience: tFortune("insights.crisisResilience"),
  };

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={styles.main}>
        {/* 섹션 1: 프로필 요약 카드 */}
        <CompatibilityCard
          nameA={nameA}
          nameB={nameB}
          score={result.score}
          relationshipType={relationshipType ?? undefined}
        />

        {/* 섹션 2: 메인 결과 카드 (공유 아이콘 없음) */}
        <CompatibilityProfileCard
          score={result.score}
          scoreBadgeText={scoreBadgeText}
          headline={interpretation.headline}
          tags={interpretation.tags}
          subScores={subScores}
          labels={profileCardLabels}
          isImage={false}
        />

        {/* 섹션 3: A의 자미두수 명반 */}
        <SectionHeader
          title={tFortune("chartTitle", { name: nameA })}
          expanded={chartAExpanded}
          onToggle={() => setChartAExpanded(!chartAExpanded)}
        />
        {chartAExpanded && charts.profileA.rawChart && (
          <section className={styles.chartSection}>
            <ZiweiChartGrid
              chart={charts.profileA.rawChart}
              profileName={nameA}
              wuxingJu={charts.profileA.chart.wuxingJu}
              interactive={false}
            />
          </section>
        )}

        {/* 섹션 4: B의 자미두수 명반 */}
        <SectionHeader
          title={tFortune("chartTitle", { name: nameB })}
          expanded={chartBExpanded}
          onToggle={() => setChartBExpanded(!chartBExpanded)}
        />
        {chartBExpanded && charts.profileB.rawChart && (
          <section className={styles.chartSection}>
            <ZiweiChartGrid
              chart={charts.profileB.rawChart}
              profileName={nameB}
              wuxingJu={charts.profileB.chart.wuxingJu}
              interactive={false}
            />
          </section>
        )}

        {/* 섹션 5: 궁합 인사이트 (8개 전체 노출) */}
        <SectionHeader
          title={tFortune("insightsTitle")}
          expanded={insightsExpanded}
          onToggle={() => setInsightsExpanded(!insightsExpanded)}
        />
        {insightsExpanded && (
          <section className={styles.insightsContainer}>
            <div className={styles.insightsList}>
              {INSIGHT_ITEMS.map((item) => {
                const insight = interpretation.insights[item.key];
                const insightLabel = tFortune(`insights.${item.key}`);
                const value = KEYWORD_INSIGHT_KEYS.has(item.key)
                  ? insight.label || "???"
                  : tFortune("scoreUnit", { score: insight.score });
                return (
                  <div key={item.key} className={styles.insightItem}>
                    <Image
                      src={item.icon}
                      alt={insightLabel}
                      width={20}
                      height={20}
                      className={styles.insightIcon}
                    />
                    <span className={styles.insightLabel}>{insightLabel}</span>
                    <hr className={styles.insightDivider} />
                    <span className={styles.insightValue}>{value}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 섹션 6: 궁합 스포일러 */}
        <SectionHeader
          title={tFortune("spoilerTitle")}
          expanded={spoilerExpanded}
          onToggle={() => setSpoilerExpanded(!spoilerExpanded)}
        />
        {spoilerExpanded && (
          <section className={styles.spoilerContent}>
            <h2 className={styles.spoilerHeadline}>
              {interpretation.headline}
            </h2>
            {interpretation.overviewSubSections &&
            interpretation.overviewSubSections.length > 0 ? (
              <>
                <SubSectionList items={interpretation.overviewSubSections} />
                {interpretation.overviewOneLiner && (
                  <OneLinerAlert
                    text={interpretation.overviewOneLiner}
                    label={oneLinerLabel}
                  />
                )}
              </>
            ) : (
              interpretation.spoiler && (
                <MarkdownContent className={styles.spoilerText}>
                  {interpretation.spoiler}
                </MarkdownContent>
              )
            )}
          </section>
        )}

        {/* 섹션 7: 핵심 시나리오 */}
        <SectionHeader
          title={tResult("coreScenarioTitle")}
          expanded={coreExpanded}
          onToggle={() => setCoreExpanded(!coreExpanded)}
        />
        {coreExpanded && interpretation.coreScenarios.length > 0 && (
          <section className={styles.section}>
            <ScenarioList>
              {interpretation.coreScenarios.map((scenario, idx) => (
                <ScenarioItem
                  key={idx}
                  label={`${idx + 1}`}
                  headline={scenario.title}
                  content={scenario.content}
                  subSections={scenario.subSections}
                  oneLiner={scenario.oneLiner}
                  oneLinerLabel={oneLinerLabel}
                />
              ))}
            </ScenarioList>
          </section>
        )}

        {/* 섹션 8: 상세 시나리오 */}
        <SectionHeader
          title={tResult("detailScenarioTitle")}
          expanded={detailExpanded}
          onToggle={() => setDetailExpanded(!detailExpanded)}
        />
        {detailExpanded && (
          <section className={styles.section}>
            <div className={styles.categoriesContainer}>
              {CATEGORY_KEYS.map((key) => {
                const category = interpretation.categories[key];
                return (
                  <CompatibilityCategoryItem
                    key={key}
                    label={tResult(`categories.${key}`)}
                    headline={category.headline}
                    content={category.content}
                    subSections={category.subSections}
                    oneLiner={category.oneLiner}
                    oneLinerLabel={oneLinerLabel}
                    tags={category.tags}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* 섹션 9: 종합 조언 */}
        <SectionHeader
          title={tResult("adviceTitle")}
          expanded={adviceExpanded}
          onToggle={() => setAdviceExpanded(!adviceExpanded)}
        />
        {adviceExpanded && (
          <section className={styles.section}>
            {interpretation.adviceSubSections &&
            interpretation.adviceSubSections.length > 0 ? (
              <>
                <SubSectionList items={interpretation.adviceSubSections} />
                {interpretation.adviceOneLiner && (
                  <OneLinerAlert
                    text={interpretation.adviceOneLiner}
                    label={oneLinerLabel}
                  />
                )}
              </>
            ) : (
              interpretation.advice && (
                <MarkdownContent className={styles.adviceContent}>
                  {interpretation.advice}
                </MarkdownContent>
              )
            )}
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
          {tCommon("checkMyFortune", { default: "내 궁합도 확인해보기" })}
        </button>
      </footer>
    </div>
  );
}

// ============================================================
// 궁합 카테고리 아이템 (인라인 컴포넌트)
// ============================================================

interface CompatibilityCategoryItemProps {
  label: string;
  headline: string;
  content?: string;
  subSections?: { heading: string; body: string }[];
  oneLiner?: string;
  oneLinerLabel?: string;
  tags: string[];
}

const CompatibilityCategoryItem = ({
  label,
  headline,
  content,
  subSections,
  oneLiner,
  oneLinerLabel,
  tags,
}: CompatibilityCategoryItemProps) => {
  const [expanded, setExpanded] = useState(true);
  const hasStructured = !!subSections && subSections.length > 0;

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: 0,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: 0.5,
          }}
        >
          {label}
        </span>
        <ChevronIcon expanded={expanded} size="small" />
      </button>
      {expanded && (
        <>
          {headline && (
            <h4
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "#ffffff",
                margin: "16px 0 0 0",
                lineHeight: 1.4,
                letterSpacing: 0.5,
              }}
            >
              {headline}
            </h4>
          )}
          {hasStructured ? (
            <div style={{ marginTop: 16 }}>
              <SubSectionList items={subSections!} />
            </div>
          ) : (
            content && (
              <MarkdownContent
                style={{
                  fontSize: 18,
                  fontWeight: 400,
                  lineHeight: 1.6,
                  color: "rgba(255, 255, 255, 0.7)",
                  margin: "16px 0 0 0",
                  letterSpacing: 0.5,
                }}
              >
                {content}
              </MarkdownContent>
            )
          )}
          {oneLiner && (
            <div style={{ marginTop: 16 }}>
              <OneLinerAlert text={oneLiner} label={oneLinerLabel} />
            </div>
          )}
          {tags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 16,
              }}
            >
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2px 6px",
                    background: "rgba(255, 255, 255, 0.08)",
                    borderRadius: 4,
                    fontSize: 16,
                    fontWeight: 400,
                    color: "rgba(255, 255, 255, 0.7)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
