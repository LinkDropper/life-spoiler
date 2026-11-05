"use client";

import { ChevronLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { MarkdownContent } from "@/components/fortune";
import { getRelationshipLabel } from "@/components/compatibility/utils";
import {
  CastIntro,
  CastingNotes,
  ChartPair,
  CoStarPoster,
} from "@/components/fortune/screen/CompatibilitySections";
import { FeatureLocks } from "@/components/fortune/screen/FeatureLocks";
import { RatingBoard } from "@/components/fortune/screen/RatingBoard";
import { SubtitleStill } from "@/components/fortune/screen/SubtitleStill";
import { TrailerTimeline } from "@/components/fortune/screen/TrailerTimeline";
import screen from "@/components/fortune/screen/screen.module.css";
import { HeaderClient } from "@/components/landing";
import { Loading } from "@/components/loading";
import { trackFortuneEvent } from "@/libs/analytics/fortune";
import {
  COMPATIBILITY_STORY_KEYS,
  toCompatibilityGenre,
} from "@/libs/fortune/compatibility-screen";
import { useCompatibilityLeads } from "@/libs/fortune/use-compatibility-leads";
import { useCompatibilityFortune } from "@/libs/hooks/compatibility";
import {
  useFirstPaymentEligibility,
  toEventPriceText,
} from "@/libs/hooks/payment";

import styles from "./page.module.css";

const LOCKED_SCENES = ["act2", "act3", "act4", "bonus"] as const;

/**
 * 궁합 운세 예고편 = 공동 주연 포스터 (기획서 §13).
 * 포스터(케미 점수·장르) → 배역 소개 → 캐스팅 노트 → 두 사람의 명반 → 예고편 3장면
 * → 네 갈래 평점(잠금) → 본편에서 상영돼요 → 결제 바
 */
export default function CompatibilityPreviewPage() {
  const tFortune = useTranslations("compatibility.fortune");
  const tCard = useTranslations("compatibility.card");
  const tCommon = useTranslations("fortune.common");
  const t = useTranslations("fortune.screen");
  const tC = useTranslations("fortune.screen.compatibility");

  const {
    isLoading,
    error,
    result,
    isAIGenerated,
    relationshipType,
    handlePayment,
    handleBack,
  } = useCompatibilityFortune();
  const { leadA, leadB } = useCompatibilityLeads(result);

  // 첫 결제 100원 자격 시 CTA 금액 표기를 100원으로 (궁합은 pairId 기준)
  const params = useParams();
  const pairId = params.id as string;
  const firstPaymentEligible = useFirstPaymentEligibility(
    pairId,
    "compatibility"
  );

  const hasTrackedViewRef = useRef(false);
  useEffect(() => {
    if (!result || hasTrackedViewRef.current) {
      return;
    }
    hasTrackedViewRef.current = true;
    trackFortuneEvent("fortune_preview_view", {
      fortune_type: "compatibility",
    });
  }, [result]);

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
                onClick={handleBack}
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

  const { interpretation, score } = result;
  const subSections = interpretation.overviewSubSections ?? [];
  const genre = toCompatibilityGenre(relationshipType);

  const handlePayClick = () => {
    trackFortuneEvent("fortune_preview_cta_click", {
      fortune_type: "compatibility",
      first_payment: firstPaymentEligible,
    });
    handlePayment();
  };

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={`${screen.root} ${styles.main}`}>
        <div className={styles.bleed}>
          <CoStarPoster
            leadA={leadA}
            leadB={leadB}
            genre={genre}
            relationLabel={
              relationshipType
                ? getRelationshipLabel(relationshipType, tCard)
                : null
            }
            score={score}
            headline={interpretation.headline}
            tagline={interpretation.overviewOneLiner}
          />
        </div>

        <CastIntro leadA={leadA} leadB={leadB} />
        <CastingNotes
          zodiac={interpretation.insights.zodiac}
          fiveElement={interpretation.insights.fiveElement}
          chemistry={interpretation.insights.chemistry}
        />
        <ChartPair
          leadA={leadA}
          leadB={leadB}
          desc={tC("chart.previewDesc")}
          interactive={false}
        />

        {subSections.length > 0 ? (
          <TrailerTimeline items={subSections} />
        ) : (
          interpretation.spoiler && (
            <section className={screen.section}>
              <p className={screen.eyebrow}>TRAILER</p>
              <MarkdownContent className={screen.prose}>
                {interpretation.spoiler}
              </MarkdownContent>
            </section>
          )
        )}
        {interpretation.overviewOneLiner && (
          <SubtitleStill
            label={tCommon("oneLinerLabel")}
            text={interpretation.overviewOneLiner}
          />
        )}

        {/* 네 갈래 점수는 본편에서: 점수와 한 줄 평은 화면에 넣지 않는다 */}
        <RatingBoard
          items={COMPATIBILITY_STORY_KEYS.map((key) => ({
            key,
            label: tC(`stories.${key}`),
            score: 0,
            review: tC("rating.lockedReview"),
          }))}
          lockedHint={tC("rating.lockedHint")}
        />

        <FeatureLocks
          scenes={LOCKED_SCENES.map((scene) => ({
            act: tC(`feature.${scene}.act`),
            title: tC(`feature.${scene}.title`),
            desc: tC(`feature.${scene}.desc`),
          }))}
          spoilerTitle={tC("feature.spoilerTitle")}
          spoilerHint={tC("feature.spoilerHint")}
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
}
