"use client";

import { useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { HeaderClient } from "@/components/landing";
import { Loading } from "@/components/loading";
import {
  ZiweiChartGrid,
  SectionHeader,
  MarkdownContent,
  SubSectionList,
  OneLinerAlert,
} from "@/components/fortune";
import { CompatibilityCard } from "@/components/compatibility";
import { useCompatibilityFortune } from "@/libs/hooks/compatibility";
import {
  useFirstPaymentEligibility,
  toEventPriceText,
} from "@/libs/hooks/payment";

import styles from "./page.module.css";

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
  { key: "crisisResilience", icon: "/images/compatibility/shield-filled.svg" },
] as const;

const PREVIEW_PLACEHOLDER = "???";

const KEYWORD_INSIGHT_KEYS: ReadonlySet<string> = new Set([
  "zodiac",
  "fiveElement",
  "chemistry",
]);

// ============================================================
// 페이지 컴포넌트
// ============================================================

export default function CompatibilityFortunePage() {
  const tFortune = useTranslations("compatibility.fortune");
  const tCommon = useTranslations("fortune.common");

  const {
    isLoading,
    error,
    result,
    isAIGenerated,
    relationshipType,
    handlePayment,
    handleBack,
  } = useCompatibilityFortune();

  const [chartAExpanded, setChartAExpanded] = useState(true);
  const [chartBExpanded, setChartBExpanded] = useState(true);
  const [insightsExpanded, setInsightsExpanded] = useState(true);
  const [spoilerExpanded, setSpoilerExpanded] = useState(true);

  // 첫 결제 100원 자격 시 CTA 금액 표기를 100원으로 (궁합은 pairId 기준)
  const params = useParams();
  const pairId = params.id as string;
  const firstPaymentEligible = useFirstPaymentEligibility(
    pairId,
    "compatibility"
  );

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    const handleRefresh = () => {
      window.location.reload();
    };

    return (
      <div className={styles.page}>
        <HeaderClient />
        <main className={styles.main}>
          <div className={styles.error}>
            <div className={styles.errorIcon}>❌</div>
            <h2 className={styles.errorTitle}>{tFortune("errorTitle")}</h2>
            <p className={styles.errorDescription}>
              {tFortune("errorDescription")}
            </p>
            <div className={styles.errorButtons}>
              <button
                type="button"
                className={styles.refreshButton}
                onClick={handleRefresh}
              >
                {tFortune("refresh")}
              </button>
              <button
                type="button"
                className={styles.errorBackButton}
                onClick={handleBack}
              >
                {tFortune("back")}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const { interpretation, charts } = result;
  const nameA = charts.profileA.name;
  const nameB = charts.profileB.name;

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

        {/* 섹션 2: A의 자미두수 명반 */}
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

        {/* 섹션 3: B의 자미두수 명반 */}
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

        {/* 섹션 4: 궁합 인사이트 */}
        <SectionHeader
          title={tFortune("insightsTitle")}
          expanded={insightsExpanded}
          onToggle={() => setInsightsExpanded(!insightsExpanded)}
        />
        {insightsExpanded && (
          <section className={styles.blurredSection}>
            <div className={styles.insightsContainer}>
              <div className={styles.insightsList}>
                {INSIGHT_ITEMS.map((item, index) => {
                  const insight = interpretation.insights[item.key];
                  const isMasked = index >= 4;
                  const insightLabel = tFortune(`insights.${item.key}`);
                  const value = isMasked
                    ? PREVIEW_PLACEHOLDER
                    : KEYWORD_INSIGHT_KEYS.has(item.key)
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
                      <span className={styles.insightLabel}>
                        {insightLabel}
                      </span>
                      <hr className={styles.insightDivider} />
                      <span className={styles.insightValue}>{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 섹션 5: 궁합 스포일러 */}
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
                    label={tCommon("oneLinerLabel", { default: "한 줄 정리" })}
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
            <p className={styles.spoilerTeaser}>{tFortune("teaser")}</p>
          </section>
        )}
      </main>

      {/* 하단 Footer */}
      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.backButton}
          onClick={handleBack}
          aria-label={tFortune("back")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.5303 5.46967C15.8232 5.76256 15.8232 6.23744 15.5303 6.53033L10.0607 12L15.5303 17.4697C15.8232 17.7626 15.8232 18.2374 15.5303 18.5303C15.2374 18.8232 14.7626 18.8232 14.4697 18.5303L8.46967 12.5303C8.17678 12.2374 8.17678 11.7626 8.46967 11.4697L14.4697 5.46967C14.7626 5.17678 15.2374 5.17678 15.5303 5.46967Z"
              fill="#18181B"
            />
          </svg>
        </button>
        <button
          type="button"
          className={styles.ctaButton}
          onClick={handlePayment}
          disabled={!!error || !isAIGenerated}
        >
          {firstPaymentEligible
            ? toEventPriceText(tFortune("ctaButton"))
            : tFortune("ctaButton")}
        </button>
      </footer>
    </div>
  );
}
