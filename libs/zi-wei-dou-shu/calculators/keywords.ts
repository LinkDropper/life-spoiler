import type { Locale } from "@/i18n/config";

import { getStarBrightnessKeyword } from "../constants/keywords";
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
 */
const BRIGHTNESS_SCORE: Record<Brightness, number> = {
  묘: 100,
  왕: 85,
  득: 70,
  리: 50,
  평: 30,
  함: 10,
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
  score: number; // 총 영향력 점수
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
 * 명반에서 모든 주성+밝기 조합 수집 (점수 포함)
 */
const collectAllStarKeywords = (
  chart: ZiweiChart,
  locale: Locale
): StarKeywordInfo[] => {
  const results: StarKeywordInfo[] = [];

  // O(n) lookup을 위한 Map 생성
  const palaceMap = new Map(chart.palaces.map((p) => [p.name, p]));

  for (const palaceName of PALACE_PRIORITY) {
    const palace = palaceMap.get(palaceName);
    if (!palace) continue;

    for (const star of palace.mainStars) {
      const keyword = getStarBrightnessKeyword(
        star.name as MainStarName,
        star.brightness as Brightness,
        locale
      );

      if (keyword) {
        results.push({
          palaceName,
          starName: star.name,
          brightness: star.brightness,
          sihua: star.sihua,
          keyword,
          isPositive: POSITIVE_BRIGHTNESS.includes(star.brightness),
          score: calculateStarScore(star.brightness, star.sihua),
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
  // 긍정/부정 분리 후 점수 순 정렬 (높은 점수 우선, 원본 변경 방지)
  const positiveKeywords = allKeywords
    .filter((k) => k.isPositive)
    .sort((a, b) => b.score - a.score);

  const negativeKeywords = allKeywords
    .filter((k) => !k.isPositive)
    .sort((a, b) => b.score - a.score);

  // 중복 제거하면서 각각 4개씩 추출 (Set으로 O(1) 조회)
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

  // 긍정이 부족하면 부정에서 더 채우고, 부정이 부족하면 긍정에서 더 채움
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

  // 궁별 상세 정보 수집
  const palaceDetails: KeywordExtractionResult["palaceDetails"] = [];

  for (const palaceName of PALACE_PRIORITY) {
    const palace = palaceMap.get(palaceName);
    if (!palace) continue;

    const stars = palace.mainStars.map((star) => ({
      name: star.name,
      brightness: star.brightness,
      sihua: star.sihua,
      keyword: getStarBrightnessKeyword(
        star.name as MainStarName,
        star.brightness as Brightness,
        locale
      ),
      isPositive: POSITIVE_BRIGHTNESS.includes(star.brightness),
      score: calculateStarScore(star.brightness, star.sihua),
    }));

    palaceDetails.push({ palaceName, stars });
  }

  return {
    keywords: selectKeywords(allKeywords),
    palaceDetails,
  };
};
