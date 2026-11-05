"use client";

import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { MarkdownContent } from "@/components/fortune";
import { ChartConstellation } from "@/components/fortune/screen/ChartConstellation";
import { FeatureLocks } from "@/components/fortune/screen/FeatureLocks";
import { PastPoster } from "@/components/fortune/screen/PastLifeSections";
import { SubtitleStill } from "@/components/fortune/screen/SubtitleStill";
import { TrailerTimeline } from "@/components/fortune/screen/TrailerTimeline";
import screen from "@/components/fortune/screen/screen.module.css";
import { HeaderClient } from "@/components/landing";
import { Loading } from "@/components/loading";
import { trackFortuneEvent } from "@/libs/analytics/fortune";
import { useScreenCast } from "@/libs/fortune/use-screen-cast";
import { usePastLifePreview } from "@/libs/hooks/fortune";
import {
  useFirstPaymentEligibility,
  toEventPriceText,
} from "@/libs/hooks/payment";

import styles from "./page.module.css";

const LOCKED_SCENES = ["act1", "act2", "act3", "act4", "bonus"] as const;

/**
 * 전생 운세 예고편 = 전편(PREQUEL) 포스터 (기획서 §12).
 * 키 아트 포스터(그림은 결제 전 흐리게) → 명반 → 예고편 타임라인 → 본편에서 상영돼요(마지막 대사 잠금) → 결제 바
 */
export default function PastLifePreviewPage() {
  const tCommon = useTranslations("fortune.common");
  const tPastLife = useTranslations("fortune.pastLife");
  const t = useTranslations("fortune.screen");
  const tP = useTranslations("fortune.screen.pastLife");

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

  const firstPaymentEligible = useFirstPaymentEligibility(
    profile?.id,
    "past_life"
  );
  const cast = useScreenCast(result?.rawChart ?? null);

  const hasTrackedViewRef = useRef(false);
  useEffect(() => {
    if (!result || hasTrackedViewRef.current) {
      return;
    }
    hasTrackedViewRef.current = true;
    trackFortuneEvent("fortune_preview_view", { fortune_type: "past_life" });
  }, [result]);

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
        <main className={`${screen.root} ${styles.main}`}>
          <div className={styles.error} role="alert">
            <h2 className={styles.errorTitle}>{t("error.title")}</h2>
            <p className={styles.errorDescription}>{t("error.desc")}</p>
            <div className={styles.errorButtons}>
              <button
                type="button"
                className={screen.primaryButton}
                onClick={handleRefresh}
              >
                {t("error.refresh")}
              </button>
              <button
                type="button"
                className={screen.ghostButton}
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
  const { spoiler } = interpretation;
  const subSections = spoiler.subSections ?? [];

  const handlePayClick = () => {
    trackFortuneEvent("fortune_preview_cta_click", {
      fortune_type: "past_life",
      first_payment: firstPaymentEligible,
    });
    handlePayment();
  };

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={`${screen.root} ${styles.main}`}>
        <div className={styles.bleed}>
          <PastPoster
            name={profile.name}
            imageUrl={interpretation.imageUrl}
            headline={spoiler.headline}
            tagline={spoiler.oneLiner ?? spoiler.description}
            world={interpretation.world}
          />
        </div>

        <section className={screen.section}>
          <p className={screen.eyebrow}>ORIGINAL</p>
          <h2 className={screen.sectionTitle}>{t("chart.title")}</h2>
          <p className={screen.sectionDesc}>{tP("chart.previewDesc")}</p>
          <ChartConstellation
            chart={rawChart}
            profileName={profile.name}
            wuxingJu={result.chart.wuxingJu}
            stars={cast.stars}
            interactive={false}
          />
        </section>

        {subSections.length > 0 ? (
          <TrailerTimeline items={subSections} />
        ) : (
          spoiler.summary && (
            <section className={screen.section}>
              <p className={screen.eyebrow}>TRAILER</p>
              <MarkdownContent className={screen.prose}>
                {spoiler.summary}
              </MarkdownContent>
            </section>
          )
        )}
        {spoiler.oneLiner && (
          <SubtitleStill
            label={tCommon("oneLinerLabel")}
            text={spoiler.oneLiner}
          />
        )}

        <FeatureLocks
          scenes={LOCKED_SCENES.map((scene) => ({
            act: tP(`feature.${scene}.act`),
            title: tP(`feature.${scene}.title`),
            desc: tP(`feature.${scene}.desc`),
          }))}
          spoilerTitle={tP("feature.spoilerTitle")}
          spoilerHint={tP("feature.spoilerHint")}
        />
        <p className={screen.pastDisclaimer}>{tPastLife("disclaimer")}</p>
      </main>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.backButton}
          onClick={handleBack}
          aria-label={t("pay.back")}
        >
          <ChevronLeft size={24} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.paymentButton}
          onClick={handlePayClick}
          disabled={!isAIGenerated}
        >
          {firstPaymentEligible
            ? toEventPriceText(t("pay.button"))
            : t("pay.button")}
        </button>
      </footer>
    </div>
  );
}
