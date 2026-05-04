"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

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
  CopyToast,
  ErrorState,
  ShareDrawer,
  KeywordGrid,
  EventBadge,
  type CategoryKey,
} from "@/components/fortune";
import { type InstagramStoryCardLabels } from "@/components/fortune/InstagramStoryCard";
import LifetimeProfileCard from "@/components/fortune/LifetimeProfileCard";
import NewProfileCard from "@/components/fortune/NewProfileCard";
import { ReviewDrawer } from "@/components/fortune/ReviewDrawer";
import { FollowUpEntry } from "@/components/fortune/FollowUpEntry";
import EventSection from "@/components/landing/EventSection";
import { useLifetimeFortune } from "@/libs/hooks/fortune";
import type {
  FortuneInterpretation,
  ProfileTraitsResponse,
} from "@/libs/services/ai/types";
import { useImageDownload } from "@/libs/hooks/useImageDownload";
import { shareToKakao, shareToKakaoWithImage } from "@/libs/kakao";
import { useUser } from "@/libs/stores/user";
import {
  extractKeywordsFromChart,
  extractOneLinerFromChart,
} from "@/libs/zi-wei-dou-shu/calculators";
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

export default function LifetimeFortunePage() {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const user = useUser();
  const t = useTranslations("fortune.lifetime");
  const tCommon = useTranslations("fortune.common");
  const tPreview = useTranslations("fortune.preview");
  const tStory = useTranslations("fortune.instagramStory");

  const {
    isLoading,
    error,
    result,
    profile,
    profileId,
    showCopyToast,
    handleShare,
  } = useLifetimeFortune({
    onProfileNotFound: () =>
      tCommon("profileNotFound", { default: "프로필을 찾을 수 없습니다." }),
    onFetchError: () =>
      t("interpretError", { default: "운세 해석에 실패했습니다." }),
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

  // 후기 드로어 상태
  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState(false);
  // 공유 드로어 상태
  const [isShareDrawerOpen, setIsShareDrawerOpen] = useState(false);
  // 프로필 이미지 공유 드로어 상태
  const [isProfileShareDrawerOpen, setIsProfileShareDrawerOpen] =
    useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 프로필 카드 이미지 훅
  const {
    ref: profileCardRef,
    download: downloadProfileImage,
    toBlob: profileCardToBlob,
    isDownloading,
  } = useImageDownload({
    filename: "life_spoiler_lifetime_profile",
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

  // 프로필 이미지 다운로드 핸들러
  const handleProfileDownloadImage = useCallback(async () => {
    setShowProfileCard(true);
    // React 렌더링이 완료될 시간을 확보
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      await downloadProfileImage();
    } finally {
      timeoutRef.current = setTimeout(() => {
        setShowProfileCard(false);
        setIsProfileShareDrawerOpen(false);
      }, 500);
    }
  }, [downloadProfileImage]);

  // 카카오톡 공유 핸들러
  const handleShareKakao = useCallback(() => {
    if (!result || !profile) return;

    const shareUrl = `${window.location.origin}/fortune/lifetime/share/${profileId}?ref=${user?.id ?? ""}`;
    const { interpretation } = result;

    shareToKakao({
      title: interpretation.lifeSpoiler.headline,
      description: interpretation.lifeSpoiler.description,
      name: profile.name,
      webDomain: shareUrl,
    });

    setIsShareDrawerOpen(false);
  }, [result, profile, profileId, user]);

  // 프로필 이미지 공유 - 카카오톡 핸들러
  const handleProfileShareKakao = useCallback(async () => {
    if (!result || !profile) return;

    // 프로필 카드 표시
    setShowProfileCard(true);
    // React 렌더링이 완료될 시간을 확보
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      // 이미지 Blob 생성
      const blob = await profileCardToBlob();
      if (!blob) {
        alert("이미지 생성에 실패했습니다. 다시 시도해주세요.");
        return;
      }

      const shareUrl = `${window.location.origin}/fortune/lifetime/share/${profileId}?ref=${user?.id ?? ""}`;

      // 카카오톡 이미지 템플릿으로 공유
      await shareToKakaoWithImage({
        imageBlob: blob,
        name: profile.name,
        webDomain: shareUrl,
      });
    } catch (error) {
      console.error("Failed to share to Kakao with image:", error);
      alert("공유에 실패했습니다. 다시 시도해주세요.");
    } finally {
      timeoutRef.current = setTimeout(() => {
        setShowProfileCard(false);
        setIsProfileShareDrawerOpen(false);
      }, 500);
    }
  }, [result, profile, profileId, profileCardToBlob, user]);

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
            onButtonClick={() => router.push("/profiles?type=lifetime")}
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

  // 한 줄 정리 alert 라벨 (i18n)
  const oneLinerLabel = tCommon("oneLinerLabel", { default: "한 줄 정리" });

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

        <div style={{ width: "100%", height: 16 }} />

        {hasProfileTraits(interpretation) ? (
          <NewProfileCard
            mainStars={mainStarNames}
            headline={interpretation.lifeSpoiler.headline}
            profileTraits={interpretation.profileTraits}
            isImage={false}
            onShareClick={() => setIsProfileShareDrawerOpen(true)}
          />
        ) : (
          <LifetimeProfileCard
            mainStars={mainStarNames}
            headline={interpretation.lifeSpoiler.headline}
            description={interpretation.lifeSpoiler.description}
            scores={storyScores}
            labels={storyLabels}
            isImage={false}
            onShareClick={() => setIsProfileShareDrawerOpen(true)}
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
            />
          </section>
        )}

        {/* 키워드 그리드 섹션 */}
        {keywords.length > 0 && oneLiner && (
          <section className={styles.keywordGridSection}>
            <KeywordGrid
              keywords={keywords}
              oneLiner={oneLiner}
              name={profile.name}
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

        <EventSection isResultPage />
      </main>

      {/* 하단 버튼 */}
      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.reviewButton}
          onClick={() => setIsReviewDrawerOpen(true)}
        >
          {t("reviewButton", { default: "후기 남기기" })}
        </button>
        <div className={styles.shareButtonWrapper}>
          <EventBadge />
          <button
            type="button"
            className={styles.shareButton}
            onClick={() => setIsShareDrawerOpen(true)}
          >
            {t("shareButton", { default: "공유하기" })}
          </button>
        </div>
      </footer>

      {/* 전문가 질문 플로팅 버튼 + 채팅 드로어 */}
      <FollowUpEntry
        profileId={profileId}
        fortuneType="lifetime"
        fortuneName="평생운세"
        examplePrompts={[
          "내 직업운은 어때?",
          "결혼 적령기는 언제야?",
          "재물운이 궁금해",
        ]}
      />

      {/* 후기 드로어 */}
      <ReviewDrawer
        isOpen={isReviewDrawerOpen}
        onClose={() => setIsReviewDrawerOpen(false)}
        profileId={profileId}
        fortuneType="lifetime"
      />

      {/* 공유 드로어 */}
      <ShareDrawer
        isOpen={isShareDrawerOpen}
        onClose={() => setIsShareDrawerOpen(false)}
        onCopyLink={handleShare}
        onShareKakao={handleShareKakao}
        showLine={false}
        showDownloadImage={false}
        showEventBanner={true}
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

      {/* 이미지 생성용 숨겨진 프로필 카드 */}
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
          {hasProfileTraits(interpretation) ? (
            <NewProfileCard
              ref={profileCardRef}
              mainStars={mainStarNames}
              headline={interpretation.lifeSpoiler.headline}
              profileTraits={interpretation.profileTraits}
              isImage={true}
            />
          ) : (
            <LifetimeProfileCard
              ref={profileCardRef}
              mainStars={mainStarNames}
              headline={interpretation.lifeSpoiler.headline}
              description={interpretation.lifeSpoiler.description}
              scores={storyScores}
              labels={storyLabels}
              isImage={true}
            />
          )}
        </div>
      )}

      {/* 복사 완료 토스트 */}
      {showCopyToast && <CopyToast message={tCommon("copySuccess")} />}
    </div>
  );
}
