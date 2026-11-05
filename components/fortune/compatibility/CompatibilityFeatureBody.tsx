"use client";

import { useTranslations } from "next-intl";
import { useMemo, type ReactNode } from "react";

import { MarkdownContent } from "@/components/fortune";
import { ActIntertitle } from "@/components/fortune/screen/ActIntertitle";
import { CategoryStory } from "@/components/fortune/screen/CategoryStory";
import {
  CastIntro,
  CastingNotes,
  ChartPair,
  DuoScene,
} from "@/components/fortune/screen/CompatibilitySections";
import type { CompatibilityLead } from "@/components/fortune/screen/CompatibilitySections";
import { NumberedSections } from "@/components/fortune/screen/NumberedSections";
import { RatingBoard } from "@/components/fortune/screen/RatingBoard";
import { ScreenPlayer } from "@/components/fortune/screen/ScreenPlayer";
import type { PlayerScene } from "@/components/fortune/screen/ScreenPlayer";
import { SubtitleStill } from "@/components/fortune/screen/SubtitleStill";
import screen from "@/components/fortune/screen/screen.module.css";
import type { FortuneSceneId, FortuneSurface } from "@/libs/analytics/fortune";
import {
  COMPATIBILITY_STORY_KEYS,
  getStoryScore,
} from "@/libs/fortune/compatibility-screen";
import { toRating } from "@/libs/fortune/lifetime-screen";
import type {
  CompatibilityInterpretation,
  CompatibilitySubScores,
  CompatibilitySubSection,
} from "@/libs/hooks/compatibility/types";

const ACT_IDS = ["act1", "act2", "act3", "act4"] as const;

/** 상영 컨트롤 바 "총평" 버튼이 데려올 곳 */
export const COMPATIBILITY_RATING_ID = "compat-rating";

interface CompatibilityFeatureBodyProps {
  leadA: CompatibilityLead;
  leadB: CompatibilityLead;
  score: number;
  subScores: CompatibilitySubScores;
  interpretation: CompatibilityInterpretation;
  surface: FortuneSurface;
  /** 맨 위 공동 주연 포스터 자리 (본편: 공유 버튼 포함, 공유 페이지: 배지만) */
  poster: ReactNode;
  extraSceneIds: FortuneSceneId[];
  interactiveChart?: boolean;
}

/** 구조화 본문(subSections) 우선, 없으면 예전 텍스트 */
const StoryText = ({
  subSections,
  content,
}: {
  subSections?: CompatibilitySubSection[];
  content?: string;
}) =>
  subSections && subSections.length > 0 ? (
    <NumberedSections items={subSections} />
  ) : content ? (
    <MarkdownContent className={screen.prose}>{content}</MarkdownContent>
  ) : null;

/**
 * 궁합 본편과 공유 페이지가 함께 쓰는 막 구성 (기획서 §13).
 * 공동 주연 포스터 → 컨트롤 바 → 배역 소개 → 캐스팅 노트 → 두 사람의 명반
 * → ACT 1 첫 만남 → ACT 2 두 사람의 장면 → ACT 3 네 갈래 → ACT 4 두 사람에게
 */
export const CompatibilityFeatureBody = ({
  leadA,
  leadB,
  score,
  subScores,
  interpretation,
  surface,
  poster,
  extraSceneIds,
  interactiveChart = true,
}: CompatibilityFeatureBodyProps) => {
  const tC = useTranslations("fortune.screen.compatibility");
  const tCommon = useTranslations("fortune.common");
  const oneLinerLabel = tCommon("oneLinerLabel");
  const { insights, categories, coreScenarios } = interpretation;

  const scenes = useMemo<PlayerScene[]>(
    () =>
      ACT_IDS.map((id, index) => ({
        id,
        act: `ACT ${index + 1}`,
        title: tC(`acts.${id}.title`),
        sub: tC(`acts.${id}.sub`),
      })),
    [tC]
  );

  const renderActIntertitle = (id: (typeof ACT_IDS)[number]) => (
    <ActIntertitle
      id={id}
      act={`ACT ${ACT_IDS.indexOf(id) + 1}`}
      title={tC(`acts.${id}.title`)}
      sub={tC(`acts.${id}.sub`)}
    />
  );

  return (
    <>
      {poster}

      <ScreenPlayer
        scenes={scenes}
        age={0}
        nowLabel={tC("player.rating", { score: toRating(score).ten })}
        nowTargetId={COMPATIBILITY_RATING_ID}
        extraSceneIds={extraSceneIds}
        surface={surface}
        fortuneType="compatibility"
      />

      <CastIntro leadA={leadA} leadB={leadB} />
      <CastingNotes
        zodiac={insights.zodiac}
        fiveElement={insights.fiveElement}
        chemistry={insights.chemistry}
      />
      <ChartPair
        leadA={leadA}
        leadB={leadB}
        desc={
          interactiveChart ? tC("chart.featureDesc") : tC("chart.shareDesc")
        }
        interactive={interactiveChart}
      />

      {renderActIntertitle("act1")}
      <section className={screen.section}>
        {interpretation.headline && (
          <p className={screen.lead}>{interpretation.headline}</p>
        )}
        <StoryText
          subSections={interpretation.overviewSubSections}
          content={interpretation.spoiler}
        />
        {interpretation.overviewOneLiner && (
          <SubtitleStill
            label={oneLinerLabel}
            text={interpretation.overviewOneLiner}
          />
        )}
      </section>

      {coreScenarios.length > 0 && (
        <>
          {renderActIntertitle("act2")}
          <section className={screen.section}>
            {coreScenarios.map((scenario, index) => (
              <DuoScene
                key={`${scenario.title}-${index}`}
                index={index}
                names={`${leadA.name} × ${leadB.name}`}
                scenario={scenario}
                oneLinerLabel={oneLinerLabel}
              />
            ))}
          </section>
        </>
      )}

      {renderActIntertitle("act3")}
      <RatingBoard
        id={COMPATIBILITY_RATING_ID}
        items={COMPATIBILITY_STORY_KEYS.map((key) => ({
          key,
          label: tC(`stories.${key}`),
          score: getStoryScore(subScores, key),
          review: categories[key].headline,
        }))}
      />
      {COMPATIBILITY_STORY_KEYS.map((key) => (
        <CategoryStory
          key={key}
          label={tC(`stories.${key}`)}
          score={getStoryScore(subScores, key)}
          headline={categories[key].headline}
          content={categories[key].content}
          subSections={categories[key].subSections}
          oneLiner={categories[key].oneLiner}
          tags={categories[key].tags}
        />
      ))}

      {renderActIntertitle("act4")}
      <section className={screen.section}>
        <StoryText
          subSections={interpretation.adviceSubSections}
          content={interpretation.advice}
        />
        {interpretation.adviceOneLiner && (
          <SubtitleStill
            label={oneLinerLabel}
            text={interpretation.adviceOneLiner}
          />
        )}
      </section>
    </>
  );
};
