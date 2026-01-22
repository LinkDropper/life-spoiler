"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { HeaderClient } from "@/components/landing";
import { Loading } from "@/components/loading";
import {
  ProfileInfo,
  ZiweiChartGrid,
  SectionHeader,
} from "@/components/fortune";
import { useLifetimePreview } from "@/libs/hooks/fortune";

import styles from "./page.module.css";

export default function LifetimeFortunePreviewPage() {
  const tCommon = useTranslations("fortune.common");
  const tPreview = useTranslations("fortune.preview");
  const tLifetime = useTranslations("fortune.lifetime");

  const { isLoading, error, result, profile, handlePayment, handleBack } =
    useLifetimePreview({
      onProfileNotFound: () => tCommon("profileNotFound"),
      onFetchError: () => tLifetime("interpretError"),
      onUnknownError: () => tCommon("unknownError"),
    });

  const [chartExpanded, setChartExpanded] = useState(true);
  const [spoilerExpanded, setSpoilerExpanded] = useState(true);

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
              onClick={handleBack}
            >
              {tCommon("backToProfiles")}
            </button>
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
          disabled={!!error}
        >
          {tPreview("ctaButton")}
        </button>
      </footer>
    </div>
  );
}
