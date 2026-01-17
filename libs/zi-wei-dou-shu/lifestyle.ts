/**
 * 라이프스타일 추천 시스템
 * - 럭키 컬러, 방향, 숫자
 * - 직업 적합도
 * - 궁합 좋은 띠
 */

import type { Locale } from "@/i18n/config";
import { defaultLocale } from "@/i18n/config";

import {
  CAREER_CATEGORIES as I18N_CAREER_CATEGORIES,
  CAREER_DESCRIPTIONS,
  COMPATIBILITY_REASONS,
  DIRECTION_NAMES,
  translateColor,
  translateZodiac,
} from "./i18n";
import type { ZiweiChart } from "./types";

// ============================================================
// 타입 정의
// ============================================================

export interface LifestyleRecommendation {
  /** 럭키 컬러 */
  luckyColors: {
    primary: string;
    secondary: string;
    hex: { primary: string; secondary: string };
  };
  /** 좋은 방향 */
  luckyDirection: {
    direction: string;
    emoji: string;
    description: string;
  };
  /** 행운의 숫자 */
  luckyNumbers: number[];
  /** 직업 적합도 */
  careerFit: CareerFitItem[];
  /** 궁합 좋은 띠 */
  compatibleSigns: CompatibleSign[];
  /** 피해야 할 띠 */
  incompatibleSigns: string[];
  /** 오행 밸런스 */
  elementBalance: ElementBalance;
}

export interface CareerFitItem {
  category: string;
  emoji: string;
  percentage: number;
  description: string;
}

export interface CompatibleSign {
  sign: string;
  emoji: string;
  compatibility: number;
  reason: string;
}

export interface ElementBalance {
  water: number;
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  dominant: string;
  lacking: string;
}

// ============================================================
// 오행 매핑
// ============================================================

const STAR_ELEMENTS: Record<string, string> = {
  자미: "토",
  천기: "목",
  태양: "화",
  무곡: "금",
  천동: "수",
  염정: "화",
  천부: "토",
  태음: "수",
  탐랑: "수",
  거문: "수",
  천상: "수",
  천량: "목",
  칠살: "금",
  파군: "수",
};

const ELEMENT_COLORS: Record<string, { colors: string[]; hex: string[] }> = {
  수: { colors: ["검정", "파랑"], hex: ["#1a1a2e", "#0077b6"] },
  목: { colors: ["초록", "청록"], hex: ["#2d6a4f", "#40916c"] },
  화: { colors: ["빨강", "보라"], hex: ["#d62828", "#7b2cbf"] },
  토: { colors: ["노랑", "갈색"], hex: ["#fca311", "#bc6c25"] },
  금: { colors: ["흰색", "금색"], hex: ["#f8f9fa", "#ffd700"] },
};

const ELEMENT_DIRECTIONS: Record<string, { direction: string; emoji: string }> =
  {
    수: { direction: "북쪽", emoji: "⬆️" },
    목: { direction: "동쪽", emoji: "➡️" },
    화: { direction: "남쪽", emoji: "⬇️" },
    토: { direction: "중앙", emoji: "⏺️" },
    금: { direction: "서쪽", emoji: "⬅️" },
  };

const ELEMENT_NUMBERS: Record<string, number[]> = {
  수: [1, 6],
  목: [3, 8],
  화: [2, 7],
  토: [5, 10],
  금: [4, 9],
};

// ============================================================
// 띠 관련
// ============================================================

const ZODIAC_SIGNS = [
  { name: "쥐띠", emoji: "🐭", branch: 0 },
  { name: "소띠", emoji: "🐮", branch: 1 },
  { name: "호랑이띠", emoji: "🐯", branch: 2 },
  { name: "토끼띠", emoji: "🐰", branch: 3 },
  { name: "용띠", emoji: "🐲", branch: 4 },
  { name: "뱀띠", emoji: "🐍", branch: 5 },
  { name: "말띠", emoji: "🐴", branch: 6 },
  { name: "양띠", emoji: "🐑", branch: 7 },
  { name: "원숭이띠", emoji: "🐵", branch: 8 },
  { name: "닭띠", emoji: "🐔", branch: 9 },
  { name: "개띠", emoji: "🐕", branch: 10 },
  { name: "돼지띠", emoji: "🐷", branch: 11 },
];

// 삼합 (三合) - 서로 잘 맞는 관계
const SAMHAP: Record<number, number[]> = {
  0: [4, 8], // 쥐 - 용, 원숭이
  1: [5, 9], // 소 - 뱀, 닭
  2: [6, 10], // 호랑이 - 말, 개
  3: [7, 11], // 토끼 - 양, 돼지
  4: [0, 8], // 용 - 쥐, 원숭이
  5: [1, 9], // 뱀 - 소, 닭
  6: [2, 10], // 말 - 호랑이, 개
  7: [3, 11], // 양 - 토끼, 돼지
  8: [0, 4], // 원숭이 - 쥐, 용
  9: [1, 5], // 닭 - 소, 뱀
  10: [2, 6], // 개 - 호랑이, 말
  11: [3, 7], // 돼지 - 토끼, 양
};

// 육충 (六冲) - 상극 관계
const YUKCHUNG: Record<number, number> = {
  0: 6, // 쥐 - 말
  1: 7, // 소 - 양
  2: 8, // 호랑이 - 원숭이
  3: 9, // 토끼 - 닭
  4: 10, // 용 - 개
  5: 11, // 뱀 - 돼지
  6: 0,
  7: 1,
  8: 2,
  9: 3,
  10: 4,
  11: 5,
};

// ============================================================
// 직업 분류
// ============================================================

interface CareerCategory {
  name: string;
  emoji: string;
  relatedStars: string[];
  relatedPalaces: string[];
}

const CAREER_CATEGORIES: CareerCategory[] = [
  {
    name: "경영/리더십",
    emoji: "👔",
    relatedStars: ["자미", "천부", "칠살", "파군"],
    relatedPalaces: ["관록궁"],
  },
  {
    name: "금융/투자",
    emoji: "💹",
    relatedStars: ["무곡", "천부", "태음"],
    relatedPalaces: ["재백궁"],
  },
  {
    name: "IT/기술",
    emoji: "💻",
    relatedStars: ["천기", "천량", "거문"],
    relatedPalaces: ["관록궁", "명궁"],
  },
  {
    name: "예술/창작",
    emoji: "🎨",
    relatedStars: ["탐랑", "태음", "천동"],
    relatedPalaces: ["자녀궁", "복덕궁"],
  },
  {
    name: "교육/상담",
    emoji: "📚",
    relatedStars: ["천량", "천기", "거문"],
    relatedPalaces: ["부모궁", "복덕궁"],
  },
  {
    name: "영업/마케팅",
    emoji: "📢",
    relatedStars: ["탐랑", "거문", "태양"],
    relatedPalaces: ["교우궁", "천이궁"],
  },
  {
    name: "의료/건강",
    emoji: "🏥",
    relatedStars: ["천량", "천동", "태음"],
    relatedPalaces: ["질액궁"],
  },
  {
    name: "공무원/공공",
    emoji: "🏛️",
    relatedStars: ["태양", "천상", "자미"],
    relatedPalaces: ["관록궁", "부모궁"],
  },
];

// ============================================================
// 계산 함수
// ============================================================

/**
 * 명반에서 오행 밸런스 계산
 */
const calculateElementBalance = (chart: ZiweiChart): ElementBalance => {
  const elements: Record<string, number> = {
    수: 0,
    목: 0,
    화: 0,
    토: 0,
    금: 0,
  };

  // 모든 궁의 주성을 순회하며 오행 점수 합산
  for (const palace of chart.palaces) {
    for (const star of palace.mainStars) {
      const element = STAR_ELEMENTS[star.name];
      if (element) {
        // 밝기에 따른 가중치
        const brightnessWeight: Record<string, number> = {
          묘: 3,
          왕: 2.5,
          득: 2,
          리: 1.5,
          평: 1,
          함: 0.5,
        };
        elements[element] += brightnessWeight[star.brightness] || 1;
      }
    }
  }

  // 정규화 (총합 대비 비율) - 0으로 나누기 방지
  const total = Object.values(elements).reduce((a, b) => a + b, 0);
  const safeTotal = total > 0 ? total : 1;
  const normalized = {
    water: Math.round((elements["수"] / safeTotal) * 100),
    wood: Math.round((elements["목"] / safeTotal) * 100),
    fire: Math.round((elements["화"] / safeTotal) * 100),
    earth: Math.round((elements["토"] / safeTotal) * 100),
    metal: Math.round((elements["금"] / safeTotal) * 100),
  };

  // 가장 강한/약한 오행 찾기
  const sortedElements = Object.entries(elements).sort((a, b) => b[1] - a[1]);
  const dominant = sortedElements[0]?.[0] ?? "토";
  const lacking = sortedElements[sortedElements.length - 1]?.[0] ?? "수";

  return {
    ...normalized,
    dominant,
    lacking,
  };
};

/**
 * 럭키 컬러 계산 (부족한 오행 보완)
 */
const calculateLuckyColors = (
  elementBalance: ElementBalance,
  locale: Locale = defaultLocale
): LifestyleRecommendation["luckyColors"] => {
  const { lacking } = elementBalance;
  const colors = ELEMENT_COLORS[lacking] || ELEMENT_COLORS["토"];

  return {
    primary: translateColor(colors.colors[0], locale),
    secondary: translateColor(colors.colors[1], locale),
    hex: {
      primary: colors.hex[0],
      secondary: colors.hex[1],
    },
  };
};

/**
 * 좋은 방향 계산 (부족한 오행 방향)
 */
const calculateLuckyDirection = (
  elementBalance: ElementBalance,
  locale: Locale = defaultLocale
): LifestyleRecommendation["luckyDirection"] => {
  const { lacking } = elementBalance;
  const directionKo = ELEMENT_DIRECTIONS[lacking] || ELEMENT_DIRECTIONS["토"];
  const translated =
    DIRECTION_NAMES[locale]?.[directionKo.direction] ||
    DIRECTION_NAMES.ko[directionKo.direction];

  return {
    direction: translated.direction,
    emoji: directionKo.emoji,
    description: translated.description,
  };
};

/**
 * 행운의 숫자 계산
 */
const calculateLuckyNumbers = (elementBalance: ElementBalance): number[] => {
  const { lacking, dominant } = elementBalance;
  const lackingNumbers = ELEMENT_NUMBERS[lacking] || [];
  const dominantNumbers = ELEMENT_NUMBERS[dominant] || [];

  // 부족한 오행 숫자 + 강한 오행 숫자 조합
  return [...new Set([...lackingNumbers, ...dominantNumbers])].slice(0, 4);
};

/**
 * 직업 적합도 계산
 */
const calculateCareerFit = (
  chart: ZiweiChart,
  locale: Locale = defaultLocale
): CareerFitItem[] => {
  const results: CareerFitItem[] = [];
  const localizedCategories =
    I18N_CAREER_CATEGORIES[locale] || I18N_CAREER_CATEGORIES.ko;

  for (let i = 0; i < CAREER_CATEGORIES.length; i++) {
    const category = CAREER_CATEGORIES[i];
    const localizedCategory = localizedCategories[i];
    let score = 50; // 기본 점수

    // 관련 궁의 주성 확인
    for (const palaceName of category.relatedPalaces) {
      const palace = chart.palaces.find((p) => p.name === palaceName);
      if (palace) {
        for (const star of palace.mainStars) {
          if (category.relatedStars.includes(star.name)) {
            // 밝기에 따른 점수
            const brightnessScore: Record<string, number> = {
              묘: 20,
              왕: 15,
              득: 10,
              리: 5,
              평: 0,
              함: -5,
            };
            score += brightnessScore[star.brightness] || 0;

            // 사화 보너스
            if (star.sihua === "화록" || star.sihua === "화권") score += 10;
            if (star.sihua === "화기") score -= 5;
          }
        }
      }
    }

    // 명궁의 관련 주성 확인
    const mingGongPalace = chart.palaces.find((p) => p.name === "명궁");
    if (mingGongPalace) {
      for (const star of mingGongPalace.mainStars) {
        if (category.relatedStars.includes(star.name)) {
          score += 15;
        }
      }
    }

    // 점수 범위 조정 (30-98)
    score = Math.max(30, Math.min(98, score));

    results.push({
      category: localizedCategory?.name ?? category.name,
      emoji: category.emoji,
      percentage: score,
      description: getCareerDescription(score, locale),
    });
  }

  // 점수 순으로 정렬
  return results.sort((a, b) => b.percentage - a.percentage);
};

/**
 * 직업 적합도 설명 생성
 */
const getCareerDescription = (
  score: number,
  locale: Locale = defaultLocale
): string => {
  const descriptions = CAREER_DESCRIPTIONS[locale] || CAREER_DESCRIPTIONS.ko;
  if (score >= 85) return descriptions.excellent;
  if (score >= 70) return descriptions.good;
  if (score >= 55) return descriptions.average;
  return descriptions.poor;
};

/**
 * 궁합 계산 (결정적)
 */
const calculateCompatibility = (
  chart: ZiweiChart,
  locale: Locale = defaultLocale
): CompatibleSign[] => {
  const userBranch = chart.lunarDate.yearBranch;
  const compatible: CompatibleSign[] = [];
  const reasons = COMPATIBILITY_REASONS[locale] || COMPATIBILITY_REASONS.ko;

  // 삼합 관계 - 점수는 지지 인덱스 기반으로 결정적 계산
  const samhapBranches = SAMHAP[userBranch] || [];
  samhapBranches.forEach((branch) => {
    const sign = ZODIAC_SIGNS[branch];
    // 결정적 점수: 기본 92 + (userBranch + branch) % 6
    const baseScore = 92 + ((userBranch + branch) % 6);
    compatible.push({
      sign: translateZodiac(branch, locale),
      emoji: sign.emoji,
      compatibility: baseScore,
      reason: reasons.samhap,
    });
  });

  // 육합 관계 (자축, 인해, 묘술, 진유, 사신, 오미)
  const yukhapPairs: [number, number][] = [
    [0, 1],
    [2, 11],
    [3, 10],
    [4, 9],
    [5, 8],
    [6, 7],
  ];
  for (const [a, b] of yukhapPairs) {
    if (userBranch === a || userBranch === b) {
      const partnerBranch = userBranch === a ? b : a;
      const sign = ZODIAC_SIGNS[partnerBranch];
      // 결정적 점수: 기본 88 + (a + b) % 8
      const baseScore = 88 + ((a + b) % 8);
      compatible.push({
        sign: translateZodiac(partnerBranch, locale),
        emoji: sign.emoji,
        compatibility: baseScore,
        reason: reasons.yukhap,
      });
    }
  }

  return compatible.sort((a, b) => b.compatibility - a.compatibility);
};

/**
 * 상극 띠 계산
 */
const calculateIncompatible = (
  chart: ZiweiChart,
  locale: Locale = defaultLocale
): string[] => {
  const userBranch = chart.lunarDate.yearBranch;
  const incompatibleBranch = YUKCHUNG[userBranch];
  const sign = ZODIAC_SIGNS[incompatibleBranch];
  return [`${sign.emoji} ${translateZodiac(incompatibleBranch, locale)}`];
};

// ============================================================
// 메인 함수
// ============================================================

/**
 * 라이프스타일 추천 생성
 */
export const generateLifestyleRecommendation = (
  chart: ZiweiChart,
  locale: Locale = defaultLocale
): LifestyleRecommendation => {
  const elementBalance = calculateElementBalance(chart);

  return {
    luckyColors: calculateLuckyColors(elementBalance, locale),
    luckyDirection: calculateLuckyDirection(elementBalance, locale),
    luckyNumbers: calculateLuckyNumbers(elementBalance),
    careerFit: calculateCareerFit(chart, locale),
    compatibleSigns: calculateCompatibility(chart, locale),
    incompatibleSigns: calculateIncompatible(chart, locale),
    elementBalance,
  };
};
