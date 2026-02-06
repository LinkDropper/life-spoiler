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
    // 황제의 품격 -> 타고난 그릇이 큼
    ko: "태생부터 남다른 귀족 DNA",
    en: "Noble DNA from Birth",
    ja: "生まれつき格別な貴族DNA",
  },
  자미_negative: {
    // 황제가 힘이 없음 -> 허세, 고집, 독단
    ko: "자존심만 쎈 방구석 황제",
    en: "Corner Room Emperor with Only Pride",
    ja: "プライドだけ高い井の中の皇帝",
  },

  // ========================================
  // 천기 (지혜성 - 두뇌, 기획)
  // ========================================
  천기_positive: {
    // 뛰어난 참모 -> 전략가, 두뇌 회전
    ko: "인생을 공략하는 전략가",
    en: "Strategist Conquering Life",
    ja: "人生を攻略する戦略家",
  },
  천기_negative: {
    // 생각이 너무 많음 -> 예민, 실천 부족
    ko: "실행력 0%의 망상 시뮬레이터",
    en: "Delusion Simulator with 0% Action",
    ja: "実行力0%の妄想シミュレーター",
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
    // 안주함 -> 의지 박약, 감정 기복
    ko: "징징거림이 특기인 어른이",
    en: "Man-child Specialized in Whining",
    ja: "駄々こねが特技の大人子供",
  },

  // ========================================
  // 염정 (정성 - 열정, 매력)
  // ========================================
  염정_positive: {
    // 뛰어난 수완 -> 매력, 일처리 확실
    ko: "사람을 홀리는 치명적 매력",
    en: "Fatal Charm That Bewitches People",
    ja: "人を惑わす致命的な魅力",
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
    // 달의 은은함 -> 섬세한 배려, 차곡차곡 모음
    ko: "조용히 실속 챙기는 알부자",
    en: "Quietly Accumulating Wealth",
    ja: "静かに実利を得る隠れ金持ち",
  },
  태음_negative: {
    // 어두움 -> 우울, 현실 도피
    ko: "현실 도피형 방구석 몽상가",
    en: "Escapist Bedroom Daydreamer",
    ja: "現実逃避型の引きこもり夢想家",
  },

  // ========================================
  // 탐랑 (욕망성 - 다재다능, 도화)
  // ========================================
  탐랑_positive: {
    // 다재다능 -> 사교성, 센스
    ko: "어딜 가나 환영받는 분위기 메이커",
    en: "Welcome-Everywhere Mood Maker",
    ja: "どこでも歓迎されるムードメーカー",
  },
  탐랑_negative: {
    // 욕망 과다 -> 싫증, 유흥
    ko: "끝없는 욕망의 밑 빠진 독",
    en: "Bottomless Pit of Endless Desires",
    ja: "終わりのない欲望の底抜け瓶",
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
    // 구설수 -> 말실수, 부정적, 의심
    ko: "숨 쉬듯 불평하는 프로 불편러",
    en: "Professional Complainer Breathing Complaints",
    ja: "息をするように不平を言うプロ不快者",
  },

  // ========================================
  // 천상 (인덕성 - 봉사, 조력)
  // ========================================
  천상_positive: {
    // 도장/신용 -> 신뢰, 조력자
    ko: "모두가 믿고 맡기는 해결사",
    en: "Problem Solver Everyone Trusts",
    ja: "誰もが信じて任せるフィクサー",
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
    // 보호/어른 -> 리더십, 해결
    ko: "위기마다 나타나는 든든한 보호자",
    en: "Reliable Guardian Appearing in Crisis",
    ja: "危機のたびに現れる頼もしい保護者",
  },
  천량_negative: {
    // 잔소리/고리타분 -> 꼰대, 고독
    ko: "원칙만 따지는 고리타분한 선비",
    en: "Stuffy Scholar Obsessed with Principles",
    ja: "原則ばかり問う堅苦しいソンビ",
  },

  // ========================================
  // 칠살 (고독성 - 개척, 결단)
  // ========================================
  칠살_positive: {
    // 장군의 위엄 -> 추진력, 개척
    ko: "혼자서도 길을 여는 불도저",
    en: "Bulldozer Paving the Way Alone",
    ja: "一人でも道を切り開くブルドーザー",
  },
  칠살_negative: {
    ko: "타협을 모르는 고독한 독불장군",
    en: "Lonely General Who Knows No Compromise",
    ja: "妥協を知らない孤独な将軍",
  },

  // ========================================
  // 파군 (변동성 - 변화, 혁신)
  // ========================================
  파군_positive: {
    ko: "판을 뒤집는 과감한 승부사",
    en: "Bold Gambler Flipping the Table",
    ja: "盤をひっくり返す果敢な勝負師",
  },
  파군_negative: {
    ko: "수습 불가한 무계획 저지르기",
    en: "Unmanageable Unplanned Action",
    ja: "収拾不可能な無計画なやらかし",
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
