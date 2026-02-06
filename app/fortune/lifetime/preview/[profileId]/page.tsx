"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";

import { HeaderClient } from "@/components/landing";
import { Loading } from "@/components/loading";
import {
  ProfileInfo,
  ZiweiChartGrid,
  SectionHeader,
  KeywordGrid,
} from "@/components/fortune";
import { useLifetimePreview } from "@/libs/hooks/fortune";
import {
  extractKeywordsFromChart,
  extractOneLinerFromChart,
} from "@/libs/zi-wei-dou-shu/calculators";
import type { Locale } from "@/i18n/config";

import styles from "./page.module.css";

export default function LifetimeFortunePreviewPage() {
  const locale = useLocale() as Locale;
  const tCommon = useTranslations("fortune.common");
  const tPreview = useTranslations("fortune.preview");
  const tLifetime = useTranslations("fortune.lifetime");

  const {
    isLoading,
    error,
    result,
    profile,
    isAIGenerated,
    handlePayment,
    handleBack,
  } = useLifetimePreview({
    onProfileNotFound: () => tCommon("profileNotFound"),
    onFetchError: () => tLifetime("interpretError"),
    onUnknownError: () => tCommon("unknownError"),
    onAIGenerationFailed: () => tLifetime("interpretError"),
  });

  const [chartExpanded, setChartExpanded] = useState(true);
  const [spoilerExpanded, setSpoilerExpanded] = useState(true);

  // 키워드 추출 (12궁 주성 + 밝기 기반, 영향력 점수순)
  const keywords = useMemo(() => {
    if (!result?.rawChart) return [];
    return extractKeywordsFromChart(result.rawChart, locale);
  }, [result?.rawChart, locale]);

  // 한줄 표현 추출 (명궁 대표 주성 기반)
  const oneLiner = useMemo(() => {
    if (!result?.rawChart) return null;
    return extractOneLinerFromChart(result.rawChart, locale);
  }, [result?.rawChart, locale]);

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
            <div className={styles.errorIcon}>⏳</div>
            <h2 className={styles.errorTitle}>
              일시적으로 접속이 원활하지 않아요
            </h2>
            <p className={styles.errorDescription}>
              현재 이용자가 많아 운세 생성에 실패했어요.
              <br />
              잠시 후 다시 시도해 주세요.
            </p>
            <div className={styles.errorButtons}>
              <button
                type="button"
                className={styles.refreshButton}
                onClick={handleRefresh}
              >
                새로고침
              </button>
              <button
                type="button"
                className={styles.backButton}
                onClick={handleBack}
              >
                {tCommon("backToProfiles")}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!result || !profile) {
    return null;
  }

  const { interpretation, rawChart } = result;

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

        {/* 자미두수 명반 섹션 헤더 */}
        <SectionHeader
          title={tPreview("chartTitle")}
          expanded={chartExpanded}
          onToggle={() => setChartExpanded(!chartExpanded)}
        />

        {/* 명반 그리드 */}
        {chartExpanded && (
          <section className={styles.chartSection}>
            <ZiweiChartGrid
              chart={rawChart}
              profileName={profile.name}
              wuxingJu={result.chart.wuxingJu}
            />
          </section>
        )}

        {/* 키워드 그리드 (미리보기 - 3행 블러) */}
        {keywords.length > 0 && oneLiner && (
          <section className={styles.keywordGridSection}>
            <KeywordGrid
              keywords={keywords}
              oneLiner={oneLiner}
              name={profile.name}
              isPreview={true}
            />
          </section>
        )}

        {/* 인생 스포일러 섹션 헤더 */}
        <SectionHeader
          title={tPreview("spoilerTitle")}
          expanded={spoilerExpanded}
          onToggle={() => setSpoilerExpanded(!spoilerExpanded)}
        />

        {/* 미리보기 텍스트 */}
        {spoilerExpanded && (
          <section className={styles.previewContent}>
            <h2 className={styles.previewHeadline}>
              {interpretation.lifeSpoiler.headline}
            </h2>
            <p className={styles.previewDescription}>
              {interpretation.lifeSpoiler.summary}
            </p>
            <p className={styles.previewTeaser}>{tPreview("teaser")}</p>
          </section>
        )}
      </main>

      {/* 하단 CTA */}
      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.shareButton}
          onClick={handleBack}
          aria-label={tCommon("back")}
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
          className={styles.paymentButton}
          onClick={handlePayment}
          disabled={!!error || !isAIGenerated}
        >
          {tPreview("ctaButton")}
        </button>
      </footer>
    </div>
  );
}
