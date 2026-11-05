"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";

import { ErrorState, MarkdownContent } from "@/components/fortune";
import type { CategoryKey } from "@/components/fortune";
import { LifetimeCharacterPoster } from "@/components/fortune/LifetimeCharacterPoster";
import { ActIntertitle } from "@/components/fortune/screen/ActIntertitle";
import { AgeLens, toAgeSceneId } from "@/components/fortune/screen/AgeLens";
import { CategoryStory } from "@/components/fortune/screen/CategoryStory";
import { ChartConstellation } from "@/components/fortune/screen/ChartConstellation";
import { EndCredits } from "@/components/fortune/screen/EndCredits";
import { FilmPoster } from "@/components/fortune/screen/FilmPoster";
import { LifetimeNowShowing } from "@/components/fortune/screen/LifetimeNowShowing";
import { NumberedSections } from "@/components/fortune/screen/NumberedSections";
import { RatingBoard } from "@/components/fortune/screen/RatingBoard";
import type { RatingItem } from "@/components/fortune/screen/RatingBoard";
import { ScreenPlayer } from "@/components/fortune/screen/ScreenPlayer";
import type { PlayerScene } from "@/components/fortune/screen/ScreenPlayer";
import { SubtitleStill } from "@/components/fortune/screen/SubtitleStill";
import screen from "@/components/fortune/screen/screen.module.css";
import { HeaderClient } from "@/components/landing";
import { Loading } from "@/components/loading";
import type { FortuneSceneId } from "@/libs/analytics/fortune";
import { buildAgeLens } from "@/libs/fortune/lifetime-screen";
import { useScreenCast } from "@/libs/fortune/use-screen-cast";
import { getFilmAge } from "@/libs/home/home-film";
import { useLifetimeShare } from "@/libs/hooks/fortune";
import { useReferral } from "@/libs/hooks/useReferral";

import styles from "./page.module.css";

const CATEGORY_KEYS: CategoryKey[] = [
  "wealth",
  "career",
  "relationship",
  "health",
];

const ACT_IDS = ["act1", "act2", "act3", "act4"] as const;

const EXTRA_SCENE_IDS: FortuneSceneId[] = ["end"];

/**
 * 친구가 받은 인생 운세 본편. 본편과 같은 막 구성이되,
 * 끝은 다음 상영작·공유 대신 하단 고정 "내 인생 예고편" 한 가지로 모은다.
 */
export default function LifetimeFortuneSharePage() {
  const searchParams = useSearchParams();
  const { saveReferrer } = useReferral();
  const t = useTranslations("fortune.lifetime");
  const tCommon = useTranslations("fortune.common");
  const tScreen = useTranslations("fortune.screen");

  // ref 파라미터 캡처
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      saveReferrer(ref);
    }
  }, [searchParams, saveReferrer]);

  const { isLoading, error, result, profile, handleCheckMyFortune } =
    useLifetimeShare({
      onFortuneNotFound: () =>
        tCommon("fortuneNotFound", {
          default: "운세 데이터를 찾을 수 없습니다.",
        }),
      onUnknownError: () =>
        tCommon("unknownError", {
          default: "알 수 없는 오류가 발생했습니다.",
        }),
    });

  const cast = useScreenCast(result?.rawChart ?? null);

  const scenes = useMemo<PlayerScene[]>(
    () =>
      ACT_IDS.map((id, index) => ({
        id,
        act: `ACT ${index + 1}`,
        title: tScreen(`acts.${id}.title`),
        sub: tScreen(`acts.${id}.sub`),
      })),
    [tScreen]
  );

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
            buttonText={tScreen("share.cta")}
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
  const { lifeSpoiler, coreScenario, categories, ageScenarios } =
    interpretation;
  const age = getFilmAge(profile.birth_date);
  const ageLens =
    ageScenarios.length > 0
      ? buildAgeLens(
          ageScenarios.map((scenario) => scenario.period),
          age
        )
      : null;

  // 프로필 카드용 점수
  const storyScores = {
    wealth: categories.wealth.score ?? 0,
    career: categories.career.score ?? 0,
    relationship: categories.relationship.score ?? 0,
    health: categories.health.score ?? 0,
  };

  const ratingItems: RatingItem[] = CATEGORY_KEYS.map((key) => ({
    key,
    label: t(`categories.${key}`),
    score: storyScores[key],
    review: categories[key].headline,
  }));

  // 한 줄 정리 라벨 (i18n)
  const oneLinerLabel = tCommon("oneLinerLabel", { default: "한 줄 정리" });

  const renderActIntertitle = (id: (typeof ACT_IDS)[number]) => (
    <ActIntertitle
      id={id}
      act={`ACT ${ACT_IDS.indexOf(id) + 1}`}
      title={tScreen(`acts.${id}.title`)}
      sub={tScreen(`acts.${id}.sub`)}
    />
  );

  const renderPoster = (isImage: boolean) => (
    <LifetimeCharacterPoster
      ref={undefined}
      name={profile.name}
      leadStarKey={cast.stars[0]?.starName ?? null}
      leadStarLabel={cast.starLabels[0] ?? ""}
      headline={lifeSpoiler.headline}
      profileTraits={interpretation.profileTraits}
      scores={storyScores}
      categoryLabels={{
        wealth: t("categories.wealth"),
        career: t("categories.career"),
        relationship: t("categories.relationship"),
        health: t("categories.health"),
      }}
      isImage={isImage}
      shouldShowShareButton={false}
    />
  );

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={`${screen.root} ${styles.main}`}>
        <div className={styles.bleed}>
          {ageLens ? (
            <LifetimeNowShowing
              name={profile.name}
              age={age}
              scenarios={ageScenarios}
              badge={tScreen("share.badge")}
              targetId={toAgeSceneId(ageLens.nowIndex)}
              surface="shared"
            />
          ) : (
            <FilmPoster
              variant="share"
              title={lifeSpoiler.headline}
              tagline={lifeSpoiler.oneLiner}
              name={profile.name}
              leadStar={cast.leadStar}
              wuxingJu={result.chart.wuxingJu}
              stars={cast.stars}
              starLabels={cast.starLabels}
            />
          )}
        </div>

        <ScreenPlayer
          scenes={scenes}
          age={age}
          nowTargetId={ageLens ? toAgeSceneId(ageLens.nowIndex) : undefined}
          extraSceneIds={EXTRA_SCENE_IDS}
          surface="shared"
        />

        <section className={screen.section}>
          <p className={screen.eyebrow}>CAST</p>
          <h2 className={screen.sectionTitle}>{tScreen("character.title")}</h2>
          {renderPoster(false)}
        </section>

        <section className={screen.section}>
          <p className={screen.eyebrow}>ORIGINAL</p>
          <h2 className={screen.sectionTitle}>{tScreen("chart.title")}</h2>
          <p className={screen.sectionDesc}>{tScreen("chart.shareDesc")}</p>
          <ChartConstellation
            chart={rawChart}
            profileName={profile.name}
            wuxingJu={result.chart.wuxingJu}
            stars={cast.stars}
            interactive={false}
          />
        </section>

        {renderActIntertitle("act1")}
        <section className={screen.section}>
          <p className={screen.lead}>{lifeSpoiler.headline}</p>
          {lifeSpoiler.subSections && lifeSpoiler.subSections.length > 0 ? (
            <NumberedSections items={lifeSpoiler.subSections} />
          ) : (
            lifeSpoiler.summary && (
              <MarkdownContent className={screen.prose}>
                {lifeSpoiler.summary}
              </MarkdownContent>
            )
          )}
          {lifeSpoiler.oneLiner && (
            <SubtitleStill label={oneLinerLabel} text={lifeSpoiler.oneLiner} />
          )}
        </section>

        {renderActIntertitle("act2")}
        <section className={screen.section}>
          {coreScenario.headline && (
            <p className={screen.lead}>{coreScenario.headline}</p>
          )}
          {coreScenario.subSections && coreScenario.subSections.length > 0 ? (
            <NumberedSections items={coreScenario.subSections} />
          ) : (
            coreScenario.content && (
              <MarkdownContent className={screen.prose}>
                {coreScenario.content}
              </MarkdownContent>
            )
          )}
          {coreScenario.oneLiner && (
            <SubtitleStill label={oneLinerLabel} text={coreScenario.oneLiner} />
          )}
        </section>

        {renderActIntertitle("act3")}
        <RatingBoard items={ratingItems} />
        {CATEGORY_KEYS.map((key) => (
          <CategoryStory
            key={key}
            label={t(`categories.${key}`)}
            score={storyScores[key]}
            headline={categories[key].headline}
            content={categories[key].content}
            subSections={categories[key].subSections}
            oneLiner={categories[key].oneLiner}
            tags={categories[key].tags}
          />
        ))}

        {ageScenarios.length > 0 && (
          <>
            {renderActIntertitle("act4")}
            <AgeLens
              scenarios={ageScenarios}
              age={age}
              birthTimeUnknown={profile.birth_time_unknown}
              surface="shared"
            />
          </>
        )}

        <EndCredits
          name={profile.name}
          rows={[
            { label: "LEAD STAR", value: cast.leadStar },
            { label: "ORIGINAL", value: result.chart.wuxingJu },
          ]}
        >
          <p className={screen.sectionDesc}>{tScreen("share.endNote")}</p>
        </EndCredits>
      </main>

      {/* 내 예고편 CTA는 하단 고정 하나로 (크레딧에서 중복하지 않음) */}
      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.ctaButton}
          onClick={handleCheckMyFortune}
        >
          {tScreen("share.cta")}
        </button>
      </footer>
    </div>
  );
}
