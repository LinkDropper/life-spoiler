"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

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
  ShareDrawer,
  YearlyInsightsCard,
  type CategoryKey,
} from "@/components/fortune";
import { type InstagramStoryCardLabels } from "@/components/fortune/InstagramStoryCard";
import YealryProfileCard from "@/components/fortune/YealryProfileCard";
import EventSection from "@/components/landing/EventSection";
import { useYearlyFortune } from "@/libs/hooks/fortune";
import { useImageDownload } from "@/libs/hooks/useImageDownload";
import { shareToKakao, shareToKakaoWithImage, shareToLine } from "@/libs/kakao";
import { calculateYearlyInsights } from "@/libs/zi-wei-dou-shu/calculators";
import type { Locale } from "@/i18n/config";

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
  const locale = useLocale() as Locale;
  const t = useTranslations("fortune.yearly");
  const tCommon = useTranslations("fortune.common");
  const tPreview = useTranslations("fortune.preview");
  const tStory = useTranslations("fortune.instagramStory");

  const {
    isLoading,
    error,
    result,
    profile,
    profileId,
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
  const [insightsExpanded, setInsightsExpanded] = useState(true);
  const [spoilerExpanded, setSpoilerExpanded] = useState(true);
  const [coreExpanded, setCoreExpanded] = useState(true);
  const [detailExpanded, setDetailExpanded] = useState(true);
  const [monthlyExpanded, setMonthlyExpanded] = useState(true);

  // 공유 드로어 상태
  const [isShareDrawerOpen, setIsShareDrawerOpen] = useState(false);
  // 프로필 이미지 공유 드로어 상태
  const [isProfileShareDrawerOpen, setIsProfileShareDrawerOpen] =
    useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 프로필 카드 이미지 훅 (프로필 공유용 - YealryProfileCard)
  const {
    ref: profileCardRef,
    download: downloadProfileImage,
    toBlob: profileCardToBlob,
    isDownloading,
  } = useImageDownload({
    filename: `life_spoiler_${currentYear}_profile`,
    pixelRatio: 2,
  });

  // cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 프로필 이미지 공유 드로어용 다운로드 핸들러
  const handleProfileDownloadImage = useCallback(async () => {
    setShowProfileCard(true);
    // React 렌더링이 완료될 시간을 확보 (requestAnimationFrame보다 안정적)
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      await downloadProfileImage();
    } finally {
      // 이미지 다운로드 완료 후 UI 정리를 위한 딜레이
      timeoutRef.current = setTimeout(() => {
        setShowProfileCard(false);
        setIsProfileShareDrawerOpen(false);
      }, 500);
    }
  }, [downloadProfileImage]);

  // 카카오톡 공유 핸들러
  const handleShareKakao = useCallback(() => {
    if (!result || !profile) return;

    const shareUrl = `${window.location.origin}/fortune/yearly/share/${profileId}`;
    const { interpretation } = result;

    shareToKakao({
      title: interpretation.overview.headline,
      description: interpretation.overview.description,
      name: profile.name,
      webDomain: shareUrl,
    });

    setIsShareDrawerOpen(false);
  }, [result, profile, profileId]);

  // LINE 공유 핸들러
  const handleShareLine = useCallback(() => {
    if (!result || !profile) return;

    const shareUrl = `${window.location.origin}/fortune/yearly/share/${profileId}`;
    const { interpretation } = result;
    const text = `${interpretation.overview.headline} - ${profile.name}`;

    shareToLine(shareUrl, text);
    setIsShareDrawerOpen(false);
  }, [result, profile, profileId]);

  // 프로필 이미지 공유 - 카카오톡 핸들러
  const handleProfileShareKakao = useCallback(async () => {
    if (!result || !profile) return;

    // 프로필 카드 표시
    setShowProfileCard(true);
    // React 렌더링이 완료될 시간을 확보 (requestAnimationFrame보다 안정적)
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      // 이미지 Blob 생성
      const blob = await profileCardToBlob();
      if (!blob) {
        alert("이미지 생성에 실패했습니다. 다시 시도해주세요.");
        return;
      }

      const shareUrl = `${window.location.origin}/fortune/yearly/share/${profileId}`;

      // 카카오톡 이미지 템플릿으로 공유 (카카오 서버에 이미지 업로드 후 공유)
      await shareToKakaoWithImage({
        imageBlob: blob,
        name: profile.name,
        webDomain: shareUrl,
      });
    } catch (error) {
      console.error("Failed to share to Kakao with image:", error);
      alert("공유에 실패했습니다. 다시 시도해주세요.");
    } finally {
      // 공유 UI가 표시될 시간을 확보하기 위한 딜레이
      timeoutRef.current = setTimeout(() => {
        setShowProfileCard(false);
        setIsProfileShareDrawerOpen(false);
      }, 500);
    }
  }, [result, profile, profileId, profileCardToBlob]);

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
            onButtonClick={() => router.push("/profiles?type=yearly")}
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

  // 행운 키워드 인사이트
  const insights = calculateYearlyInsights(rawChart, currentYear, locale);

  // 명궁의 주성 이름 목록 (원본 - 이미지 경로용)
  const mingGongPalace = rawChart.palaces.find((p) => p.name === "명궁");
  const mainStarNames = mingGongPalace?.mainStars.map((s) => s.name) || [];

  // 인스타 스토리용 점수
  const storyScores = {
    wealth: interpretation.categories.wealth.score ?? 0,
    career: interpretation.categories.career.score ?? 0,
    relationship: interpretation.categories.relationship.score ?? 0,
    health: interpretation.categories.health.score ?? 0,
  };

  // 인스타 스토리용 레이블
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
          fortuneType="yearly"
          year={currentYear}
          birthDate={profile.birth_date}
          birthTime={profile.birth_time}
          birthTimeUnknown={profile.birth_time_unknown}
          calendarType={profile.calendar_type}
          gender={profile.gender}
        />

        <div className={styles.spacer} />

        <YealryProfileCard
          year={currentYear}
          mainStars={mainStarNames}
          headline={interpretation.overview.headline}
          tags={interpretation.overview.tags}
          description={interpretation.overview.description}
          scores={storyScores}
          labels={storyLabels}
          isImage={false}
          onShareClick={() => setIsProfileShareDrawerOpen(true)}
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

        {/* 행운 키워드 섹션 */}
        <SectionHeader
          title={t("luckyKeywordsTitle", { default: "행운 키워드" })}
          expanded={insightsExpanded}
          onToggle={() => setInsightsExpanded(!insightsExpanded)}
        />

        {insightsExpanded && (
          <section className={styles.section}>
            <YearlyInsightsCard insights={insights} />
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

      <EventSection isResultPage />

      {/* 하단 공유하기 버튼 */}
      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.shareButton}
          onClick={() => setIsShareDrawerOpen(true)}
        >
          {t("shareButton", { default: "공유하기" })}
        </button>
      </footer>

      {/* 공유 드로어 */}
      <ShareDrawer
        isOpen={isShareDrawerOpen}
        onClose={() => setIsShareDrawerOpen(false)}
        onCopyLink={handleShare}
        onShareKakao={handleShareKakao}
        onShareLine={handleShareLine}
        showDownloadImage={false}
        isDownloading={isDownloading}
      />

      {/* 프로필 이미지 공유 드로어 */}
      <ShareDrawer
        isOpen={isProfileShareDrawerOpen}
        onClose={() => setIsProfileShareDrawerOpen(false)}
        title={t("profileShareTitle", { default: "프로필 이미지 공유하기" })}
        showCopyLink={false}
        showLine={false}
        onShareKakao={handleProfileShareKakao}
        onDownloadImage={handleProfileDownloadImage}
        isDownloading={isDownloading}
      />

      {/* 이미지 생성용 숨겨진 프로필 카드 (YealryProfileCard) */}
      {showProfileCard && (
        <div
          style={{
            position: "fixed",
            left: -9999,
            top: 0,
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          <YealryProfileCard
            ref={profileCardRef}
            year={currentYear}
            mainStars={mainStarNames}
            headline={interpretation.overview.headline}
            tags={interpretation.overview.tags}
            description={interpretation.overview.description}
            scores={storyScores}
            labels={storyLabels}
            isImage={true}
          />
        </div>
      )}

      {/* 복사 완료 토스트 */}
      {showCopyToast && <CopyToast message={tCommon("copySuccess")} />}
    </div>
  );
}
