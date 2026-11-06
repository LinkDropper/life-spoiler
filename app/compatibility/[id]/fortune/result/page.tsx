"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { CopyToast } from "@/components/fortune";
import { CompatibilityCharacterPoster } from "@/components/fortune/CompatibilityCharacterPoster";
import { FollowUpEntry } from "@/components/fortune/FollowUpEntry";
import { ReviewDrawer } from "@/components/fortune/ReviewDrawer";
import { CompatibilityFeatureBody } from "@/components/fortune/compatibility/CompatibilityFeatureBody";
import { EndCredits } from "@/components/fortune/screen/EndCredits";
import { FortuneShareSheet } from "@/components/fortune/screen/FortuneShareSheet";
import { NextShow } from "@/components/fortune/screen/NextShow";
import screen from "@/components/fortune/screen/screen.module.css";
import { HeaderClient } from "@/components/landing";
import { Loading } from "@/components/loading";
import type { FortuneSceneId } from "@/libs/analytics/fortune";
import {
  pickNextAfterCompatibility,
  toCompatibilityGenre,
} from "@/libs/fortune/compatibility-screen";
import { useCompatibilityLeads } from "@/libs/fortune/use-compatibility-leads";
import { getFortuneHref } from "@/libs/home/home-profile";
import { useCompatibilityResult } from "@/libs/hooks/compatibility";
import { useImageDownload } from "@/libs/hooks/useImageDownload";
import { shareToKakao, shareToKakaoWithImage } from "@/libs/kakao";
import { useProfileById } from "@/libs/stores/profile/provider";
import {
  shareImageWithSystem,
  shareLinkWithSystem,
} from "@/libs/share/system-share";
import { useUser } from "@/libs/stores/user";
import { showToast } from "@/libs/toast";

import styles from "./page.module.css";

const EXTRA_SCENE_IDS: FortuneSceneId[] = ["next", "end"];

/** 궁합 운세 본편 = 공동 주연 영화 (기획서 §13) */
export default function CompatibilityResultPage() {
  const router = useRouter();
  const user = useUser();
  const tFortune = useTranslations("compatibility.fortune");
  const tCommon = useTranslations("fortune.common");
  const tScreen = useTranslations("fortune.screen");
  const tC = useTranslations("fortune.screen.compatibility");
  const tHome = useTranslations("home");

  const {
    isLoading,
    error,
    result,
    pairId,
    relationshipType,
    showCopyToast,
    isShareDrawerOpen,
    handleShare,
    handleOpenShareDrawer,
    handleCloseShareDrawer,
  } = useCompatibilityResult();
  const { leadA, leadB } = useCompatibilityLeads(result);
  const storedProfile = useProfileById(
    result?.charts.profileA.profileId ?? null
  );

  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState(false);
  const [isPosterShareDrawerOpen, setIsPosterShareDrawerOpen] = useState(false);
  const [showPosterImage, setShowPosterImage] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 공동 주연 포스터 이미지 훅
  const {
    ref: posterRef,
    download: downloadPosterImage,
    toBlob: posterToBlob,
    isDownloading,
  } = useImageDownload({
    filename: "life_spoiler_compatibility",
    pixelRatio: 2,
  });

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getShareUrl = useCallback(
    () =>
      `${window.location.origin}/compatibility/${pairId}/fortune/share?ref=${user?.id ?? ""}`,
    [pairId, user]
  );

  const closePosterImageLater = () => {
    timeoutRef.current = setTimeout(() => {
      setShowPosterImage(false);
      setIsPosterShareDrawerOpen(false);
    }, 500);
  };

  const handlePosterDownload = async () => {
    setShowPosterImage(true);
    // React 렌더링이 완료될 시간을 확보
    await new Promise((resolve) => setTimeout(resolve, 100));
    try {
      await downloadPosterImage();
    } finally {
      closePosterImageLater();
    }
  };

  const handlePosterShareKakao = async () => {
    if (!result) return;

    setShowPosterImage(true);
    await new Promise((resolve) => setTimeout(resolve, 100));
    try {
      const blob = await posterToBlob();
      if (!blob) {
        showToast({ kind: "error", message: tC("poster.imageError") });
        return;
      }
      await shareToKakaoWithImage({
        imageBlob: blob,
        name: `${leadA.name} × ${leadB.name}`,
        webDomain: getShareUrl(),
      });
    } catch (shareError) {
      console.error("Failed to share to Kakao with image:", shareError);
      showToast({ kind: "error", message: tC("poster.shareError") });
    } finally {
      closePosterImageLater();
    }
  };

  // 기기 공유 시트(인스타그램 등). 지원하지 않는 브라우저면 링크 복사로 대신한다
  const handleShareSystem = async () => {
    if (!result) return;
    try {
      const shared = await shareLinkWithSystem({
        title: result.interpretation.headline,
        url: getShareUrl(),
      });
      if (shared === "unsupported") {
        handleShare();
      }
    } catch (shareError) {
      console.error("Failed to share with system sheet:", shareError);
    }
    handleCloseShareDrawer();
  };

  // 포스터 이미지를 기기 공유 시트로(인스타그램 스토리). 파일 공유를 못 하면 저장으로 대신한다
  const handlePosterShareSystem = async () => {
    if (!result) return;
    setShowPosterImage(true);
    await new Promise((resolve) => setTimeout(resolve, 100));
    try {
      const blob = await posterToBlob();
      if (!blob) {
        showToast({ kind: "error", message: tScreen("shareSheet.imageError") });
        return;
      }
      const shared = await shareImageWithSystem({
        blob,
        filename: "life_spoiler_compatibility_poster.png",
        title: result.interpretation.headline,
      });
      if (shared === "unsupported") {
        await downloadPosterImage();
      }
    } catch (shareError) {
      console.error("Failed to share poster with system sheet:", shareError);
      showToast({ kind: "error", message: tScreen("shareSheet.shareError") });
    } finally {
      closePosterImageLater();
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className={styles.page}>
        <HeaderClient />
        <main className={`${screen.root} ${styles.main}`}>
          <div className={styles.error} role="alert">
            <h2 className={styles.errorTitle}>{tFortune("errorTitle")}</h2>
            <p className={styles.errorDescription}>
              {tFortune("errorDescription")}
            </p>
            <div className={styles.errorButtons}>
              <button
                type="button"
                className={screen.primaryButton}
                onClick={() => window.location.reload()}
              >
                {tFortune("refresh")}
              </button>
              <button
                type="button"
                className={screen.ghostButton}
                onClick={() => router.push("/compatibility")}
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

  const { interpretation, charts, subScores, score } = result;
  const genre = toCompatibilityGenre(relationshipType);
  const nextKey = pickNextAfterCompatibility(storedProfile ?? null);

  // 카카오톡 공유용 짧은 설명 (신구조 oneLiner 우선, 레거시 spoiler 폴백)
  const overviewBlurb =
    interpretation.overviewOneLiner ||
    interpretation.overviewSubSections?.[0]?.body ||
    interpretation.spoiler ||
    "";

  const handleShareKakao = () => {
    shareToKakao({
      title: interpretation.headline,
      description: overviewBlurb,
      name: `${leadA.name} × ${leadB.name}`,
      webDomain: getShareUrl(),
    });
    handleCloseShareDrawer();
  };

  const renderPoster = (isImage: boolean, showShare = true) => (
    <CompatibilityCharacterPoster
      ref={isImage ? posterRef : undefined}
      leadA={{
        name: leadA.name,
        starKey: leadA.starKey,
        starLabel: leadA.leadStar,
      }}
      leadB={{
        name: leadB.name,
        starKey: leadB.starKey,
        starLabel: leadB.leadStar,
      }}
      genre={genre}
      score={score}
      headline={interpretation.headline}
      tags={interpretation.tags}
      subScores={subScores}
      isImage={isImage}
      shouldShowShareButton={showShare}
      onShareClick={() => setIsPosterShareDrawerOpen(true)}
    />
  );

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={`${screen.root} ${styles.main}`}>
        <CompatibilityFeatureBody
          leadA={leadA}
          leadB={leadB}
          score={score}
          subScores={subScores}
          interpretation={interpretation}
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
            body={tC(`next.body.${nextKey}`, { name: leadA.name })}
            button={tScreen("yearly.next.button")}
            fortuneType="compatibility"
            nextType={nextKey}
          />
        )}

        <EndCredits
          name={`${leadA.name} · ${leadB.name}`}
          rows={[
            { label: "GENRE", value: tC(`genre.${genre}`) },
            { label: "CHEMISTRY", value: String(score) },
            {
              label: "ORIGINAL",
              value: `${charts.profileA.chart.wuxingJu} · ${charts.profileB.chart.wuxingJu}`,
            },
          ]}
        >
          {interpretation.overviewOneLiner && (
            <p className={screen.sectionDesc}>
              “{interpretation.overviewOneLiner}”
            </p>
          )}
          <button
            type="button"
            className={screen.primaryButton}
            onClick={handleOpenShareDrawer}
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
        profileId={charts.profileA.profileId}
        pairId={pairId}
        fortuneType="compatibility"
        fortuneName={tC("followUp.name")}
        examplePrompts={tC.raw("followUp.prompts") as string[]}
      />

      <ReviewDrawer
        isOpen={isReviewDrawerOpen}
        onClose={() => setIsReviewDrawerOpen(false)}
        profileId={charts.profileA.profileId}
        fortuneType="compatibility"
      />

      <FortuneShareSheet
        isOpen={isShareDrawerOpen}
        onClose={handleCloseShareDrawer}
        eyebrow="SHARE"
        title={tScreen("shareSheet.linkTitle")}
        showInvite
        onShareKakao={handleShareKakao}
        onShareSystem={handleShareSystem}
        onCopyLink={handleShare}
      />

      <FortuneShareSheet
        isOpen={isPosterShareDrawerOpen}
        onClose={() => setIsPosterShareDrawerOpen(false)}
        eyebrow="POSTER"
        title={tC("poster.shareTitle")}
        primary="system"
        preview={{
          art: renderPoster(false, false),
          label: tScreen("shareSheet.posterLabel"),
          title: interpretation.headline,
          desc: tScreen("shareSheet.posterDesc"),
        }}
        onShareSystem={handlePosterShareSystem}
        onShareKakao={handlePosterShareKakao}
        onDownloadImage={handlePosterDownload}
        isBusy={isDownloading}
      />

      {/* 이미지 생성용 숨겨진 공동 주연 포스터 (375×667) */}
      {showPosterImage && (
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
