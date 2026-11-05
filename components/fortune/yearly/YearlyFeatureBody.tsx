"use client";

import { useTranslations } from "next-intl";
import { useMemo, type ReactNode } from "react";

import { MarkdownContent } from "@/components/fortune";
import { ActIntertitle } from "@/components/fortune/screen/ActIntertitle";
import { CategoryStory } from "@/components/fortune/screen/CategoryStory";
import { ChartConstellation } from "@/components/fortune/screen/ChartConstellation";
import {
  MonthLens,
  toMonthSceneId,
} from "@/components/fortune/screen/MonthLens";
import { NowShowing } from "@/components/fortune/screen/NowShowing";
import { NumberedSections } from "@/components/fortune/screen/NumberedSections";
import { RatingBoard } from "@/components/fortune/screen/RatingBoard";
import type { RatingItem } from "@/components/fortune/screen/RatingBoard";
import { ScreenPlayer } from "@/components/fortune/screen/ScreenPlayer";
import type { PlayerScene } from "@/components/fortune/screen/ScreenPlayer";
import { SubtitleStill } from "@/components/fortune/screen/SubtitleStill";
import { YearFlowSection } from "@/components/fortune/screen/YearFlowSection";
import { YearMemo } from "@/components/fortune/screen/YearMemo";
import screen from "@/components/fortune/screen/screen.module.css";
import type {
  FortuneSceneId,
  FortuneScreenType,
  FortuneSurface,
} from "@/libs/analytics/fortune";
import type { CategoryKey } from "@/libs/fortune/lifetime-screen";
import { useScreenCast } from "@/libs/fortune/use-screen-cast";
import type {
  MonthLens as MonthLensState,
  YearFlow,
} from "@/libs/fortune/yearly-screen";
import type { YearlyFortuneInterpretation } from "@/libs/services/ai/types";
import type {
  YearlyInsights,
  YearlySihua,
} from "@/libs/zi-wei-dou-shu/calculators";
import type { ZiweiChart } from "@/libs/zi-wei-dou-shu/types";

import styles from "./YearlyFortuneView.module.css";

export const YEARLY_CATEGORY_KEYS: CategoryKey[] = [
  "wealth",
  "career",
  "relationship",
  "health",
];

const ACT_IDS = ["act1", "act2", "act3", "act4"] as const;

interface YearlyFeatureBodyProps {
  name: string;
  year: number;
  interpretation: YearlyFortuneInterpretation;
  rawChart: ZiweiChart;
  wuxingJu: string;
  yearlySihua: YearlySihua;
  flow: YearFlow;
  lens: MonthLensState;
  insights: YearlyInsights | null;
  fortuneType: FortuneScreenType;
  surface: FortuneSurface;
  /** 지금 상영 중 위의 배지 (공유: 친구가 보낸 본편) */
  badge?: string;
  /** 캐릭터 포스터 자리 */
  cast: ReactNode;
  /** 막 뒤에 붙어 도달만 기록할 장면 (next · end) */
  extraSceneIds: FortuneSceneId[];
  /** 공유 페이지는 명반 칸 설명을 열지 않는다 */
  interactiveChart?: boolean;
}

/**
 * 올해·내년 운세 본편과 공유 페이지가 함께 쓰는 막 구성 (기획서 §10).
 * 지금 상영 중 → 상영 컨트롤 바 → 캐릭터 포스터 → 올해의 흐름 → 명반 → 올해의 메모 → ACT 1~4
 */
export const YearlyFeatureBody = ({
  name,
  year,
  interpretation,
  rawChart,
  wuxingJu,
  yearlySihua,
  flow,
  lens,
  insights,
  fortuneType,
  surface,
  badge,
  cast,
  extraSceneIds,
  interactiveChart = true,
}: YearlyFeatureBodyProps) => {
  const t = useTranslations("fortune.screen");
  const tY = useTranslations("fortune.screen.yearly");
  const tYearly = useTranslations("fortune.yearly");
  const tCommon = useTranslations("fortune.common");
  const constellation = useScreenCast(rawChart);
  const { overview, coreScenario, categories, monthlyFortunes } =
    interpretation;
  /** 내년 운세를 올해 볼 때 "올해" 대신 "2027년" */
  const when = lens.mode === "upcoming" ? "upcoming" : "current";

  const scenes = useMemo<PlayerScene[]>(
    () =>
      ACT_IDS.map((id, index) => ({
        id,
        act: `ACT ${index + 1}`,
        title: tY(`acts.${id}.title`, { year, when }),
        sub: tY(`acts.${id}.sub`, { year }),
      })),
    [tY, year, when]
  );

  const focusScenario = monthlyFortunes.find(
    (item) => item.month === lens.focusMonth
  );
  const hasMonths = monthlyFortunes.length > 0;
  const nowTargetId = hasMonths ? toMonthSceneId(lens.focusMonth) : "act4";
  const oneLinerLabel = tCommon("oneLinerLabel");

  const ratingItems: RatingItem[] = YEARLY_CATEGORY_KEYS.map((key) => ({
    key,
    label: tYearly(`categories.${key}`),
    score: categories[key].score ?? 0,
    review: categories[key].headline,
  }));

  const renderActIntertitle = (id: (typeof ACT_IDS)[number]) => (
    <ActIntertitle
      id={id}
      act={`ACT ${ACT_IDS.indexOf(id) + 1}`}
      title={tY(`acts.${id}.title`, { year, when })}
      sub={tY(`acts.${id}.sub`, { year })}
    />
  );

  return (
    <>
      <div className={styles.bleed}>
        <NowShowing
          name={name}
          year={year}
          lens={lens}
          flow={flow}
          monthHeadline={focusScenario?.headline}
          badge={badge}
          targetId={nowTargetId}
          fortuneType={fortuneType}
          surface={surface}
        />
      </div>

      <ScreenPlayer
        scenes={scenes}
        age={0}
        nowLabel={tY(`player.now.${lens.mode}`, { month: lens.focusMonth })}
        nowTargetId={nowTargetId}
        extraSceneIds={extraSceneIds}
        surface={surface}
        fortuneType={fortuneType}
      />

      <section className={screen.section}>
        <p className={screen.eyebrow}>CAST</p>
        <h2 className={screen.sectionTitle}>
          {tY("cast.title", { year, when })}
        </h2>
        {cast}
      </section>

      <YearFlowSection flow={flow} lens={lens} year={year} />

      <section className={screen.section}>
        <p className={screen.eyebrow}>ORIGINAL</p>
        <h2 className={screen.sectionTitle}>{t("chart.title")}</h2>
        <p className={screen.sectionDesc}>
          {interactiveChart ? tY("chart.featureDesc") : tY("chart.shareDesc")}
        </p>
        <ChartConstellation
          chart={rawChart}
          profileName={name}
          wuxingJu={wuxingJu}
          stars={constellation.stars}
          yearlySihua={yearlySihua}
          interactive={interactiveChart}
        />
      </section>

      {insights && <YearMemo insights={insights} year={year} when={when} />}

      {renderActIntertitle("act1")}
      <section className={screen.section}>
        <p className={screen.lead}>{overview.headline}</p>
        {overview.subSections && overview.subSections.length > 0 ? (
          <NumberedSections items={overview.subSections} />
        ) : (
          overview.summary && (
            <MarkdownContent className={screen.prose}>
              {overview.summary}
            </MarkdownContent>
          )
        )}
        {overview.oneLiner && (
          <SubtitleStill label={oneLinerLabel} text={overview.oneLiner} />
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
      {YEARLY_CATEGORY_KEYS.map((key) => (
        <CategoryStory
          key={key}
          label={tYearly(`categories.${key}`)}
          score={categories[key].score ?? 0}
          headline={categories[key].headline}
          content={categories[key].content}
          subSections={categories[key].subSections}
          oneLiner={categories[key].oneLiner}
          tags={categories[key].tags}
        />
      ))}

      {hasMonths && (
        <>
          {renderActIntertitle("act4")}
          <MonthLens
            months={monthlyFortunes}
            year={year}
            lens={lens}
            flow={flow}
            fortuneType={fortuneType}
            surface={surface}
          />
        </>
      )}
    </>
  );
};
