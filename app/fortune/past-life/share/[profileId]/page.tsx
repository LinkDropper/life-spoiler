"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { ErrorState } from "@/components/fortune";
import { PastLifeCharacterPoster } from "@/components/fortune/PastLifeCharacterPoster";
import { PastLifeFeatureBody } from "@/components/fortune/past-life/PastLifeFeatureBody";
import { EndCredits } from "@/components/fortune/screen/EndCredits";
import screen from "@/components/fortune/screen/screen.module.css";
import { HeaderClient } from "@/components/landing";
import { Loading } from "@/components/loading";
import type { FortuneSceneId } from "@/libs/analytics/fortune";
import { usePastLifeShare } from "@/libs/hooks/fortune";
import { useReferral } from "@/libs/hooks/useReferral";

import styles from "./page.module.css";

const EXTRA_SCENE_IDS: FortuneSceneId[] = ["end"];

/**
 * 친구가 받은 전생 운세 본편 (기획서 §12). 예전에는 이 경로가 없어 공유 링크가 404였다.
 * 본편과 같은 구성, 다음 상영작 없음, 하단 고정 "내 전생 예고편 무료로 보기" 하나.
 */
export default function PastLifeSharePage() {
  const searchParams = useSearchParams();
  const { saveReferrer } = useReferral();
  const t = useTranslations("fortune.pastLife");
  const tCommon = useTranslations("fortune.common");
  const tP = useTranslations("fortune.screen.pastLife");

  // ref 파라미터 캡처
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      saveReferrer(ref);
    }
  }, [searchParams, saveReferrer]);

  const { isLoading, error, result, profile, handleCheckMyFortune } =
    usePastLifeShare({
      onFortuneNotFound: () => tCommon("fortuneNotFound"),
      onUnknownError: () => tCommon("unknownError"),
    });

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
            buttonText={tP("share.cta")}
            onButtonClick={handleCheckMyFortune}
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

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={`${screen.root} ${styles.main}`}>
        <PastLifeFeatureBody
          name={profile.name}
          interpretation={interpretation}
          rawChart={rawChart}
          wuxingJu={result.chart.wuxingJu}
          surface="shared"
          interactiveChart={false}
          extraSceneIds={EXTRA_SCENE_IDS}
          poster={
            <div className={styles.posterTop}>
              <span
                className={`${screen.pill} ${screen.pillStatus} ${styles.posterBadge}`}
              >
                {tP("share.badge")}
              </span>
              <PastLifeCharacterPoster
                name={profile.name}
                imageUrl={interpretation.imageUrl}
                headline={interpretation.spoiler.headline}
                title={interpretation.stats?.title ?? ""}
                era={world.era}
                location={world.location}
                profileCard={interpretation.profileCard}
                isImage={false}
                shouldShowShareButton={false}
              />
            </div>
          }
        />

        <EndCredits
          name={profile.name}
          endLabel="THE END · PREQUEL"
          rows={[
            { label: "ROLE", value: world.socialRole },
            { label: "ERA", value: world.era },
            { label: "LOCATION", value: world.location },
          ]}
        >
          <p className={screen.sectionDesc}>{tP("share.endNote")}</p>
          <p className={screen.pastDisclaimer}>{t("disclaimer")}</p>
        </EndCredits>
      </main>

      {/* 내 예고편 CTA는 하단 고정 하나로 */}
      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.ctaButton}
          onClick={handleCheckMyFortune}
        >
          {tP("share.cta")}
        </button>
      </footer>
    </div>
  );
}
