"use client";

import { useTranslations } from "next-intl";
import { useMemo, type ReactNode } from "react";

import { MarkdownContent } from "@/components/fortune";
import { ActIntertitle } from "@/components/fortune/screen/ActIntertitle";
import { ChartConstellation } from "@/components/fortune/screen/ChartConstellation";
import { NumberedSections } from "@/components/fortune/screen/NumberedSections";
import {
  CharacterNote,
  Chronicle,
  Epilogue,
  Foreshadow,
  LastWords,
  PrequelContrast,
  WorldNotes,
} from "@/components/fortune/screen/PastLifeSections";
import { ScreenPlayer } from "@/components/fortune/screen/ScreenPlayer";
import type { PlayerScene } from "@/components/fortune/screen/ScreenPlayer";
import { SubtitleStill } from "@/components/fortune/screen/SubtitleStill";
import screen from "@/components/fortune/screen/screen.module.css";
import type { FortuneSceneId, FortuneSurface } from "@/libs/analytics/fortune";
import { useScreenCast } from "@/libs/fortune/use-screen-cast";
import type {
  PastLifeFortuneInterpretation,
  SubSection,
} from "@/libs/services/ai/types";
import type { ZiweiChart } from "@/libs/zi-wei-dou-shu/types";

const ACT_IDS = ["act1", "act2", "act3", "act4"] as const;

interface PastLifeFeatureBodyProps {
  name: string;
  interpretation: PastLifeFortuneInterpretation;
  rawChart: ZiweiChart;
  wuxingJu: string;
  surface: FortuneSurface;
  /** 맨 위 캐릭터 포스터 자리 (본편: 공유 버튼 포함, 공유 페이지: 배지만) */
  poster: ReactNode;
  extraSceneIds: FortuneSceneId[];
  interactiveChart?: boolean;
}

interface StoryBlock {
  headline: string;
  content?: string;
  subSections?: SubSection[];
  oneLiner?: string;
}

/**
 * 전생 본편과 공유 페이지가 함께 쓰는 막 구성 (기획서 §12).
 * 캐릭터 포스터 → 컨트롤 바 → 세계관 → 배역 노트 → 명반 → ACT 1 탄생 → ACT 2 여정(연대기)
 * → ACT 3 마지막 장면(마지막 대사) → ACT 4 인연 → 전편 vs 본편 → 복선 → 에필로그
 */
export const PastLifeFeatureBody = ({
  name,
  interpretation,
  rawChart,
  wuxingJu,
  surface,
  poster,
  extraSceneIds,
  interactiveChart = true,
}: PastLifeFeatureBodyProps) => {
  const t = useTranslations("fortune.screen");
  const tP = useTranslations("fortune.screen.pastLife");
  const tCommon = useTranslations("fortune.common");
  const cast = useScreenCast(rawChart);
  const { birth, journey, end, connections, contrast, traces, lessons } =
    interpretation;
  const oneLinerLabel = tCommon("oneLinerLabel");

  const scenes = useMemo<PlayerScene[]>(
    () =>
      ACT_IDS.map((id, index) => ({
        id,
        act: `ACT ${index + 1}`,
        title: tP(`acts.${id}.title`),
        sub: tP(`acts.${id}.sub`),
      })),
    [tP]
  );

  const renderStory = (block: StoryBlock, extra?: ReactNode) => (
    <section className={screen.section}>
      {block.headline && <p className={screen.lead}>{block.headline}</p>}
      {extra}
      {block.subSections && block.subSections.length > 0 ? (
        <NumberedSections items={block.subSections} />
      ) : (
        block.content && (
          <MarkdownContent className={screen.prose}>
            {block.content}
          </MarkdownContent>
        )
      )}
      {block.oneLiner && (
        <SubtitleStill label={oneLinerLabel} text={block.oneLiner} />
      )}
    </section>
  );

  const renderActIntertitle = (id: (typeof ACT_IDS)[number]) => (
    <ActIntertitle
      id={id}
      act={`ACT ${ACT_IDS.indexOf(id) + 1}`}
      title={tP(`acts.${id}.title`)}
      sub={tP(`acts.${id}.sub`)}
    />
  );

  return (
    <>
      {poster}

      <ScreenPlayer
        scenes={scenes}
        age={0}
        nowLabel={tP("player.lastWords")}
        nowTargetId="last-words"
        extraSceneIds={extraSceneIds}
        surface={surface}
        fortuneType="past_life"
      />

      <WorldNotes world={interpretation.world} />
      {interpretation.stats?.stats?.length > 0 && (
        <CharacterNote stats={interpretation.stats} />
      )}

      <section className={screen.section}>
        <p className={screen.eyebrow}>ORIGINAL</p>
        <h2 className={screen.sectionTitle}>{t("chart.title")}</h2>
        <p className={screen.sectionDesc}>
          {interactiveChart ? t("chart.featureDesc") : tP("chart.shareDesc")}
        </p>
        <ChartConstellation
          chart={rawChart}
          profileName={name}
          wuxingJu={wuxingJu}
          stars={cast.stars}
          interactive={interactiveChart}
        />
      </section>

      {renderActIntertitle("act1")}
      {renderStory(birth)}

      {renderActIntertitle("act2")}
      {renderStory(
        journey,
        journey.events?.length > 0 ? (
          <Chronicle events={journey.events} />
        ) : null
      )}

      {renderActIntertitle("act3")}
      <section className={screen.section}>
        {end.headline && <p className={screen.lead}>{end.headline}</p>}
        {end.subSections && end.subSections.length > 0 ? (
          <NumberedSections items={end.subSections} />
        ) : (
          end.content && (
            <MarkdownContent className={screen.prose}>
              {end.content}
            </MarkdownContent>
          )
        )}
        {end.lastWords && (
          <div id="last-words" className={screen.lastWordsAnchor}>
            <LastWords
              text={end.lastWords}
              imageUrl={interpretation.imageUrl}
            />
          </div>
        )}
        {end.oneLiner && (
          <SubtitleStill label={oneLinerLabel} text={end.oneLiner} />
        )}
      </section>

      {renderActIntertitle("act4")}
      {renderStory(connections)}

      {contrast?.contrasts?.length > 0 && (
        <PrequelContrast contrasts={contrast.contrasts} />
      )}
      {traces?.traces?.length > 0 && <Foreshadow traces={traces.traces} />}
      {lessons?.lessons?.length > 0 && <Epilogue lessons={lessons.lessons} />}
    </>
  );
};
