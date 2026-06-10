"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { HeaderClient } from "@/components/landing";
import { Loading } from "@/components/loading";
import {
  ProfileInfo,
  ZiweiChartGrid,
  SectionHeader,
  MarkdownContent,
  SubSectionList,
  OneLinerAlert,
} from "@/components/fortune";
import { usePastLifePreview } from "@/libs/hooks/fortune";

import styles from "./page.module.css";

export default function PastLifePreviewPage() {
  const tCommon = useTranslations("fortune.common");
  const tPreview = useTranslations("fortune.preview");
  const tPastLife = useTranslations("fortune.pastLife");

  const {
    isLoading,
    error,
    result,
    profile,
    isAIGenerated,
    handlePayment,
    handleBack,
  } = usePastLifePreview({
    onProfileNotFound: () => tCommon("profileNotFound"),
    onFetchError: () => tPastLife("interpretError"),
    onUnknownError: () => tCommon("unknownError"),
    onAIGenerationFailed: () => tPastLife("interpretError"),
  });

  const [chartExpanded, setChartExpanded] = useState(true);
  const [spoilerExpanded, setSpoilerExpanded] = useState(true);

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
            <div className={styles.errorIcon}>&#x23F3;</div>
            <h2 className={styles.errorTitle}>{tPastLife("errorTitle")}</h2>
            <p className={styles.errorDescription}>
              {tPastLife("errorDescription")}
            </p>
            <div className={styles.errorButtons}>
              <button
                type="button"
                className={styles.refreshButton}
                onClick={handleRefresh}
              >
                {tPastLife("refresh")}
              </button>
              <button
                type="button"
                className={styles.errorBackButton}
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
          fortuneType="past_life"
          birthDate={profile.birth_date}
          birthTime={profile.birth_time}
          birthTimeUnknown={profile.birth_time_unknown}
          calendarType={profile.calendar_type}
          gender={profile.gender}
        />

        <div style={{ width: "100%", height: 16 }} />

        {/* 히어로 카드: 이미지(블러) + 헤드라인 + 해시태그 + 묘비명 + 능력치 */}
        <section className={styles.heroCard}>
          <div className={styles.heroImageContainer}>
            {interpretation.imageUrl ? (
              <div className={styles.imageBlurWrapper}>
                <Image
                  src={interpretation.imageUrl}
                  alt={interpretation.spoiler.headline}
                  width={480}
                  height={480}
                  className={styles.pastLifeImageBlurred}
                />
                <div className={styles.imageBlurOverlay}>
                  <span className={styles.imageBlurText}>
                    {tPastLife("imageBlurText")}
                  </span>
                </div>
              </div>
            ) : (
              <div className={styles.heroImagePlaceholder}>
                {tPastLife("imagePlaceholder")}
              </div>
            )}
          </div>
          <h2 className={styles.heroHeadline}>
            {interpretation.spoiler.headline}
          </h2>
          <p className={styles.heroDescription}>
            {interpretation.spoiler.description}
          </p>

          {/* 블러 처리된 해시태그 */}
          <div className={styles.blurredInline}>
            <span className={styles.heroHashtagBlurred}>#??? #??? #???</span>
          </div>

          {/* 블러 처리된 능력치 */}
          <div className={styles.blurredInline}>
            <div className={styles.heroStatsBlurred}>
              <div className={styles.statPlaceholder} />
              <div className={styles.statPlaceholder} />
              <div className={styles.statPlaceholder} />
            </div>
          </div>
        </section>

        {/* 명반 차트 */}
        <SectionHeader
          title={tPreview("chartTitle")}
          expanded={chartExpanded}
          onToggle={() => setChartExpanded(!chartExpanded)}
        />

        {chartExpanded && (
          <section className={styles.chartSection}>
            <ZiweiChartGrid
              chart={rawChart}
              profileName={profile.name}
              wuxingJu={result.chart.wuxingJu}
              interactive={false}
            />
          </section>
        )}

        {/* 전생 스포일러 */}
        <SectionHeader
          title={tPastLife("spoilerTitle")}
          expanded={spoilerExpanded}
          onToggle={() => setSpoilerExpanded(!spoilerExpanded)}
        />

        {spoilerExpanded && (
          <section className={styles.spoilerSection}>
            {interpretation.spoiler.subSections &&
            interpretation.spoiler.subSections.length > 0 ? (
              <>
                <SubSectionList items={interpretation.spoiler.subSections} />
                {interpretation.spoiler.oneLiner && (
                  <OneLinerAlert
                    text={interpretation.spoiler.oneLiner}
                    label={tCommon("oneLinerLabel", { default: "한 줄 정리" })}
                  />
                )}
              </>
            ) : (
              interpretation.spoiler.summary && (
                <MarkdownContent className={styles.spoilerSummary}>
                  {interpretation.spoiler.summary}
                </MarkdownContent>
              )
            )}
          </section>
        )}

        {/* 블러 처리된 유료 섹션들 */}
        <div className={styles.blurredSections}>
          <div className={styles.blurredCard}>
            <h3 className={styles.blurredTitle}>{tPastLife("worldTitle")}</h3>
            <p className={styles.blurredText}>
              {tPastLife("blurredPlaceholder")}
            </p>
          </div>
          <div className={styles.blurredCard}>
            <h3 className={styles.blurredTitle}>{tPastLife("birthTitle")}</h3>
            <p className={styles.blurredText}>
              {tPastLife("blurredPlaceholder")}
            </p>
          </div>
          <div className={styles.blurredCard}>
            <h3 className={styles.blurredTitle}>{tPastLife("journeyTitle")}</h3>
            <p className={styles.blurredText}>
              {tPastLife("blurredPlaceholder")}
            </p>
          </div>
          <div className={styles.blurredCard}>
            <h3 className={styles.blurredTitle}>{tPastLife("endTitle")}</h3>
            <p className={styles.blurredText}>
              {tPastLife("blurredPlaceholder")}
            </p>
          </div>
          <div className={styles.blurredCard}>
            <h3 className={styles.blurredTitle}>
              {tPastLife("contrastTitle")}
            </h3>
            <p className={styles.blurredText}>
              {tPastLife("blurredPlaceholder")}
            </p>
          </div>
          <div className={styles.blurredCard}>
            <h3 className={styles.blurredTitle}>
              {tPastLife("connectionsTitle")}
            </h3>
            <p className={styles.blurredText}>
              {tPastLife("blurredPlaceholder")}
            </p>
          </div>
          <div className={styles.blurredCard}>
            <h3 className={styles.blurredTitle}>{tPastLife("tracesTitle")}</h3>
            <p className={styles.blurredText}>
              {tPastLife("blurredPlaceholder")}
            </p>
          </div>
          <div className={styles.blurredCard}>
            <h3 className={styles.blurredTitle}>{tPastLife("lessonsTitle")}</h3>
            <p className={styles.blurredText}>
              {tPastLife("blurredPlaceholder")}
            </p>
          </div>
        </div>

        <p className={styles.previewTeaser}>{tPastLife("previewTeaser")}</p>
      </main>

      {/* 하단 CTA */}
      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.backButton}
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
          {tPastLife("ctaButton")}
        </button>
      </footer>
    </div>
  );
}
