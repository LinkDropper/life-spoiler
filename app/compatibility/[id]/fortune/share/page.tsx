"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { ErrorState } from "@/components/fortune";
import { CompatibilityCharacterPoster } from "@/components/fortune/CompatibilityCharacterPoster";
import { CompatibilityFeatureBody } from "@/components/fortune/compatibility/CompatibilityFeatureBody";
import { EndCredits } from "@/components/fortune/screen/EndCredits";
import screen from "@/components/fortune/screen/screen.module.css";
import { HeaderClient } from "@/components/landing";
import { Loading } from "@/components/loading";
import type { FortuneSceneId } from "@/libs/analytics/fortune";
import { toCompatibilityGenre } from "@/libs/fortune/compatibility-screen";
import { useCompatibilityLeads } from "@/libs/fortune/use-compatibility-leads";
import { useCompatibilityShare } from "@/libs/hooks/compatibility";
import { useReferral } from "@/libs/hooks/useReferral";

import styles from "./page.module.css";

const EXTRA_SCENE_IDS: FortuneSceneId[] = ["end"];

/**
 * 친구가 받은 궁합 본편 (기획서 §13). 본편과 같은 막 구성이되,
 * 끝은 다음 상영작·공유 대신 하단 고정 "우리 궁합 예고편" 한 가지로 모은다.
 */
export default function CompatibilitySharePage() {
  const searchParams = useSearchParams();
  const { saveReferrer } = useReferral();
  const tC = useTranslations("fortune.screen.compatibility");

  // ref 파라미터 캡처
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      saveReferrer(ref);
    }
  }, [searchParams, saveReferrer]);

  const { isLoading, error, result, relationshipType, handleCheckMyFortune } =
    useCompatibilityShare();
  const { leadA, leadB } = useCompatibilityLeads(result);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className={styles.page}>
        <HeaderClient />
        <main className={`${screen.root} ${styles.main}`}>
          <ErrorState
            message={error}
            buttonText={tC("share.cta")}
            onButtonClick={handleCheckMyFortune}
          />
        </main>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const { interpretation, charts, subScores, score } = result;
  const genre = toCompatibilityGenre(relationshipType);

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
          surface="shared"
          extraSceneIds={EXTRA_SCENE_IDS}
          interactiveChart={false}
          poster={
            <div className={styles.posterTop}>
              <span
                className={`${screen.pill} ${screen.pillStatus} ${styles.posterBadge}`}
              >
                {tC("share.badge")}
              </span>
              <CompatibilityCharacterPoster
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
                isImage={false}
                shouldShowShareButton={false}
              />
            </div>
          }
        />

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
          <p className={screen.sectionDesc}>{tC("share.endNote")}</p>
        </EndCredits>
      </main>

      {/* 내 궁합 CTA는 하단 고정 하나로 (크레딧에서 중복하지 않음) */}
      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.ctaButton}
          onClick={handleCheckMyFortune}
        >
          {tC("share.cta")}
        </button>
      </footer>
    </div>
  );
}
