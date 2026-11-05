"use client";

import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";

import { ErrorState } from "@/components/fortune";
import { YearlyCharacterPoster } from "@/components/fortune/YearlyCharacterPoster";
import { EndCredits } from "@/components/fortune/screen/EndCredits";
import screen from "@/components/fortune/screen/screen.module.css";
import { HeaderClient } from "@/components/landing";
import { Loading } from "@/components/loading";
import type { FortuneSceneId } from "@/libs/analytics/fortune";
import {
  buildMonthLens,
  formatYearGanji,
  getYearFlow,
} from "@/libs/fortune/yearly-screen";
import type { YearlyEdition } from "@/libs/fortune/yearly-editions";
import { useYearlyShare } from "@/libs/hooks/fortune";
import { useReferral } from "@/libs/hooks/useReferral";
import { calculateYearlyInsights } from "@/libs/zi-wei-dou-shu/calculators";
import type { Locale } from "@/i18n/config";

import { YearlyFeatureBody } from "./YearlyFeatureBody";
import styles from "./YearlyShareView.module.css";

const EXTRA_SCENE_IDS: FortuneSceneId[] = ["end"];

interface YearlyShareViewProps {
  edition: YearlyEdition;
}

/**
 * 친구가 받은 올해·내년 운세 본편 (기획서 §10).
 * 본편과 같은 막 구성, 다음 상영작 없음, 하단 고정 "내 올해 예고편 무료로 보기" 하나.
 * 본편 스타일 파일을 빌려 쓰지 않는다(인생 공유 페이지가 깨졌던 원인).
 */
export const YearlyShareView = ({ edition }: YearlyShareViewProps) => {
  const searchParams = useSearchParams();
  const { saveReferrer } = useReferral();
  const locale = useLocale() as Locale;
  const t = useTranslations("fortune.yearly");
  const tCommon = useTranslations("fortune.common");
  const tY = useTranslations("fortune.screen.yearly");

  // ref 파라미터 캡처
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      saveReferrer(ref);
    }
  }, [searchParams, saveReferrer]);

  const {
    isLoading,
    error,
    result,
    profile,
    currentYear,
    handleCheckMyFortune,
  } = useYearlyShare({
    edition,
    onFortuneNotFound: () =>
      tCommon("fortuneNotFound", {
        default: "운세 데이터를 찾을 수 없습니다.",
      }),
    onUnknownError: () =>
      tCommon("unknownError", {
        default: "알 수 없는 오류가 발생했습니다.",
      }),
  });

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
            buttonText={tY("share.cta")}
            onButtonClick={handleCheckMyFortune}
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
  const [bestMonth] = flow.bestMonths;

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
          surface="shared"
          badge={tY("share.badge")}
          interactiveChart={false}
          extraSceneIds={EXTRA_SCENE_IDS}
          cast={
            <YearlyCharacterPoster
              name={profile.name}
              year={currentYear}
              ganji={ganji}
              headline={interpretation.overview.headline}
              tags={interpretation.overview.tags}
              scores={{
                wealth: interpretation.categories.wealth.score ?? 0,
                career: interpretation.categories.career.score ?? 0,
                relationship: interpretation.categories.relationship.score ?? 0,
                health: interpretation.categories.health.score ?? 0,
              }}
              categoryLabels={{
                wealth: t("categories.wealth"),
                career: t("categories.career"),
                relationship: t("categories.relationship"),
                health: t("categories.health"),
              }}
              isImage={false}
              shouldShowShareButton={false}
            />
          }
        />

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
          <p className={screen.sectionDesc}>{tY("share.endNote")}</p>
        </EndCredits>
      </main>

      {/* 내 예고편 CTA는 하단 고정 하나로 (크레딧에서 중복하지 않음) */}
      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.ctaButton}
          onClick={handleCheckMyFortune}
        >
          {tY("share.cta")}
        </button>
      </footer>
    </div>
  );
};
