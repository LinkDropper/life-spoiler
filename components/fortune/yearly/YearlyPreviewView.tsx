"use client";

import { ChevronLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef } from "react";

import { MarkdownContent } from "@/components/fortune";
import { ChartConstellation } from "@/components/fortune/screen/ChartConstellation";
import { FeatureLocks } from "@/components/fortune/screen/FeatureLocks";
import { SubtitleStill } from "@/components/fortune/screen/SubtitleStill";
import { TrailerTimeline } from "@/components/fortune/screen/TrailerTimeline";
import { YearFlowSection } from "@/components/fortune/screen/YearFlowSection";
import { YearPoster } from "@/components/fortune/screen/YearPoster";
import screen from "@/components/fortune/screen/screen.module.css";
import { HeaderClient } from "@/components/landing";
import { Loading } from "@/components/loading";
import { trackFortuneEvent } from "@/libs/analytics/fortune";
import { useScreenCast } from "@/libs/fortune/use-screen-cast";
import {
  buildMonthLens,
  formatYearGanji,
  getYearFlow,
} from "@/libs/fortune/yearly-screen";
import type { YearlyEdition } from "@/libs/fortune/yearly-editions";
import { useYearlyPreview } from "@/libs/hooks/fortune";
import {
  useFirstPaymentEligibility,
  toEventPriceText,
} from "@/libs/hooks/payment";
import type { Locale } from "@/i18n/config";

import styles from "./YearlyPreviewView.module.css";

interface YearlyPreviewViewProps {
  edition: YearlyEdition;
}

/** 본편에서 열리는 장면 (올해·내년 공통) */
const LOCKED_SCENES = ["act2", "act3", "act4", "bonus"] as const;

/**
 * 올해·내년 운세 예고편 (기획서 §10).
 * 연도 포스터 → 러닝타임(12개월) → 올해의 흐름(조심할 달 가림) → 명반 → 예고편 타임라인 → 본편에서 상영돼요 → 결제 바
 */
export const YearlyPreviewView = ({ edition }: YearlyPreviewViewProps) => {
  const locale = useLocale() as Locale;
  const tCommon = useTranslations("fortune.common");
  const tYearly = useTranslations("fortune.yearly");
  const t = useTranslations("fortune.screen");
  const tY = useTranslations("fortune.screen.yearly");

  const {
    isLoading,
    error,
    result,
    profile,
    currentYear,
    isAIGenerated,
    handlePayment,
    handleBack,
  } = useYearlyPreview({
    edition,
    onProfileNotFound: () => tCommon("profileNotFound"),
    onFetchError: () => tYearly("fetchError"),
    onUnknownError: () => tCommon("unknownError"),
    onAIGenerationFailed: () => tYearly("fetchError"),
  });

  const firstPaymentEligible = useFirstPaymentEligibility(profile?.id, edition);
  const cast = useScreenCast(result?.rawChart ?? null);

  // 12개월 계산이 무거우므로 명반·연도가 바뀔 때만
  const flow = useMemo(
    () => (result ? getYearFlow(result.rawChart, currentYear) : null),
    [result, currentYear]
  );
  const lens = useMemo(() => buildMonthLens(currentYear), [currentYear]);

  const hasTrackedViewRef = useRef(false);
  useEffect(() => {
    if (!result || hasTrackedViewRef.current) {
      return;
    }
    hasTrackedViewRef.current = true;
    trackFortuneEvent("fortune_preview_view", { fortune_type: edition });
  }, [result, edition]);

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

  if (!result || !profile || !flow) {
    return null;
  }

  const { interpretation, rawChart, yearlySihua } = result;
  const { overview } = interpretation;
  const subSections = overview.subSections ?? [];
  const ganji = formatYearGanji(currentYear, locale);
  const nowMonth = lens.mode === "current" ? lens.focusMonth : null;
  const runtimeMonth = nowMonth ?? (lens.mode === "past" ? 12 : 0);

  const handlePayClick = () => {
    trackFortuneEvent("fortune_preview_cta_click", {
      fortune_type: edition,
      first_payment: firstPaymentEligible,
    });
    handlePayment();
  };

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={`${screen.root} ${styles.main}`}>
        <div className={styles.bleed}>
          <YearPoster
            name={profile.name}
            year={currentYear}
            ganji={ganji}
            title={overview.headline}
            tagline={overview.oneLiner}
            tags={overview.tags.slice(0, 3)}
            leadStar={cast.leadStar}
            flow={flow}
            nowMonth={nowMonth}
          />
        </div>

        <section className={screen.runtime}>
          <div className={screen.runtimeHead}>
            <span className={screen.runtimeLabel}>RUNNING TIME</span>
            <span className={screen.runtimeAge}>
              {t.rich("yearly.runtime.month", {
                month: runtimeMonth,
                b: (chunks) => <b>{chunks}</b>,
              })}
            </span>
          </div>
          <div className={screen.track} aria-hidden="true">
            <span className={screen.trackRail} />
            <span
              className={screen.trackFill}
              style={{ width: `${(runtimeMonth / 12) * 100}%` }}
            />
            <span
              className={screen.trackHead}
              style={{ left: `${(runtimeMonth / 12) * 100}%` }}
            />
          </div>
          <p className={screen.runtimeNote}>
            {t.rich(`yearly.runtime.note.${lens.mode}`, {
              month: lens.focusMonth,
              year: currentYear,
              b: (chunks) => <b>{chunks}</b>,
            })}
          </p>
        </section>

        <YearFlowSection flow={flow} lens={lens} year={currentYear} isPreview />

        <section className={screen.section}>
          <p className={screen.eyebrow}>ORIGINAL</p>
          <h2 className={screen.sectionTitle}>{t("chart.title")}</h2>
          <p className={screen.sectionDesc}>{tY("chart.previewDesc")}</p>
          <ChartConstellation
            chart={rawChart}
            profileName={profile.name}
            wuxingJu={result.chart.wuxingJu}
            stars={cast.stars}
            yearlySihua={yearlySihua}
            interactive={false}
          />
        </section>

        {subSections.length > 0 ? (
          <TrailerTimeline items={subSections} />
        ) : (
          overview.summary && (
            <section className={screen.section}>
              <p className={screen.eyebrow}>TRAILER</p>
              <MarkdownContent className={screen.prose}>
                {overview.summary}
              </MarkdownContent>
            </section>
          )
        )}
        {overview.oneLiner && (
          <SubtitleStill
            label={tCommon("oneLinerLabel")}
            text={overview.oneLiner}
          />
        )}

        <FeatureLocks
          scenes={LOCKED_SCENES.map((scene) => ({
            act: tY(`feature.${scene}.act`),
            title: tY(`feature.${scene}.title`),
            desc: tY(`feature.${scene}.desc`),
          }))}
          spoilerTitle={tY("feature.spoilerTitle", { month: lens.focusMonth })}
          spoilerHint={tY("feature.spoilerHint")}
        />
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
};
