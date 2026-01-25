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
  type CategoryKey,
} from "@/components/fortune";
import {
  InstagramStoryCard,
  type InstagramStoryCardLabels,
} from "@/components/fortune/InstagramStoryCard";
import { useLifetimeFortune } from "@/libs/hooks/fortune";
import { useImageDownload } from "@/libs/hooks/useImageDownload";
import { shareToKakao, shareToLine } from "@/libs/kakao";
import { translateMainStar } from "@/libs/zi-wei-dou-shu/i18n";
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

export default function LifetimeFortunePage() {
  const router = useRouter();
  const locale = useLocale() as Locale;
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

  // 공유 드로어 상태
  const [isShareDrawerOpen, setIsShareDrawerOpen] = useState(false);
  const [showStoryCard, setShowStoryCard] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 이미지 다운로드 훅
  const {
    ref: storyCardRef,
    download: downloadStoryImage,
    isDownloading,
  } = useImageDownload({
    filename: "life_spoiler_lifetime",
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

  // 이미지 다운로드 핸들러
  const handleDownloadImage = useCallback(async () => {
    setShowStoryCard(true);
    // requestAnimationFrame으로 DOM 렌더링 완료 대기
    await new Promise((resolve) => requestAnimationFrame(resolve));

    try {
      await downloadStoryImage();
    } finally {
      timeoutRef.current = setTimeout(() => {
        setShowStoryCard(false);
        setIsShareDrawerOpen(false);
      }, 500);
    }
  }, [downloadStoryImage]);

  // 카카오톡 공유 핸들러
  const handleShareKakao = useCallback(() => {
    if (!result || !profile) return;

    const shareUrl = `${window.location.origin}/fortune/lifetime/share/${profileId}`;
    const { interpretation } = result;

    shareToKakao({
      title: interpretation.lifeSpoiler.headline,
      description: interpretation.lifeSpoiler.description,
      name: profile.name,
      webDomain: shareUrl,
    });

    setIsShareDrawerOpen(false);
  }, [result, profile, profileId]);

  // LINE 공유 핸들러
  const handleShareLine = useCallback(() => {
    if (!result || !profile) return;

    const shareUrl = `${window.location.origin}/fortune/lifetime/share/${profileId}`;
    const { interpretation } = result;
    const text = `${interpretation.lifeSpoiler.headline} - ${profile.name}`;

    shareToLine(shareUrl, text);
    setIsShareDrawerOpen(false);
  }, [result, profile, profileId]);

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

  const { interpretation, rawChart } = result;

  // 명궁의 주성 이름 목록 (번역 적용)
  const mingGongPalace = rawChart.palaces.find((p) => p.name === "명궁");
  const mainStarNames =
    mingGongPalace?.mainStars.map((s) => translateMainStar(s.name, locale)) ||
    [];

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
          fortuneType="lifetime"
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
            <p className={styles.overviewSummary}>
              {interpretation.lifeSpoiler.summary}
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
        onDownloadImage={handleDownloadImage}
        isDownloading={isDownloading}
      />

      {/* 이미지 생성용 숨겨진 카드 */}
      {showStoryCard && (
        <div
          style={{
            position: "fixed",
            left: -9999,
            top: 0,
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          <InstagramStoryCard
            ref={storyCardRef}
            type="lifetime"
            mainStars={mainStarNames}
            headline={interpretation.lifeSpoiler.headline}
            description={interpretation.lifeSpoiler.description}
            scores={storyScores}
            labels={storyLabels}
          />
        </div>
      )}

      {/* 복사 완료 토스트 */}
      {showCopyToast && <CopyToast message={tCommon("copySuccess")} />}
    </div>
  );
}
