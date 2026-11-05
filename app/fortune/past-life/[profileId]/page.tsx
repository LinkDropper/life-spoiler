"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { CopyToast, ErrorState, ShareDrawer } from "@/components/fortune";
import { FollowUpEntry } from "@/components/fortune/FollowUpEntry";
import { PastLifeCharacterPoster } from "@/components/fortune/PastLifeCharacterPoster";
import { ReviewDrawer } from "@/components/fortune/ReviewDrawer";
import { PastLifeFeatureBody } from "@/components/fortune/past-life/PastLifeFeatureBody";
import { EndCredits } from "@/components/fortune/screen/EndCredits";
import { NextShow } from "@/components/fortune/screen/NextShow";
import screen from "@/components/fortune/screen/screen.module.css";
import { HeaderClient } from "@/components/landing";
import { Loading } from "@/components/loading";
import type { FortuneSceneId } from "@/libs/analytics/fortune";
import { pickNextAfterPastLife } from "@/libs/fortune/past-life-screen";
import { getFortuneHref } from "@/libs/home/home-profile";
import { usePastLifeFortune } from "@/libs/hooks/fortune";
import { useImageDownload } from "@/libs/hooks/useImageDownload";
import { shareToKakao, shareToKakaoWithImage } from "@/libs/kakao";
import { useProfileById } from "@/libs/stores/profile/provider";
import { useUser } from "@/libs/stores/user";

import styles from "./page.module.css";

const EXTRA_SCENE_IDS: FortuneSceneId[] = ["next", "end"];

/** 전생 운세 본편 = 전편(PREQUEL) (기획서 §12) */
export default function PastLifeFortunePage() {
  const router = useRouter();
  const user = useUser();
  const t = useTranslations("fortune.pastLife");
  const tCommon = useTranslations("fortune.common");
  const tScreen = useTranslations("fortune.screen");
  const tP = useTranslations("fortune.screen.pastLife");
  const tHome = useTranslations("home");

  const {
    isLoading,
    error,
    result,
    profile,
    profileId,
    showCopyToast,
    handleShare,
  } = usePastLifeFortune({
    onProfileNotFound: () => tCommon("profileNotFound"),
    onFetchError: () => t("interpretError"),
    onUnknownError: () => tCommon("unknownError"),
  });
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
    filename: "life_spoiler_past_life_profile",
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

    const shareUrl = `${window.location.origin}/fortune/past-life/share/${profileId}?ref=${user?.id ?? ""}`;
    const { interpretation } = result;

    shareToKakao({
      title: interpretation.spoiler.headline,
      description: interpretation.spoiler.description,
      name: profile.name,
      webDomain: shareUrl,
    });

    setIsShareDrawerOpen(false);
  }, [result, profile, profileId, user]);

  const handleProfileShareKakao = useCallback(async () => {
    if (!result || !profile) return;

    setShowProfileCard(true);
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const blob = await profileCardToBlob();
      if (!blob) {
        alert(tP("poster.imageError"));
        return;
      }

      const shareUrl = `${window.location.origin}/fortune/past-life/share/${profileId}?ref=${user?.id ?? ""}`;

      await shareToKakaoWithImage({
        imageBlob: blob,
        name: profile.name,
        webDomain: shareUrl,
      });
    } catch (shareError) {
      console.error("Failed to share to Kakao with image:", shareError);
      alert(tP("poster.shareError"));
    } finally {
      timeoutRef.current = setTimeout(() => {
        setShowProfileCard(false);
        setIsProfileShareDrawerOpen(false);
      }, 500);
    }
  }, [result, profile, profileId, profileCardToBlob, user, tP]);

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
            buttonText={tCommon("backToProfiles")}
            onButtonClick={() => router.push("/profiles?type=past-life")}
          />
        </main>
      </div>
    );
  }

  if (!result || !profile) {
    return null;
  }

  const { interpretation, rawChart } = result;
  const { world } = interpretation;
  const nextKey = pickNextAfterPastLife(storedProfile ?? null);

  const renderPoster = (isImage: boolean) => (
    <PastLifeCharacterPoster
      ref={isImage ? profileCardRef : undefined}
      name={profile.name}
      imageUrl={interpretation.imageUrl}
      headline={interpretation.spoiler.headline}
      title={interpretation.stats?.title ?? ""}
      era={world.era}
      location={world.location}
      profileCard={interpretation.profileCard}
      isImage={isImage}
      onShareClick={() => setIsProfileShareDrawerOpen(true)}
    />
  );

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={`${screen.root} ${styles.main}`}>
        <PastLifeFeatureBody
          name={profile.name}
          interpretation={interpretation}
          rawChart={rawChart}
          wuxingJu={result.chart.wuxingJu}
          surface="owner"
          extraSceneIds={EXTRA_SCENE_IDS}
          poster={<div className={styles.posterTop}>{renderPoster(false)}</div>}
        />

        {nextKey && (
          <NextShow
            href={getFortuneHref(storedProfile ?? null, nextKey)}
            kicker={tScreen(`yearly.next.kicker.${nextKey}`, {
              year: new Date().getFullYear() + 1,
            })}
            name={tHome(`${nextKey}.title`)}
            body={tP(`next.body.${nextKey}`)}
            button={tScreen("yearly.next.button")}
            fortuneType="past_life"
            nextType={nextKey}
          />
        )}

        <EndCredits
          name={profile.name}
          endLabel="THE END · PREQUEL"
          rows={[
            { label: "ROLE", value: world.socialRole },
            { label: "ERA", value: world.era },
            { label: "LOCATION", value: world.location },
          ]}
        >
          {interpretation.profileCard?.epitaph && (
            <p className={screen.sectionDesc}>
              “{interpretation.profileCard.epitaph}”
            </p>
          )}
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
          <p className={screen.pastDisclaimer}>{t("disclaimer")}</p>
        </EndCredits>
      </main>

      <FollowUpEntry
        profileId={profileId}
        fortuneType="past_life"
        fortuneName={tP("followUp.name")}
        examplePrompts={tP.raw("followUp.prompts") as string[]}
      />

      <ReviewDrawer
        isOpen={isReviewDrawerOpen}
        onClose={() => setIsReviewDrawerOpen(false)}
        profileId={profileId}
        fortuneType="past_life"
      />

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

      <ShareDrawer
        isOpen={isProfileShareDrawerOpen}
        onClose={() => setIsProfileShareDrawerOpen(false)}
        title={t("profileShareTitle")}
        showCopyLink={false}
        showLine={false}
        onShareKakao={handleProfileShareKakao}
        onDownloadImage={handleProfileDownloadImage}
        isDownloading={isDownloading}
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
}
