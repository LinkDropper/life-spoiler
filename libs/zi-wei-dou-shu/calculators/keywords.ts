import type { Locale } from "@/i18n/config";

import { getStarBrightnessKeyword } from "../constants/keywords";
import { getOneLiner, getToneFromBrightness } from "../constants/one-liners";
import type { MainStarName } from "../constants/stars";
import type { Brightness, Sihua, ZiweiChart } from "../types";

/**
 * 키워드 추출 대상 궁 (우선순위 순서)
 */
const PALACE_PRIORITY = [
  "명궁",
  "재백궁",
  "관록궁",
  "부처궁",
  "형제궁",
  "자녀궁",
  "질액궁",
  "천이궁",
  "교우궁",
  "전택궁",
  "복덕궁",
  "부모궁",
] as const;

/**
 * 밝기 점수
 * @see constants/brightness-table.ts 와 동일한 점수 체계 사용
 */
const BRIGHTNESS_SCORE: Record<Brightness, number> = {
  묘: 100,
  왕: 80,
  득: 60,
  리: 40,
  평: 20,
  함: 0,
};

/**
 * 사화 보정 점수
 */
const SIHUA_SCORE: Record<Sihua, number> = {
  화록: 20,
  화권: 15,
  화과: 10,
  화기: -20,
};

/**
 * 긍정적 밝기 (묘/왕/득)
 */
const POSITIVE_BRIGHTNESS: Brightness[] = ["묘", "왕", "득"];

/**
 * 키워드 개수 설정
 */
const POSITIVE_COUNT = 4;
const NEGATIVE_COUNT = 4;
const MAX_KEYWORDS = POSITIVE_COUNT + NEGATIVE_COUNT;

interface StarKeywordInfo {
  palaceName: string;
  starName: string;
  brightness: Brightness;
  sihua?: Sihua;
  keyword: string;
  isPositive: boolean;
  score: number;
}

interface StarInfo {
  name: string;
  brightness: Brightness;
  sihua?: Sihua;
}

/**
 * 별의 총 영향력 점수 계산
 */
const calculateStarScore = (brightness: Brightness, sihua?: Sihua): number => {
  const brightnessScore = BRIGHTNESS_SCORE[brightness];
  const sihuaScore = sihua ? SIHUA_SCORE[sihua] : 0;
  return brightnessScore + sihuaScore;
};

/**
 * 별의 상세 정보 계산 (공통 헬퍼)
 */
const getStarDetails = (star: StarInfo, locale: Locale) => ({
  keyword: getStarBrightnessKeyword(
    star.name as MainStarName,
    star.brightness,
    locale
  ),
  isPositive: POSITIVE_BRIGHTNESS.includes(star.brightness),
  score: calculateStarScore(star.brightness, star.sihua),
});

/**
 * 명반에서 모든 주성+밝기 조합 수집 (점수 포함)
 */
const collectAllStarKeywords = (
  chart: ZiweiChart,
  locale: Locale
): StarKeywordInfo[] => {
  const results: StarKeywordInfo[] = [];
  const palaceMap = new Map(chart.palaces.map((p) => [p.name, p]));

  for (const palaceName of PALACE_PRIORITY) {
    const palace = palaceMap.get(palaceName);
    if (!palace) continue;

    for (const star of palace.mainStars) {
      const details = getStarDetails(star, locale);

      if (details.keyword) {
        results.push({
          palaceName,
          starName: star.name,
          brightness: star.brightness,
          sihua: star.sihua,
          keyword: details.keyword,
          isPositive: details.isPositive,
          score: details.score,
        });
      }
    }
  }

  return results;
};

/**
 * 키워드 추출 공통 로직
 */
const selectKeywords = (allKeywords: StarKeywordInfo[]): string[] => {
  const positiveKeywords = allKeywords
    .filter((k) => k.isPositive)
    .sort((a, b) => b.score - a.score);

  const negativeKeywords = allKeywords
    .filter((k) => !k.isPositive)
    .sort((a, b) => b.score - a.score);

  const selectedSet = new Set<string>();
  const selectedPositive: string[] = [];
  const selectedNegative: string[] = [];

  for (const k of positiveKeywords) {
    if (!selectedSet.has(k.keyword)) {
      selectedSet.add(k.keyword);
      selectedPositive.push(k.keyword);
    }
    if (selectedPositive.length >= POSITIVE_COUNT) break;
  }

  for (const k of negativeKeywords) {
    if (!selectedSet.has(k.keyword)) {
      selectedSet.add(k.keyword);
      selectedNegative.push(k.keyword);
    }
    if (selectedNegative.length >= NEGATIVE_COUNT) break;
  }

  const result = [...selectedPositive, ...selectedNegative];

  if (result.length < MAX_KEYWORDS) {
    const allSorted = [...allKeywords].sort((a, b) => b.score - a.score);
    for (const k of allSorted) {
      if (!selectedSet.has(k.keyword)) {
        selectedSet.add(k.keyword);
        result.push(k.keyword);
      }
      if (result.length >= MAX_KEYWORDS) break;
    }
  }

  return result.slice(0, MAX_KEYWORDS);
};

/**
 * 명반에서 키워드 8개 추출 (긍정 4개 + 부정 4개)
 *
 * @description
 * 별의 영향력 점수(밝기 + 사화) 순으로 정렬 후 추출
 * - 긍정 밝기(묘/왕/득): 점수 높은 순 4개
 * - 부정 밝기(리/평/함): 점수 높은 순 4개
 * - 같은 명반 → 항상 같은 키워드 (결정적)
 *
 * @param chart 자미두수 명반
 * @param locale 언어 (ko/en/ja)
 * @returns 키워드 배열 (8개)
 */
export const extractKeywordsFromChart = (
  chart: ZiweiChart,
  locale: Locale = "ko"
): string[] => {
  const allKeywords = collectAllStarKeywords(chart, locale);
  return selectKeywords(allKeywords);
};

/**
 * 키워드 추출 결과 타입
 */
export interface KeywordExtractionResult {
  keywords: string[];
  palaceDetails: Array<{
    palaceName: string;
    stars: Array<{
      name: string;
      brightness: string;
      sihua?: string;
      keyword: string | null;
      isPositive: boolean;
      score: number;
    }>;
  }>;
}

/**
 * 명반에서 키워드 추출 (상세 정보 포함)
 *
 * @description 디버깅/확인용 상세 결과 반환
 */
export const extractKeywordsWithDetails = (
  chart: ZiweiChart,
  locale: Locale = "ko"
): KeywordExtractionResult => {
  const allKeywords = collectAllStarKeywords(chart, locale);
  const palaceMap = new Map(chart.palaces.map((p) => [p.name, p]));

  const palaceDetails: KeywordExtractionResult["palaceDetails"] = [];

  for (const palaceName of PALACE_PRIORITY) {
    const palace = palaceMap.get(palaceName);
    if (!palace) continue;

    const stars = palace.mainStars.map((star) => {
      const details = getStarDetails(star, locale);
      return {
        name: star.name,
        brightness: star.brightness,
        sihua: star.sihua,
        keyword: details.keyword,
        isPositive: details.isPositive,
        score: details.score,
      };
    });

    palaceDetails.push({ palaceName, stars });
  }

  return {
    keywords: selectKeywords(allKeywords),
    palaceDetails,
  };
};

/**
 * 명반에서 한줄 표현 추출
 *
 * @description
 * 명궁의 대표 주성(영향력 점수가 가장 높은)과 톤(긍정/부정)을 기반으로
 * "이 사람을 표현하는 한마디"를 반환
 *
 * @param chart 자미두수 명반
 * @param locale 언어 (ko/en/ja)
 * @returns 한줄 표현 문자열
 */
export const extractOneLinerFromChart = (
  chart: ZiweiChart,
  locale: Locale = "ko"
): string | null => {
  // 명궁 찾기
  const mingGong = chart.palaces.find((p) => p.name === "명궁");
  if (!mingGong || mingGong.mainStars.length === 0) {
    return null;
  }

  // 명궁의 주성들 중 영향력 점수가 가장 높은 것 선택
  let topStar = mingGong.mainStars[0];
  let topScore = calculateStarScore(topStar.brightness, topStar.sihua);

  for (const star of mingGong.mainStars) {
    const score = calculateStarScore(star.brightness, star.sihua);
    if (score > topScore) {
      topStar = star;
      topScore = score;
    }
  }

  // 톤 결정 (밝기 기반)
  const tone = getToneFromBrightness(topStar.brightness);

  // 한줄 표현 반환
  return getOneLiner(topStar.name as MainStarName, tone, locale);
};
