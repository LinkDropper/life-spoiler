"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CopyToast, ErrorState } from "@/components/fortune";
import { FollowUpEntry } from "@/components/fortune/FollowUpEntry";
import { ReviewDrawer } from "@/components/fortune/ReviewDrawer";
import { YearlyCharacterPoster } from "@/components/fortune/YearlyCharacterPoster";
import { EndCredits } from "@/components/fortune/screen/EndCredits";
import { FortuneShareSheet } from "@/components/fortune/screen/FortuneShareSheet";
import { NextShow } from "@/components/fortune/screen/NextShow";
import screen from "@/components/fortune/screen/screen.module.css";
import { HeaderClient } from "@/components/landing";
import { Loading } from "@/components/loading";
import type { FortuneSceneId } from "@/libs/analytics/fortune";
import {
  buildMonthLens,
  formatYearGanji,
  getYearFlow,
  pickNextAfterYearly,
} from "@/libs/fortune/yearly-screen";
import type { YearlyEdition } from "@/libs/fortune/yearly-editions";
import { getFortuneHref } from "@/libs/home/home-profile";
import { useYearlyFortune } from "@/libs/hooks/fortune";
import { useImageDownload } from "@/libs/hooks/useImageDownload";
import { shareToKakao, shareToKakaoWithImage } from "@/libs/kakao";
import { useProfileById } from "@/libs/stores/profile/provider";
import {
  shareImageWithSystem,
  shareLinkWithSystem,
} from "@/libs/share/system-share";
import { useUser } from "@/libs/stores/user";
import { calculateYearlyInsights } from "@/libs/zi-wei-dou-shu/calculators";
import type { Locale } from "@/i18n/config";
import { showToast } from "@/libs/toast";

import { YearlyFeatureBody } from "./YearlyFeatureBody";
import styles from "./YearlyFortuneView.module.css";

const EXTRA_SCENE_IDS: FortuneSceneId[] = ["next", "end"];

interface YearlyFortuneViewProps {
  edition: YearlyEdition;
}

/** 올해·내년 운세 본편 (기획서 §10) */
export const YearlyFortuneView = ({ edition }: YearlyFortuneViewProps) => {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const user = useUser();
  const t = useTranslations("fortune.yearly");
  const tCommon = useTranslations("fortune.common");
  const tScreen = useTranslations("fortune.screen");
  const tY = useTranslations("fortune.screen.yearly");
  const tHome = useTranslations("home");

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
    edition,
    onProfileNotFound: () =>
      tCommon("profileNotFound", { default: "프로필을 찾을 수 없습니다." }),
    onFetchError: () =>
      t("fetchError", { default: "운세 조회에 실패했습니다." }),
    onUnknownError: () =>
      tCommon("unknownError", {
        default: "알 수 없는 오류가 발생했습니다.",
      }),
  });
  // 다음 상영작 고르기용 소장 정보 (프로필 스토어)
  const storedProfile = useProfileById(profileId);

  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState(false);
  const [isShareDrawerOpen, setIsShareDrawerOpen] = useState(false);
  const [isProfileShareDrawerOpen, setIsProfileShareDrawerOpen] =
    useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 캐릭터 포스터 이미지 훅
  const {
    ref: profileCardRef,
    download: downloadProfileImage,
    toBlob: profileCardToBlob,
    isDownloading,
  } = useImageDownload({
    filename: `life_spoiler_${currentYear}_profile`,
    pixelRatio: 2,
  });

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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

  const handleShareKakao = useCallback(() => {
    if (!result || !profile) return;

    const shareUrl = `${window.location.origin}/fortune/${edition}/share/${profileId}?ref=${user?.id ?? ""}`;
    const { interpretation } = result;

    shareToKakao({
      title: interpretation.overview.headline,
      description: interpretation.overview.description,
      name: profile.name,
      webDomain: shareUrl,
    });

    setIsShareDrawerOpen(false);
  }, [result, profile, profileId, user, edition]);

  const handleProfileShareKakao = useCallback(async () => {
    if (!result || !profile) return;

    setShowProfileCard(true);
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const blob = await profileCardToBlob();
      if (!blob) {
        showToast({ kind: "error", message: tY("cast.imageError") });
        return;
      }

      const shareUrl = `${window.location.origin}/fortune/${edition}/share/${profileId}?ref=${user?.id ?? ""}`;

      await shareToKakaoWithImage({
        imageBlob: blob,
        name: profile.name,
        webDomain: shareUrl,
      });
    } catch (shareError) {
      console.error("Failed to share to Kakao with image:", shareError);
      showToast({ kind: "error", message: tY("cast.shareError") });
    } finally {
      timeoutRef.current = setTimeout(() => {
        setShowProfileCard(false);
        setIsProfileShareDrawerOpen(false);
      }, 500);
    }
  }, [result, profile, profileId, profileCardToBlob, user, edition, tY]);

  // 기기 공유 시트(인스타그램 등). 지원하지 않는 브라우저면 링크 복사로 대신한다
  const handleShareSystem = useCallback(async () => {
    if (!result) return;
    try {
      const shared = await shareLinkWithSystem({
        title: result.interpretation.overview.headline,
        url: `${window.location.origin}/fortune/${edition}/share/${profileId}?ref=${user?.id ?? ""}`,
      });
      if (shared === "unsupported") {
        handleShare();
      }
    } catch (shareError) {
      console.error("Failed to share with system sheet:", shareError);
    }
    setIsShareDrawerOpen(false);
  }, [result, edition, profileId, user, handleShare]);

  // 포스터 이미지를 기기 공유 시트로(인스타그램 스토리). 파일 공유를 못 하면 저장으로 대신한다
  const handlePosterShareSystem = useCallback(async () => {
    if (!result) return;
    setShowProfileCard(true);
    await new Promise((resolve) => setTimeout(resolve, 100));
    try {
      const blob = await profileCardToBlob();
      if (!blob) {
        showToast({ kind: "error", message: tScreen("shareSheet.imageError") });
        return;
      }
      const shared = await shareImageWithSystem({
        blob,
        filename: "life_spoiler_yearly_poster.png",
        title: result.interpretation.overview.headline,
      });
      if (shared === "unsupported") {
        await downloadProfileImage();
      }
    } catch (shareError) {
      console.error("Failed to share poster with system sheet:", shareError);
      showToast({ kind: "error", message: tScreen("shareSheet.shareError") });
    } finally {
      timeoutRef.current = setTimeout(() => {
        setShowProfileCard(false);
        setIsProfileShareDrawerOpen(false);
      }, 500);
    }
  }, [result, profileCardToBlob, downloadProfileImage, tScreen]);

  // 12개월 계산이 무거우므로 명반·연도가 바뀔 때만
  const flow = useMemo(
    () => (result ? getYearFlow(result.rawChart, currentYear) : null),
    [result, currentYear]
  );
  const insights = useMemo(
    () =>
      result
        ? calculateYearlyInsights(result.rawChart, currentYear, locale)
        : null,
    [result, currentYear, locale]
  );
  const lens = useMemo(() => buildMonthLens(currentYear), [currentYear]);

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
            onButtonClick={() => router.push(`/profiles?type=${edition}`)}
          />
        </main>
      </div>
    );
  }

  if (!result || !profile || !flow) {
    return null;
  }

  const { interpretation, rawChart, yearlySihua } = result;
  const ganji = formatYearGanji(currentYear, locale);
  const scores = {
    wealth: interpretation.categories.wealth.score ?? 0,
    career: interpretation.categories.career.score ?? 0,
    relationship: interpretation.categories.relationship.score ?? 0,
    health: interpretation.categories.health.score ?? 0,
  };
  const categoryLabels = {
    wealth: t("categories.wealth"),
    career: t("categories.career"),
    relationship: t("categories.relationship"),
    health: t("categories.health"),
  };
  const nextKey = pickNextAfterYearly(storedProfile ?? null, edition);
  const [bestMonth] = flow.bestMonths;

  const renderPoster = (isImage: boolean, showShare = true) => (
    <YearlyCharacterPoster
      ref={isImage ? profileCardRef : undefined}
      name={profile.name}
      year={currentYear}
      ganji={ganji}
      headline={interpretation.overview.headline}
      tags={interpretation.overview.tags}
      scores={scores}
      categoryLabels={categoryLabels}
      isImage={isImage}
      shouldShowShareButton={showShare}
      onShareClick={() => setIsProfileShareDrawerOpen(true)}
    />
  );

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={`${screen.root} ${styles.main}`}>
        <YearlyFeatureBody
          name={profile.name}
          year={currentYear}
          interpretation={interpretation}
          rawChart={rawChart}
          wuxingJu={result.chart.wuxingJu}
          yearlySihua={yearlySihua}
          flow={flow}
          lens={lens}
          insights={insights}
          fortuneType={edition}
          surface="owner"
          cast={renderPoster(false)}
          extraSceneIds={EXTRA_SCENE_IDS}
        />

        {nextKey && (
          <NextShow
            href={getFortuneHref(storedProfile ?? null, nextKey)}
            kicker={tY(`next.kicker.${nextKey}`, { year: currentYear + 1 })}
            name={tHome(`${nextKey}.title`)}
            body={tY(`next.body.${nextKey}`, { year: currentYear })}
            button={tY("next.button")}
            fortuneType={edition}
            nextType={nextKey}
          />
        )}

        <EndCredits
          name={profile.name}
          endLabel={`THE END · ${currentYear}`}
          rows={[
            { label: "YEAR", value: ganji },
            {
              label: "BEST MONTH",
              value: tY("credits.bestMonth", { month: bestMonth }),
            },
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

      <FollowUpEntry
        profileId={profileId}
        fortuneType={edition}
        fortuneName={t("followUpName", { year: currentYear })}
        examplePrompts={tY.raw("followUp.prompts") as string[]}
      />

      <ReviewDrawer
        isOpen={isReviewDrawerOpen}
        onClose={() => setIsReviewDrawerOpen(false)}
        profileId={profileId}
        fortuneType={edition}
      />

      <FortuneShareSheet
        isOpen={isShareDrawerOpen}
        onClose={() => setIsShareDrawerOpen(false)}
        eyebrow="SHARE"
        title={tScreen("shareSheet.linkTitle")}
        showInvite
        onShareKakao={handleShareKakao}
        onShareSystem={handleShareSystem}
        onCopyLink={handleShare}
      />

      <FortuneShareSheet
        isOpen={isProfileShareDrawerOpen}
        onClose={() => setIsProfileShareDrawerOpen(false)}
        eyebrow="POSTER"
        title={tScreen("shareSheet.posterTitle")}
        primary="system"
        preview={{
          art: renderPoster(false, false),
          label: tScreen("shareSheet.posterLabel"),
          title: interpretation.overview.headline,
          desc: tScreen("shareSheet.posterDesc"),
        }}
        onShareSystem={handlePosterShareSystem}
        onShareKakao={handleProfileShareKakao}
        onDownloadImage={handleProfileDownloadImage}
        isBusy={isDownloading}
      />

      {/* 이미지 생성용 숨겨진 캐릭터 포스터 (375×667) */}
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
          {renderPoster(true)}
        </div>
      )}

      {showCopyToast && <CopyToast message={tCommon("copySuccess")} />}
    </div>
  );
};
