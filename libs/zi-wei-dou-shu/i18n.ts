/**
 * 자미두수 계산 결과 다국어 지원
 */

import type { Locale } from "@/i18n/config";

// ============================================================
// 대운 방향
// ============================================================

export const DAYUN_DIRECTION: Record<
  Locale,
  { forward: string; backward: string }
> = {
  ko: { forward: "순행", backward: "역행" },
  en: { forward: "Forward", backward: "Backward" },
  ja: { forward: "順行", backward: "逆行" },
};

// ============================================================
// 궁 이름
// ============================================================

export const PALACE_NAMES: Record<Locale, Record<string, string>> = {
  ko: {
    명궁: "명궁",
    부모궁: "부모궁",
    복덕궁: "복덕궁",
    전택궁: "전택궁",
    관록궁: "관록궁",
    교우궁: "교우궁",
    천이궁: "천이궁",
    질액궁: "질액궁",
    재백궁: "재백궁",
    자녀궁: "자녀궁",
    부처궁: "부처궁",
    형제궁: "형제궁",
  },
  en: {
    명궁: "Life Palace",
    부모궁: "Parents Palace",
    복덕궁: "Fortune Palace",
    전택궁: "Property Palace",
    관록궁: "Career Palace",
    교우궁: "Friends Palace",
    천이궁: "Travel Palace",
    질액궁: "Health Palace",
    재백궁: "Wealth Palace",
    자녀궁: "Children Palace",
    부처궁: "Spouse Palace",
    형제궁: "Siblings Palace",
  },
  ja: {
    명궁: "命宮",
    부모궁: "父母宮",
    복덕궁: "福徳宮",
    전택궁: "田宅宮",
    관록궁: "官禄宮",
    교우궁: "交友宮",
    천이궁: "遷移宮",
    질액궁: "疾厄宮",
    재백궁: "財帛宮",
    자녀궁: "子女宮",
    부처궁: "夫妻宮",
    형제궁: "兄弟宮",
  },
};

// ============================================================
// 색상
// ============================================================

export const COLOR_NAMES: Record<Locale, Record<string, string>> = {
  ko: {
    검정: "검정",
    파랑: "파랑",
    초록: "초록",
    청록: "청록",
    빨강: "빨강",
    보라: "보라",
    노랑: "노랑",
    갈색: "갈색",
    흰색: "흰색",
    금색: "금색",
  },
  en: {
    검정: "Black",
    파랑: "Blue",
    초록: "Green",
    청록: "Teal",
    빨강: "Red",
    보라: "Purple",
    노랑: "Yellow",
    갈색: "Brown",
    흰색: "White",
    금색: "Gold",
  },
  ja: {
    검정: "黒",
    파랑: "青",
    초록: "緑",
    청록: "青緑",
    빨강: "赤",
    보라: "紫",
    노랑: "黄",
    갈색: "茶色",
    흰색: "白",
    금색: "金",
  },
};

// ============================================================
// 방향
// ============================================================

export const DIRECTION_NAMES: Record<
  Locale,
  Record<string, { direction: string; description: string }>
> = {
  ko: {
    북쪽: { direction: "북쪽", description: "물 기운을 보충하면 좋아요" },
    동쪽: { direction: "동쪽", description: "나무 기운을 보충하면 좋아요" },
    남쪽: { direction: "남쪽", description: "불 기운을 보충하면 좋아요" },
    중앙: { direction: "중앙", description: "흙 기운을 보충하면 좋아요" },
    서쪽: { direction: "서쪽", description: "금속 기운을 보충하면 좋아요" },
  },
  en: {
    북쪽: {
      direction: "North",
      description: "Boosting water energy is beneficial",
    },
    동쪽: {
      direction: "East",
      description: "Boosting wood energy is beneficial",
    },
    남쪽: {
      direction: "South",
      description: "Boosting fire energy is beneficial",
    },
    중앙: {
      direction: "Center",
      description: "Boosting earth energy is beneficial",
    },
    서쪽: {
      direction: "West",
      description: "Boosting metal energy is beneficial",
    },
  },
  ja: {
    북쪽: { direction: "北", description: "水のエネルギーを補うと良いです" },
    동쪽: { direction: "東", description: "木のエネルギーを補うと良いです" },
    남쪽: { direction: "南", description: "火のエネルギーを補うと良いです" },
    중앙: { direction: "中央", description: "土のエネルギーを補うと良いです" },
    서쪽: { direction: "西", description: "金のエネルギーを補うと良いです" },
  },
};

// ============================================================
// 띠 (Zodiac Signs)
// ============================================================

export const ZODIAC_NAMES: Record<Locale, string[]> = {
  ko: [
    "쥐띠",
    "소띠",
    "호랑이띠",
    "토끼띠",
    "용띠",
    "뱀띠",
    "말띠",
    "양띠",
    "원숭이띠",
    "닭띠",
    "개띠",
    "돼지띠",
  ],
  en: [
    "Rat",
    "Ox",
    "Tiger",
    "Rabbit",
    "Dragon",
    "Snake",
    "Horse",
    "Goat",
    "Monkey",
    "Rooster",
    "Dog",
    "Pig",
  ],
  ja: [
    "子年",
    "丑年",
    "寅年",
    "卯年",
    "辰年",
    "巳年",
    "午年",
    "未年",
    "申年",
    "酉年",
    "戌年",
    "亥年",
  ],
};

// ============================================================
// 직업 카테고리
// ============================================================

export const CAREER_CATEGORIES: Record<
  Locale,
  Array<{ name: string; relatedStars: string[]; relatedPalaces: string[] }>
> = {
  ko: [
    {
      name: "경영/리더십",
      relatedStars: ["자미", "천부", "칠살", "파군"],
      relatedPalaces: ["관록궁"],
    },
    {
      name: "금융/투자",
      relatedStars: ["무곡", "천부", "태음"],
      relatedPalaces: ["재백궁"],
    },
    {
      name: "IT/기술",
      relatedStars: ["천기", "천량", "거문"],
      relatedPalaces: ["관록궁", "명궁"],
    },
    {
      name: "예술/창작",
      relatedStars: ["탐랑", "태음", "천동"],
      relatedPalaces: ["자녀궁", "복덕궁"],
    },
    {
      name: "교육/상담",
      relatedStars: ["천량", "천기", "거문"],
      relatedPalaces: ["부모궁", "복덕궁"],
    },
    {
      name: "영업/마케팅",
      relatedStars: ["탐랑", "거문", "태양"],
      relatedPalaces: ["교우궁", "천이궁"],
    },
    {
      name: "의료/건강",
      relatedStars: ["천량", "천동", "태음"],
      relatedPalaces: ["질액궁"],
    },
    {
      name: "공무원/공공",
      relatedStars: ["태양", "천상", "자미"],
      relatedPalaces: ["관록궁", "부모궁"],
    },
  ],
  en: [
    {
      name: "Management/Leadership",
      relatedStars: ["자미", "천부", "칠살", "파군"],
      relatedPalaces: ["관록궁"],
    },
    {
      name: "Finance/Investment",
      relatedStars: ["무곡", "천부", "태음"],
      relatedPalaces: ["재백궁"],
    },
    {
      name: "IT/Technology",
      relatedStars: ["천기", "천량", "거문"],
      relatedPalaces: ["관록궁", "명궁"],
    },
    {
      name: "Art/Creative",
      relatedStars: ["탐랑", "태음", "천동"],
      relatedPalaces: ["자녀궁", "복덕궁"],
    },
    {
      name: "Education/Counseling",
      relatedStars: ["천량", "천기", "거문"],
      relatedPalaces: ["부모궁", "복덕궁"],
    },
    {
      name: "Sales/Marketing",
      relatedStars: ["탐랑", "거문", "태양"],
      relatedPalaces: ["교우궁", "천이궁"],
    },
    {
      name: "Healthcare",
      relatedStars: ["천량", "천동", "태음"],
      relatedPalaces: ["질액궁"],
    },
    {
      name: "Government/Public",
      relatedStars: ["태양", "천상", "자미"],
      relatedPalaces: ["관록궁", "부모궁"],
    },
  ],
  ja: [
    {
      name: "経営/リーダーシップ",
      relatedStars: ["자미", "천부", "칠살", "파군"],
      relatedPalaces: ["관록궁"],
    },
    {
      name: "金融/投資",
      relatedStars: ["무곡", "천부", "태음"],
      relatedPalaces: ["재백궁"],
    },
    {
      name: "IT/技術",
      relatedStars: ["천기", "천량", "거문"],
      relatedPalaces: ["관록궁", "명궁"],
    },
    {
      name: "芸術/創作",
      relatedStars: ["탐랑", "태음", "천동"],
      relatedPalaces: ["자녀궁", "복덕궁"],
    },
    {
      name: "教育/相談",
      relatedStars: ["천량", "천기", "거문"],
      relatedPalaces: ["부모궁", "복덕궁"],
    },
    {
      name: "営業/マーケティング",
      relatedStars: ["탐랑", "거문", "태양"],
      relatedPalaces: ["교우궁", "천이궁"],
    },
    {
      name: "医療/健康",
      relatedStars: ["천량", "천동", "태음"],
      relatedPalaces: ["질액궁"],
    },
    {
      name: "公務員/公共",
      relatedStars: ["태양", "천상", "자미"],
      relatedPalaces: ["관록궁", "부모궁"],
    },
  ],
};

// ============================================================
// 직업 적합도 설명
// ============================================================

export const CAREER_DESCRIPTIONS: Record<
  Locale,
  { excellent: string; good: string; average: string; poor: string }
> = {
  ko: {
    excellent: "천직이에요! 이 분야에서 빛날 수 있어요",
    good: "잘 맞아요! 충분히 성공 가능해요",
    average: "괜찮아요. 노력하면 잘 할 수 있어요",
    poor: "다른 분야가 더 맞을 수 있어요",
  },
  en: {
    excellent: "This is your calling! You can shine in this field",
    good: "Great fit! You can definitely succeed",
    average: "Not bad. With effort, you can do well",
    poor: "Other fields might suit you better",
  },
  ja: {
    excellent: "天職です!この分野で輝けます",
    good: "相性抜群!十分成功できます",
    average: "悪くないです。努力すればうまくいきます",
    poor: "他の分野がもっと合うかもしれません",
  },
};

// ============================================================
// 궁합 설명
// ============================================================

export const COMPATIBILITY_REASONS: Record<
  Locale,
  { samhap: string; yukhap: string }
> = {
  ko: {
    samhap: "삼합 관계로 서로 잘 통해요",
    yukhap: "육합 관계로 찰떡궁합이에요",
  },
  en: {
    samhap: "Trinity harmony - great mutual understanding",
    yukhap: "Six harmony - perfect match",
  },
  ja: {
    samhap: "三合の関係で相性抜群です",
    yukhap: "六合の関係で相性ぴったりです",
  },
};

// ============================================================
// 오행 이름
// ============================================================

export const ELEMENT_NAMES: Record<Locale, Record<string, string>> = {
  ko: {
    수: "물",
    목: "나무",
    화: "불",
    토: "흙",
    금: "금속",
  },
  en: {
    수: "Water",
    목: "Wood",
    화: "Fire",
    토: "Earth",
    금: "Metal",
  },
  ja: {
    수: "水",
    목: "木",
    화: "火",
    토: "土",
    금: "金",
  },
};

// ============================================================
// 헬퍼 함수
// ============================================================

/**
 * 궁 이름 번역
 */
export const translatePalaceName = (
  palaceName: string,
  locale: Locale
): string => {
  return PALACE_NAMES[locale]?.[palaceName] ?? palaceName;
};

/**
 * 색상 번역
 */
export const translateColor = (color: string, locale: Locale): string => {
  return COLOR_NAMES[locale]?.[color] ?? color;
};

/**
 * 띠 이름 번역
 */
export const translateZodiac = (index: number, locale: Locale): string => {
  return ZODIAC_NAMES[locale]?.[index] ?? ZODIAC_NAMES.ko[index];
};

/**
 * 대운 방향 번역
 */
export const translateDayunDirection = (
  direction: "순행" | "역행",
  locale: Locale
): string => {
  const key = direction === "순행" ? "forward" : "backward";
  return DAYUN_DIRECTION[locale]?.[key] ?? direction;
};
