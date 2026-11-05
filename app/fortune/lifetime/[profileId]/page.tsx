"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

import { HeaderClient } from "@/components/landing";
import { Loading } from "@/components/loading";
import {
  MarkdownContent,
  CopyToast,
  ErrorState,
  ShareDrawer,
  type CategoryKey,
} from "@/components/fortune";
import { type InstagramStoryCardLabels } from "@/components/fortune/InstagramStoryCard";
import LifetimeProfileCard from "@/components/fortune/LifetimeProfileCard";
import NewProfileCard from "@/components/fortune/NewProfileCard";
import { ReviewDrawer } from "@/components/fortune/ReviewDrawer";
import { FollowUpEntry } from "@/components/fortune/FollowUpEntry";
import { ActIntertitle } from "@/components/fortune/screen/ActIntertitle";
import { AgeLens, toAgeSceneId } from "@/components/fortune/screen/AgeLens";
import { CategoryStory } from "@/components/fortune/screen/CategoryStory";
import { ChartConstellation } from "@/components/fortune/screen/ChartConstellation";
import { EndCredits } from "@/components/fortune/screen/EndCredits";
import { FilmPoster } from "@/components/fortune/screen/FilmPoster";
import { NextShow } from "@/components/fortune/screen/NextShow";
import { NumberedSections } from "@/components/fortune/screen/NumberedSections";
import { RatingBoard } from "@/components/fortune/screen/RatingBoard";
import type { RatingItem } from "@/components/fortune/screen/RatingBoard";
import { ScreenPlayer } from "@/components/fortune/screen/ScreenPlayer";
import type { PlayerScene } from "@/components/fortune/screen/ScreenPlayer";
import { SubtitleStill } from "@/components/fortune/screen/SubtitleStill";
import screen from "@/components/fortune/screen/screen.module.css";
import type { FortuneSceneId } from "@/libs/analytics/fortune";
import { buildAgeLens } from "@/libs/fortune/lifetime-screen";
import { useScreenCast } from "@/libs/fortune/use-screen-cast";
import { getFilmAge } from "@/libs/home/home-film";
import { YEARLY_AFTER_LIFETIME_PER_100 } from "@/libs/home/home-profile";
import { useLifetimeFortune } from "@/libs/hooks/fortune";
import type {
  FortuneInterpretation,
  ProfileTraitsResponse,
} from "@/libs/services/ai/types";
import { useImageDownload } from "@/libs/hooks/useImageDownload";
import { shareToKakao, shareToKakaoWithImage } from "@/libs/kakao";
import { useUser } from "@/libs/stores/user";
import { extractKeywordsFromChart } from "@/libs/zi-wei-dou-shu/calculators";
import type { Locale } from "@/i18n/config";

import styles from "./page.module.css";

const CATEGORY_KEYS: CategoryKey[] = [
  "wealth",
  "career",
  "relationship",
  "health",
];

const ACT_IDS = ["act1", "act2", "act3", "act4"] as const;

const EXTRA_SCENE_IDS: FortuneSceneId[] = ["next", "end"];

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
  const tScreen = useTranslations("fortune.screen");
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

  const cast = useScreenCast(result?.rawChart ?? null);

  const scenes = useMemo<PlayerScene[]>(
    () =>
      ACT_IDS.map((id, index) => ({
        id,
        act: `ACT ${index + 1}`,
        title: tScreen(`acts.${id}.title`),
        sub: tScreen(`acts.${id}.sub`),
      })),
    [tScreen]
  );

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
  const { lifeSpoiler, coreScenario, categories, ageScenarios } =
    interpretation;
  const age = getFilmAge(profile.birth_date);
  const currentYear = new Date().getFullYear();
  const ageLens =
    ageScenarios.length > 0
      ? buildAgeLens(
          ageScenarios.map((scenario) => scenario.period),
          age
        )
      : null;

  // 명궁의 주성 이름 목록 (원본 - 이미지 경로용)
  const mingGongPalace = rawChart.palaces.find((p) => p.name === "명궁");
  const mainStarNames = mingGongPalace?.mainStars.map((s) => s.name) || [];

  // 인스타 스토리용 점수
  const storyScores = {
    wealth: categories.wealth.score ?? 0,
    career: categories.career.score ?? 0,
    relationship: categories.relationship.score ?? 0,
    health: categories.health.score ?? 0,
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

  const ratingItems: RatingItem[] = CATEGORY_KEYS.map((key) => ({
    key,
    label: t(`categories.${key}`),
    score: storyScores[key],
    review: categories[key].headline,
  }));

  // 한 줄 정리 라벨 (i18n)
  const oneLinerLabel = tCommon("oneLinerLabel", { default: "한 줄 정리" });

  const renderActIntertitle = (id: (typeof ACT_IDS)[number]) => (
    <ActIntertitle
      id={id}
      act={`ACT ${ACT_IDS.indexOf(id) + 1}`}
      title={tScreen(`acts.${id}.title`)}
      sub={tScreen(`acts.${id}.sub`)}
    />
  );

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={`${screen.root} ${styles.main}`}>
        <div className={styles.bleed}>
          <FilmPoster
            variant="feature"
            title={lifeSpoiler.headline}
            tagline={lifeSpoiler.oneLiner}
            name={profile.name}
            leadStar={cast.leadStar}
            wuxingJu={result.chart.wuxingJu}
            stars={cast.stars}
            starLabels={cast.starLabels}
          />
        </div>

        <ScreenPlayer
          scenes={scenes}
          age={age}
          nowTargetId={ageLens ? toAgeSceneId(ageLens.nowIndex) : undefined}
          extraSceneIds={EXTRA_SCENE_IDS}
          surface="owner"
        />

        <section className={screen.section}>
          <p className={screen.eyebrow}>CAST</p>
          <h2 className={screen.sectionTitle}>{tScreen("character.title")}</h2>
          {hasProfileTraits(interpretation) ? (
            <NewProfileCard
              mainStars={mainStarNames}
              headline={lifeSpoiler.headline}
              profileTraits={interpretation.profileTraits}
              isImage={false}
              onShareClick={() => setIsProfileShareDrawerOpen(true)}
            />
          ) : (
            <LifetimeProfileCard
              mainStars={mainStarNames}
              headline={lifeSpoiler.headline}
              description={lifeSpoiler.description}
              scores={storyScores}
              labels={storyLabels}
              isImage={false}
              onShareClick={() => setIsProfileShareDrawerOpen(true)}
            />
          )}
        </section>

        <section className={screen.section}>
          <p className={screen.eyebrow}>ORIGINAL</p>
          <h2 className={screen.sectionTitle}>{tScreen("chart.title")}</h2>
          <p className={screen.sectionDesc}>{tScreen("chart.featureDesc")}</p>
          <ChartConstellation
            chart={rawChart}
            profileName={profile.name}
            wuxingJu={result.chart.wuxingJu}
            stars={cast.stars}
          />
          {keywords.length > 0 && (
            <ul className={screen.keywords}>
              {keywords.map((keyword, index) => (
                <li key={`${keyword}-${index}`} className={screen.keyword}>
                  #{keyword}
                </li>
              ))}
            </ul>
          )}
        </section>

        {renderActIntertitle("act1")}
        <section className={screen.section}>
          <p className={screen.lead}>{lifeSpoiler.headline}</p>
          {lifeSpoiler.subSections && lifeSpoiler.subSections.length > 0 ? (
            <NumberedSections items={lifeSpoiler.subSections} />
          ) : (
            lifeSpoiler.summary && (
              <MarkdownContent className={screen.prose}>
                {lifeSpoiler.summary}
              </MarkdownContent>
            )
          )}
          {lifeSpoiler.oneLiner && (
            <SubtitleStill label={oneLinerLabel} text={lifeSpoiler.oneLiner} />
          )}
        </section>

        {renderActIntertitle("act2")}
        <section className={screen.section}>
          {coreScenario.headline && (
            <p className={screen.lead}>{coreScenario.headline}</p>
          )}
          {coreScenario.subSections && coreScenario.subSections.length > 0 ? (
            <NumberedSections items={coreScenario.subSections} />
          ) : (
            coreScenario.content && (
              <MarkdownContent className={screen.prose}>
                {coreScenario.content}
              </MarkdownContent>
            )
          )}
          {coreScenario.oneLiner && (
            <SubtitleStill label={oneLinerLabel} text={coreScenario.oneLiner} />
          )}
        </section>

        {renderActIntertitle("act3")}
        <RatingBoard items={ratingItems} />
        {CATEGORY_KEYS.map((key) => (
          <CategoryStory
            key={key}
            label={t(`categories.${key}`)}
            score={storyScores[key]}
            headline={categories[key].headline}
            content={categories[key].content}
            subSections={categories[key].subSections}
            oneLiner={categories[key].oneLiner}
            tags={categories[key].tags}
          />
        ))}

        {ageScenarios.length > 0 && (
          <>
            {renderActIntertitle("act4")}
            <AgeLens
              scenarios={ageScenarios}
              age={age}
              birthTimeUnknown={profile.birth_time_unknown}
              surface="owner"
            />
          </>
        )}

        <NextShow
          href={`/fortune/yearly/${profileId}`}
          kicker={`TRAILER · ${currentYear}`}
          name={tScreen("next.name")}
          body={tScreen("next.body", {
            count: YEARLY_AFTER_LIFETIME_PER_100,
            year: currentYear,
          })}
          button={tScreen("next.button")}
          fortuneType="lifetime"
          nextType="yearly"
        />

        <EndCredits
          name={profile.name}
          rows={[
            { label: "LEAD STAR", value: cast.leadStar },
            { label: "ORIGINAL", value: result.chart.wuxingJu },
          ]}
        >
          <button
            type="button"
            className={screen.primaryButton}
            onClick={() => setIsShareDrawerOpen(true)}
          >
            {tScreen("credits.share")}
          </button>
          <button
            type="button"
            className={screen.ghostButton}
            onClick={() => setIsReviewDrawerOpen(true)}
          >
            {tScreen("credits.review")}
          </button>
        </EndCredits>
      </main>

      {/* 전문가 질문 플로팅 버튼 + 채팅 드로어 */}
      <FollowUpEntry
        profileId={profileId}
        fortuneType="lifetime"
        fortuneName={tScreen("followUp.name")}
        examplePrompts={tScreen.raw("followUp.prompts") as string[]}
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
