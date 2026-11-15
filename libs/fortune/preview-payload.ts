import type {
  LifetimeFortuneData,
  PastLifeFortuneData,
  YearlyFortuneData,
} from "@/libs/supabase/fortune";

import { buildLockedQuestions } from "./lifetime-extras";
import type { LockedQuestion } from "./lifetime-extras";

/**
 * 결제 전(예고편) 응답에 실을 데이터.
 * 예고편 화면이 실제로 그리는 필드만 남기고, 유료 본편 내용은 서버에서 잘라낸다.
 * 화면에서만 가리면 개발자 도구로 본편 전체가 보이기 때문이다.
 */

export interface LifetimePreviewPayload {
  language?: LifetimeFortuneData["language"];
  chart: LifetimeFortuneData["chart"];
  rawChart: LifetimeFortuneData["rawChart"];
  interpretation: {
    lifeSpoiler: LifetimeFortuneData["interpretation"]["lifeSpoiler"];
    /** 본편에 답이 있는 질문 라벨. 연도·내용 없이 종류와 개수만 */
    lockedQuestions: LockedQuestion[];
  };
}

export const toLifetimePreview = (
  data: LifetimeFortuneData
): LifetimePreviewPayload => ({
  language: data.language,
  chart: data.chart,
  rawChart: data.rawChart,
  interpretation: {
    lifeSpoiler: data.interpretation.lifeSpoiler,
    lockedQuestions: buildLockedQuestions(data.interpretation),
  },
});

export interface YearlyPreviewPayload {
  language?: YearlyFortuneData["language"];
  year: number;
  chart: YearlyFortuneData["chart"];
  rawChart: YearlyFortuneData["rawChart"];
  yearlySihua: YearlyFortuneData["yearlySihua"];
  interpretation: {
    overview: YearlyFortuneData["interpretation"]["overview"];
  };
}

export const toYearlyPreview = (
  data: YearlyFortuneData
): YearlyPreviewPayload => ({
  language: data.language,
  year: data.year,
  chart: data.chart,
  rawChart: data.rawChart,
  yearlySihua: data.yearlySihua,
  interpretation: { overview: data.interpretation.overview },
});

type PastLifeInterpretation = PastLifeFortuneData["interpretation"];

export interface PastLifePreviewPayload {
  language?: PastLifeFortuneData["language"];
  chart: PastLifeFortuneData["chart"];
  rawChart: PastLifeFortuneData["rawChart"];
  interpretation: Pick<
    PastLifeInterpretation,
    "spoiler" | "world" | "imageUrl"
  >;
}

export const toPastLifePreview = (
  data: PastLifeFortuneData
): PastLifePreviewPayload => ({
  language: data.language,
  chart: data.chart,
  rawChart: data.rawChart,
  interpretation: {
    spoiler: data.interpretation.spoiler,
    world: data.interpretation.world,
    imageUrl: data.interpretation.imageUrl,
  },
});
