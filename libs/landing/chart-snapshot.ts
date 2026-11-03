import { generateZiweiChart } from "@/libs/zi-wei-dou-shu";
import {
  calculateDayun,
  extractKeywordsFromChart,
  extractOneLinerFromChart,
} from "@/libs/zi-wei-dou-shu/calculators";
import {
  translatePalaceName,
  translateStarName,
} from "@/libs/zi-wei-dou-shu/i18n";
import { buildPalaceExplanation } from "@/libs/zi-wei-dou-shu/palace-explanation";
import type { Locale } from "@/i18n/config";
import type { BranchIndex, Palace, ZiweiInput } from "@/libs/zi-wei-dou-shu";

/**
 * 랜딩 연출에 필요한 만큼만 추린 명반 요약.
 *
 * 랜딩의 예시 인물과 방문자가 직접 넣은 생년월일 모두 같은 형태로 만든다.
 * 해석 문장은 AI 없이 엔진의 정적 해석(palace-explanation)만 쓴다.
 * 명반 엔진이 클라이언트 번들에 들어가지 않도록 서버(페이지·API)에서만 호출한다.
 */

export interface ChartSnapshotCell {
  branch: BranchIndex;
  /** 엔진 내부 궁 이름(한국어). 특정 궁을 찾을 때 쓴다 */
  palaceKey: string;
  palaceName: string;
  mainStars: string[];
}

export interface ChartSnapshotFocus {
  palaceKey: string;
  branch: BranchIndex;
  title: string;
  meaning: string;
  /** 정적 해석의 첫 문장 */
  reading: string;
  stars: string[];
}

export interface ChartSnapshotFrame {
  startAge: number;
  endAge: number;
  /** 대운궁 엔진 이름(한국어). 장면 색을 정할 때 쓴다 */
  palaceKey: string;
  palaceName: string;
  /** 대운궁이 보는 삶의 영역 (예: 일과 사회적 성취) */
  theme: string;
  /** 대운궁의 주성. 비어 있으면 공궁 */
  stars: string[];
}

export interface ChartSnapshot {
  mingBranch: BranchIndex;
  cells: ChartSnapshotCell[];
  oneLiner: string | null;
  keywords: string[];
  focuses: ChartSnapshotFocus[];
  frames: ChartSnapshotFrame[];
}

/** 랜딩에서 차례로 비춰 줄 궁: 나 → 돈 → 일 → 연애 */
export const FOCUS_PALACE_KEYS = [
  "명궁",
  "재백궁",
  "관록궁",
  "부처궁",
] as const;

/** 영문·한글은 공백 앞의 마침표, 일본어는 공백 없는 「。」에서 끊는다 */
const firstSentence = (text: string): string => {
  const match = text.match(/^.+?(?:[.!?](?=\s|$)|。)/);
  return (match ? match[0] : text).trim();
};

const buildFocus = (
  palace: Palace,
  palaces: Palace[],
  locale: Locale
): ChartSnapshotFocus | null => {
  const explanation = buildPalaceExplanation(palace, palaces, locale);
  if (!explanation) {
    return null;
  }
  return {
    palaceKey: palace.name,
    branch: palace.branch,
    title: explanation.title,
    meaning: explanation.meaning,
    reading: firstSentence(explanation.reading),
    stars: explanation.stars.filter((star) => star.isMain).map((s) => s.name),
  };
};

export const buildChartSnapshot = (
  input: ZiweiInput,
  locale: Locale
): ChartSnapshot => {
  const chart = generateZiweiChart(input);
  const { palaces } = chart;
  const { periods } = calculateDayun(chart, 100, locale);

  return {
    mingBranch: chart.mingGong,
    cells: palaces.map((palace) => ({
      branch: palace.branch,
      palaceKey: palace.name,
      palaceName: translatePalaceName(palace.name, locale),
      mainStars: palace.mainStars.map((star) =>
        translateStarName(star.name, locale)
      ),
    })),
    oneLiner: extractOneLinerFromChart(chart, locale),
    keywords: extractKeywordsFromChart(chart, locale),
    focuses: FOCUS_PALACE_KEYS.flatMap((key) => {
      const palace = palaces.find((p) => p.name === key);
      const focus = palace ? buildFocus(palace, palaces, locale) : null;
      return focus ? [focus] : [];
    }),
    frames: periods.map((period) => {
      const explanation = buildPalaceExplanation(
        period.palace,
        palaces,
        locale
      );
      return {
        startAge: period.startAge,
        endAge: period.endAge,
        palaceKey: period.palace.name,
        palaceName: period.palaceName,
        theme: explanation?.title ?? "",
        stars: period.palace.mainStars.map((star) =>
          translateStarName(star.name, locale)
        ),
      };
    }),
  };
};
