"use client";

import { ChevronLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef } from "react";

import { MarkdownContent } from "@/components/fortune";
import { ChartConstellation } from "@/components/fortune/screen/ChartConstellation";
import { FeatureLocks } from "@/components/fortune/screen/FeatureLocks";
import { FilmPoster } from "@/components/fortune/screen/FilmPoster";
import { LockedQuestions } from "@/components/fortune/screen/LockedQuestions";
import { RuntimeTrack } from "@/components/fortune/screen/RuntimeTrack";
import { SubtitleStill } from "@/components/fortune/screen/SubtitleStill";
import { TrailerCuts } from "@/components/fortune/screen/TrailerCuts";
import screen from "@/components/fortune/screen/screen.module.css";
import { HeaderClient } from "@/components/landing";
import { Loading } from "@/components/loading";
import { trackFortuneEvent } from "@/libs/analytics/fortune";
import { useScreenCast } from "@/libs/fortune/use-screen-cast";
import { getFilmAge } from "@/libs/home/home-film";
import { useLifetimePreview } from "@/libs/hooks/fortune";
import {
  useFirstPaymentEligibility,
  toEventPriceText,
} from "@/libs/hooks/payment";
import {
  extractKeywordsFromChart,
  extractOneLinerFromChart,
} from "@/libs/zi-wei-dou-shu/calculators";
import type { Locale } from "@/i18n/config";

import styles from "./page.module.css";

export default function LifetimeFortunePreviewPage() {
  const locale = useLocale() as Locale;
  const tCommon = useTranslations("fortune.common");
  const tLifetime = useTranslations("fortune.lifetime");
  const t = useTranslations("fortune.screen");

  const {
    isLoading,
    error,
    result,
    profile,
    isAIGenerated,
    handlePayment,
    handleBack,
  } = useLifetimePreview({
    onProfileNotFound: () => tCommon("profileNotFound"),
    onFetchError: () => tLifetime("interpretError"),
    onUnknownError: () => tCommon("unknownError"),
    onAIGenerationFailed: () => tLifetime("interpretError"),
  });

  // 첫 결제 100원 자격 시 CTA 금액 표기를 100원으로
  const firstPaymentEligible = useFirstPaymentEligibility(
    profile?.id,
    "lifetime"
  );

  // 키워드 추출 (12궁 주성 + 밝기 기반, 영향력 점수순)
  const keywords = useMemo(() => {
    if (!result?.rawChart) return [];
    return extractKeywordsFromChart(result.rawChart, locale);
  }, [result?.rawChart, locale]);

  // 한줄 표현 추출 (명궁 대표 주성 기반) — AI 한 줄 정리가 없을 때 포스터 카피
  const chartOneLiner = useMemo(() => {
    if (!result?.rawChart) return null;
    return extractOneLinerFromChart(result.rawChart, locale);
  }, [result?.rawChart, locale]);

  const cast = useScreenCast(result?.rawChart ?? null);

  const hasTrackedViewRef = useRef(false);
  useEffect(() => {
    if (!result || hasTrackedViewRef.current) {
      return;
    }
    hasTrackedViewRef.current = true;
    trackFortuneEvent("fortune_preview_view", { fortune_type: "lifetime" });
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
  const { lifeSpoiler } = interpretation;
  const age = getFilmAge(profile.birth_date);
  const subSections = lifeSpoiler.subSections ?? [];

  const handlePayClick = () => {
    trackFortuneEvent("fortune_preview_cta_click", {
      fortune_type: "lifetime",
      first_payment: firstPaymentEligible,
    });
    handlePayment();
  };

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={`${screen.root} ${styles.main}`}>
        <div className={styles.bleed}>
          <FilmPoster
            variant="preview"
            title={lifeSpoiler.headline}
            tagline={lifeSpoiler.oneLiner ?? chartOneLiner}
            name={profile.name}
            leadStar={cast.leadStar}
            wuxingJu={result.chart.wuxingJu}
            stars={cast.stars}
            starLabels={cast.starLabels}
          />
        </div>

        <section className={screen.runtime}>
          <div className={screen.runtimeHead}>
            <span className={screen.runtimeLabel}>RUNNING TIME</span>
            <span className={screen.runtimeAge}>
              {t.rich("runtime.age", {
                age,
                max: 99,
                b: (chunks) => <b>{chunks}</b>,
              })}
            </span>
          </div>
          <RuntimeTrack age={age} />
          <p className={screen.runtimeNote}>
            {t.rich("runtime.trailerNote", {
              age,
              b: (chunks) => <b>{chunks}</b>,
            })}
          </p>
        </section>

        <section className={screen.section}>
          <p className={screen.eyebrow}>ORIGINAL</p>
          <h2 className={screen.sectionTitle}>{t("chart.title")}</h2>
          <p className={screen.sectionDesc}>{t("chart.desc")}</p>
          <ChartConstellation
            chart={rawChart}
            profileName={profile.name}
            wuxingJu={result.chart.wuxingJu}
            stars={cast.stars}
            interactive={false}
          />
        </section>

        {subSections.length > 0 ? (
          <TrailerCuts items={subSections} />
        ) : (
          lifeSpoiler.summary && (
            <section className={screen.section}>
              <p className={screen.eyebrow}>TRAILER</p>
              <MarkdownContent className={screen.prose}>
                {lifeSpoiler.summary}
              </MarkdownContent>
            </section>
          )
        )}
        {lifeSpoiler.oneLiner && (
          <SubtitleStill
            label={tCommon("oneLinerLabel")}
            text={lifeSpoiler.oneLiner}
          />
        )}

        <FeatureLocks keywords={keywords} />
        <LockedQuestions questions={interpretation.lockedQuestions ?? []} />
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
