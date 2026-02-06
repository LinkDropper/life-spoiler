import type { Locale } from "@/i18n/config";

import type { MainStarName } from "./stars";

/**
 * 명궁 주성 기반 한줄 표현 (다국어 지원)
 *
 * @용도 프로필 카드 중앙에 표시되는 "이 사람을 표현하는 한마디"
 * @추출방식 명궁의 대표 주성 + 톤(긍정/부정)
 * @총개수 28개 (14개 주성 × 2가지 톤)
 * @컨셉 현대 풍자 (공감+유머, 비하 표현 제외)
 */

type Tone = "positive" | "negative";
type OneLinerKey = `${MainStarName}_${Tone}`;

interface OneLinerTranslations {
  ko: string;
  en: string;
  ja: string;
}

/**
 * 주성 × 톤 한줄 표현 맵 (다국어)
 */
export const MAIN_STAR_ONE_LINERS: Record<OneLinerKey, OneLinerTranslations> = {
  // ========================================
  // 자미 (황제성 - 리더십, 품격)
  // ========================================
  자미_positive: {
    ko: "타고난 분위기 장악러",
    en: "Born Atmosphere Controller",
    ja: "生まれながらの雰囲気メーカー",
  },
  자미_negative: {
    ko: "리더십은 넘치는데 팔로워 부족",
    en: "Leadership Overflow, Follower Shortage",
    ja: "リーダーシップは溢れるがフォロワー不足",
  },

  // ========================================
  // 천기 (지혜성 - 두뇌, 기획)
  // ========================================
  천기_positive: {
    ko: "걸어다니는 검색엔진",
    en: "Walking Search Engine",
    ja: "歩く検索エンジン",
  },
  천기_negative: {
    ko: "머릿속에서만 세계정복",
    en: "World Domination in Mind Only",
    ja: "頭の中だけで世界征服",
  },

  // ========================================
  // 태양 (광명성 - 명예, 활동)
  // ========================================
  태양_positive: {
    ko: "걸어다니는 도파민",
    en: "Walking Dopamine",
    ja: "歩くドーパミン",
  },
  태양_negative: {
    ko: "스포트라이트 영양결핍",
    en: "Spotlight Deficiency Syndrome",
    ja: "スポットライト栄養不足",
  },

  // ========================================
  // 무곡 (재성 - 재물, 실행력)
  // ========================================
  무곡_positive: {
    ko: "돈 냄새 맡는 금손",
    en: "Golden Hands That Smell Money",
    ja: "お金の匂いを嗅ぐゴールデンハンド",
  },
  무곡_negative: {
    ko: "돈과 스쳐가는 인연",
    en: "Passing Relationship with Money",
    ja: "お金とすれ違う縁",
  },

  // ========================================
  // 천동 (복성 - 행복, 여유)
  // ========================================
  천동_positive: {
    ko: "행복 바이러스 보균자",
    en: "Happiness Virus Carrier",
    ja: "幸せウイルス保菌者",
  },
  천동_negative: {
    ko: "평화주의 코알라",
    en: "Pacifist Koala",
    ja: "平和主義コアラ",
  },

  // ========================================
  // 염정 (정성 - 열정, 매력)
  // ========================================
  염정_positive: {
    ko: "심쿵 유발 전문가",
    en: "Heart Flutter Specialist",
    ja: "胸キュン誘発スペシャリスト",
  },
  염정_negative: {
    ko: "감정 롤러코스터 탑승객",
    en: "Emotional Rollercoaster Rider",
    ja: "感情ジェットコースター乗客",
  },

  // ========================================
  // 천부 (재고성 - 안정, 관리)
  // ========================================
  천부_positive: {
    ko: "재테크 본능 보유자",
    en: "Investment Instinct Owner",
    ja: "財テク本能の持ち主",
  },
  천부_negative: {
    ko: "지갑 열기 전 3초 고민러",
    en: "3-Second Hesitation Before Wallet",
    ja: "財布を開く前に3秒悩む人",
  },

  // ========================================
  // 태음 (음성 - 감성, 섬세)
  // ========================================
  태음_positive: {
    ko: "감성 충만 힐러",
    en: "Emotional Healer",
    ja: "感性満タンヒーラー",
  },
  태음_negative: {
    ko: "혼자만의 감성여행 중",
    en: "On a Solo Emotional Journey",
    ja: "一人だけの感性旅行中",
  },

  // ========================================
  // 탐랑 (욕망성 - 다재다능, 도화)
  // ========================================
  탐랑_positive: {
    ko: "재능 뿜뿜 멀티플레이어",
    en: "Multi-Talented Player",
    ja: "才能あふれるマルチプレイヤー",
  },
  탐랑_negative: {
    ko: "관심사 무한 확장팩",
    en: "Infinite Interest Expansion Pack",
    ja: "興味無限拡張パック",
  },

  // ========================================
  // 거문 (구설성 - 언변, 분석)
  // ========================================
  거문_positive: {
    ko: "AI 탑재 팩폭러",
    en: "AI-Powered Fact Bomber",
    ja: "AI搭載ファクト爆撃機",
  },
  거문_negative: {
    ko: "말 아끼는 관찰자",
    en: "Word-Saving Observer",
    ja: "言葉を惜しむ観察者",
  },

  // ========================================
  // 천상 (인덕성 - 봉사, 조력)
  // ========================================
  천상_positive: {
    ko: "인복 터진 인싸",
    en: "Socially Blessed Insider",
    ja: "人運爆発の陽キャ",
  },
  천상_negative: {
    ko: "호의가 습관이 된 사람",
    en: "Person Whose Kindness Became Habit",
    ja: "好意が習慣になった人",
  },

  // ========================================
  // 천량 (수복성 - 귀인, 건강)
  // ========================================
  천량_positive: {
    ko: "복 받은 럭키 바이브",
    en: "Blessed Lucky Vibe",
    ja: "福を受けたラッキーバイブ",
  },
  천량_negative: {
    ko: "운이 잠시 쉬어가는 중",
    en: "Luck Taking a Short Break",
    ja: "運がちょっと休憩中",
  },

  // ========================================
  // 칠살 (고독성 - 개척, 결단)
  // ========================================
  칠살_positive: {
    ko: "홀로서기의 달인",
    en: "Master of Standing Alone",
    ja: "一人立ちの達人",
  },
  칠살_negative: {
    ko: "사회성 절전 모드",
    en: "Social Skills Power-Saving Mode",
    ja: "社会性省エネモード",
  },

  // ========================================
  // 파군 (변동성 - 변화, 혁신)
  // ========================================
  파군_positive: {
    ko: "변화에 진심인 혁신가",
    en: "Innovator Serious About Change",
    ja: "変化に本気の革新家",
  },
  파군_negative: {
    ko: "새로운 게 좋아 증후군",
    en: "New-Things-Are-Better Syndrome",
    ja: "新しいもの好き症候群",
  },
};

/**
 * 긍정적 밝기 목록
 */
const POSITIVE_BRIGHTNESS = ["묘", "왕", "득"];

/**
 * 주성과 밝기로 톤 결정
 */
export const getToneFromBrightness = (brightness: string): Tone => {
  return POSITIVE_BRIGHTNESS.includes(brightness) ? "positive" : "negative";
};

/**
 * 주성과 톤으로 한줄 표현 조회 (다국어)
 */
export const getOneLiner = (
  star: MainStarName,
  tone: Tone,
  locale: Locale = "ko"
): string => {
  const key = `${star}_${tone}` as OneLinerKey;
  return MAIN_STAR_ONE_LINERS[key][locale];
};

/**
 * 한줄 표현 총 개수
 */
export const ONE_LINER_COUNT = Object.keys(MAIN_STAR_ONE_LINERS).length;
